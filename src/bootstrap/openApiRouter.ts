import { Router } from 'express';
import { generateRezeptorApiSpec, getOpenApiSpecJson } from '../useCases/openApiSpec';

export const openApiRouter = Router();

// Serve OpenAPI spec as JSON
openApiRouter.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(getOpenApiSpecJson());
});

// Serve OpenAPI spec as YAML (optional)
openApiRouter.get('/openapi.yaml', async (req, res) => {
  try {
    const yaml = await import('js-yaml');
    const spec = generateRezeptorApiSpec();
    const yamlSpec = yaml.dump(spec);
    
    res.setHeader('Content-Type', 'application/x-yaml');
    res.send(yamlSpec);
  }
  catch {
    res.status(500).json({ error: 'Failed to generate YAML spec' });
  }
});

// Serve Swagger UI (optional)
openApiRouter.get('/docs', (req, res) => {
  const swaggerUiHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Rezeptor API Documentation</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.18.2/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@4.18.2/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.presets.standalone
      ]
    });
  </script>
</body>
</html>`;
  
  res.send(swaggerUiHtml);
});
