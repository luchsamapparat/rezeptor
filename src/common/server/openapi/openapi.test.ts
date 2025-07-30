import { describe, it, expect } from 'vitest';
import { generateRezeptorApiSpec, getOpenApiSpecJson } from '../../../useCases/openApiSpec';

describe('OpenAPI Specification', () => {
  it('should generate a valid OpenAPI spec', () => {
    const spec = generateRezeptorApiSpec();
    
    expect(spec).toBeDefined();
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info.title).toBe('Rezeptor API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.paths).toBeDefined();
  });

  it('should include recipe endpoints', () => {
    const spec = generateRezeptorApiSpec();
    
    expect(spec.paths['/recipes']).toBeDefined();
    expect(spec.paths['/recipes'].get).toBeDefined();
    expect(spec.paths['/recipes'].post).toBeDefined();
    expect(spec.paths['/recipes/{recipeId}']).toBeDefined();
    expect(spec.paths['/recipes/{recipeId}/photo']).toBeDefined();
  });

  it('should include cookbook endpoints', () => {
    const spec = generateRezeptorApiSpec();
    
    expect(spec.paths['/cookbooks']).toBeDefined();
    expect(spec.paths['/cookbooks'].get).toBeDefined();
    expect(spec.paths['/cookbooks'].post).toBeDefined();
    expect(spec.paths['/cookbooks/{cookbookId}']).toBeDefined();
    expect(spec.paths['/cookbooks/identification']).toBeDefined();
  });

  it('should generate valid JSON', () => {
    const json = getOpenApiSpecJson();
    
    expect(() => JSON.parse(json)).not.toThrow();
    
    const parsed = JSON.parse(json);
    expect(parsed.openapi).toBe('3.0.0');
  });

  it('should include proper tags', () => {
    const spec = generateRezeptorApiSpec();
    
    const recipesGet = spec.paths['/recipes']?.get;
    expect(recipesGet?.tags).toContain('Recipes');
    
    const cookbooksGet = spec.paths['/cookbooks']?.get;
    expect(cookbooksGet?.tags).toContain('Cookbooks');
  });
});
