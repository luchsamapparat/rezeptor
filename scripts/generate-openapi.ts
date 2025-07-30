#!/usr/bin/env node

import { saveOpenApiSpec } from '../src/useCases/openApiSpec';
import { join } from 'path';

async function main() {
  try {
    const outputPath = join(process.cwd(), 'openapi.json');
    await saveOpenApiSpec(outputPath);
    console.log(`✅ OpenAPI specification generated successfully at: ${outputPath}`);
    
    // Also generate YAML version
    const yaml = await import('js-yaml');
    const fs = await import('fs/promises');
    const { generateRezeptorApiSpec } = await import('../src/useCases/openApiSpec');
    
    const spec = generateRezeptorApiSpec();
    const yamlPath = join(process.cwd(), 'openapi.yaml');
    await fs.writeFile(yamlPath, yaml.dump(spec));
    console.log(`✅ OpenAPI YAML specification generated successfully at: ${yamlPath}`);
  }
  catch (error) {
    console.error('❌ Failed to generate OpenAPI specification:', error);
    process.exit(1);
  }
}

main();
