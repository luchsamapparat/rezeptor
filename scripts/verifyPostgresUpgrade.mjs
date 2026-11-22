import assert from 'node:assert/strict';
import { PrismaPg } from '@prisma/adapter-pg';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const targetImage = readFileSync(new URL('../docker-compose.yaml', import.meta.url), 'utf8').match(/image: (postgres:\S+)/)?.[1];
assert.ok(targetImage, 'Compose must specify a PostgreSQL image');
const runId = `rezeptor-pg-upgrade-${randomUUID()}`;
const label = 'rezeptor.upgrade-test';
const password = randomUUID();
const containers = [`${runId}-18`, `${runId}-target`];
const volumes = containers.map(name => `${name}-data`);

function docker(args, options = {}) {
  return execFileSync('docker', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...options });
}

async function startDatabase(name, volume, image) {
  docker(['volume', 'create', '--label', `${label}=${runId}`, volume]);
  docker([
    'run',
    '-d',
    '--name',
    name,
    '--label',
    `${label}=${runId}`,
    '--network',
    runId,
    '--mount',
    `type=volume,source=${volume},target=/var/lib/postgresql`,
    '-e',
    'POSTGRES_USER=rezeptor',
    '-e',
    `POSTGRES_PASSWORD=${password}`,
    '-e',
    'POSTGRES_DB=rezeptor',
    '-p',
    '127.0.0.1::5432',
    image,
  ]);
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      // Wait for the final server, not the temporary server used by initdb.
      docker(['exec', name, 'sh', '-ec', 'test "$(cat /proc/1/comm)" = postgres && pg_isready -U rezeptor -d rezeptor'], { stdio: 'pipe' });
      const port = docker(['port', name, '5432/tcp']).trim().split(':').at(-1);
      return `postgresql://rezeptor:${password}@127.0.0.1:${port}/rezeptor`;
    }
    catch {
      await setTimeout(250);
    }
  }
  throw new Error(`Database ${name} did not become ready`);
}

function prisma(connectionString, ...args) {
  execFileSync(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', ...args], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: 'inherit',
  });
}

function sql(container, query) {
  return docker(['exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', 'rezeptor', '-d', 'rezeptor', '-At'], { input: query }).trim();
}

function snapshot(container) {
  return sql(container, `SELECT json_build_object(
    'cookbooks', (SELECT json_agg(t ORDER BY t.id) FROM "Cookbook" t),
    'authors', (SELECT json_agg(t ORDER BY t.id) FROM "CookbookAuthor" t),
    'recipes', (SELECT json_agg(t ORDER BY t.id) FROM "Recipe" t),
    'ingredients', (SELECT json_agg(t ORDER BY t.id) FROM "Ingredient" t),
    'migrations', (SELECT json_agg(t ORDER BY t.id) FROM "_prisma_migrations" t)
  )::text;`);
}

function removeOwnedResource(kind, name, args) {
  try {
    const template = kind === 'container' ? `{{index .Config.Labels "${label}"}}` : `{{index .Labels "${label}"}}`;
    if (docker([kind, 'inspect', '--format', template, name], { stdio: 'pipe' }).trim() === runId) {
      docker(args);
    }
  }
  catch (error) {
    console.error(`Could not inspect or clean up temporary ${kind} ${name}: ${error.message}`);
  }
}

try {
  docker(['network', 'create', '--label', `${label}=${runId}`, runId]);
  console.log('Starting isolated PostgreSQL 18 source');
  const sourceUrl = await startDatabase(containers[0], volumes[0], 'postgres:18');
  prisma(sourceUrl, 'deploy');
  sql(containers[0], `BEGIN;
    INSERT INTO "Cookbook" (id, title) VALUES ('cookbook', 'Prüf-Kochbuch');
    INSERT INTO "CookbookAuthor" (id, "cookbookId", name, "sortOrder") VALUES ('author', 'cookbook', 'Test author', 0);
    INSERT INTO "Recipe" (id, title, instructions, "cookbookId", "pageNumber", "photoFileId", "recipeFileId")
      VALUES ('recipe', 'Crème fraîche', 'Mix and serve', 'cookbook', 42, 'photo-reference', 'source-reference'),
             ('incomplete', 'Remembered meal', NULL, NULL, NULL, NULL, NULL);
    INSERT INTO "Ingredient" (id, "recipeId", quantity, unit, name, notes, "sortOrder")
      VALUES ('ingredient', 'recipe', '1', 'cup', 'Crème fraîche', NULL, 0);
    COMMIT;`);
  const before = snapshot(containers[0]);

  console.log(`Starting isolated target ${targetImage}`);
  const targetUrl = await startDatabase(containers[1], volumes[1], targetImage);
  // Use the new server's pg_dump client; keep the binary archive out of shell pipelines.
  const archive = docker([
    'run',
    '--rm',
    '--network',
    runId,
    '-e',
    `PGPASSWORD=${password}`,
    targetImage,
    'pg_dump',
    '-h',
    containers[0],
    '-U',
    'rezeptor',
    '-d',
    'rezeptor',
    '-Fc',
  ], { encoding: 'buffer' });
  assert.ok(archive.length > 0, 'Dump archive must not be empty');
  docker([
    'exec',
    '-i',
    containers[1],
    'pg_restore',
    '-U',
    'rezeptor',
    '-d',
    'rezeptor',
    '--no-owner',
    '--exit-on-error',
    '--single-transaction',
  ], { input: archive });
  assert.equal(snapshot(containers[1]), before, 'Restored application data and migration history must match');
  prisma(targetUrl, 'deploy');
  prisma(targetUrl, 'status');
  // Resolve the generated TypeScript client's .js imports through the app's loader.
  const server = await createServer({ root, configFile: false, appType: 'custom', server: { middlewareMode: true } });
  try {
    const { PrismaClient } = await server.ssrLoadModule('/src/common/persistence/generated/client.ts');
    const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: targetUrl }) });
    try {
      const cookbook = await client.cookbook.findUniqueOrThrow({
        where: { id: 'cookbook' },
        include: { authors: true, recipes: { include: { ingredients: true } } },
      });
      assert.equal(cookbook.title, 'Prüf-Kochbuch');
      assert.equal(cookbook.authors[0].name, 'Test author');
      assert.equal(cookbook.recipes[0].ingredients[0].name, 'Crème fraîche');
      assert.equal((await client.recipe.findUniqueOrThrow({ where: { id: 'incomplete' } })).instructions, null);
    }
    finally {
      await client.$disconnect();
    }
  }
  finally {
    await server.close();
  }
  assert.equal(snapshot(containers[1]), before, 'Prisma deploy must preserve restored data');
  assert.equal(snapshot(containers[0]), before, 'The source must remain available for rollback');
  console.log('PASS: schema, recipe/cookbook data, Unicode, nulls, file references, and migration history survived the upgrade');
}
finally {
  containers.forEach(name => removeOwnedResource('container', name, ['rm', '-f', name]));
  volumes.forEach(name => removeOwnedResource('volume', name, ['volume', 'rm', name]));
  removeOwnedResource('network', runId, ['network', 'rm', runId]);
}
