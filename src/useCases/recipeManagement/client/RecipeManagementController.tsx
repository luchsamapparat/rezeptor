import { useEffect } from 'react';

export default function RecipeManagementController() {
  useEffect(() => {
    (async () => {
      const response = await fetch('/api/recipes');
      console.log('🍨🍨🍨🍨', await response.json());
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const response = await fetch('/api/cookbooks');
      console.log('📚📚📚📚', await response.json());
    })();
  }, []);

  return (
    <h1>Recipes</h1>
  );
}
