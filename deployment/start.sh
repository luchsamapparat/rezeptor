npx prisma migrate deploy
node \
  --import="data:text/javascript,import{register}from'node:module';import{pathToFileURL}from'node:url';register('@opentelemetry/instrumentation/hook.mjs',pathToFileURL('./'));export{}" \
  --import="@opentelemetry/auto-instrumentations-node/register" \
  /app/dist/server/index.js