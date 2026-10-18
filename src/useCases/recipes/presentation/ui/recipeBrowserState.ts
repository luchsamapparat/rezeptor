import type { RecipeDto } from '../api/client';

export const formatRecipeSource = (recipe: RecipeDto) => {
  const title = recipe.cookbook?.title?.trim();
  const page = recipe.pageNumber === null ? null : `Seite ${recipe.pageNumber}`;
  return [title, page].filter(Boolean).join(', ');
};

export const clampSheetHeight = (height: number, collapsed: number, expanded: number) =>
  Math.min(expanded, Math.max(collapsed, height));

export const shouldExpandSheet = (height: number, velocity: number, collapsed: number, expanded: number) => {
  if (Math.abs(velocity) > 0.35) return velocity > 0;
  return height >= (collapsed + expanded) / 2;
};

export const getNextRecipeIdAfterRemoval = (recipes: RecipeDto[], removedId: string) => {
  const removedIndex = recipes.findIndex(recipe => recipe.id === removedId);
  if (removedIndex < 0 || recipes.length < 2) return null;

  return recipes[(removedIndex + 1) % recipes.length].id;
};
