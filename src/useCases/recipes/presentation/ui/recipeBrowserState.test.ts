import { describe, expect, it } from 'vitest';
import type { RecipeDto } from '../api/client';
import { clampSheetHeight, formatRecipeSource, getNextRecipeIdAfterRemoval, shouldExpandSheet } from './recipeBrowserState';

const recipe = (cookbook: RecipeDto['cookbook'], pageNumber: number | null) => ({ cookbook, pageNumber }) as RecipeDto;

describe('recipe source', () => {
  it('formats the available cookbook and page details', () => {
    const cookbook = { title: 'Asien Vegetarisch' } as RecipeDto['cookbook'];
    expect(formatRecipeSource(recipe(cookbook, 81))).toBe('Asien Vegetarisch, Seite 81');
    expect(formatRecipeSource(recipe(cookbook, null))).toBe('Asien Vegetarisch');
    expect(formatRecipeSource(recipe(null, 81))).toBe('Seite 81');
    expect(formatRecipeSource(recipe(null, null))).toBe('');
  });
});

describe('sheet snapping', () => {
  it('clamps drag height and favors a quick flick over distance', () => {
    expect(clampSheetHeight(99, 175, 319)).toBe(175);
    expect(clampSheetHeight(400, 175, 319)).toBe(319);
    expect(shouldExpandSheet(230, 0.5, 175, 319)).toBe(true);
    expect(shouldExpandSheet(270, -0.5, 175, 319)).toBe(false);
    expect(shouldExpandSheet(250, 0, 175, 319)).toBe(true);
  });
});

describe('recipe deletion navigation', () => {
  const recipes = ['first', 'second', 'third'].map(id => ({ id }) as RecipeDto);

  it('keeps the following recipe at the removed recipe position', () => {
    expect(getNextRecipeIdAfterRemoval(recipes, 'second')).toBe('third');
  });

  it('wraps to the first recipe when removing the last recipe', () => {
    expect(getNextRecipeIdAfterRemoval(recipes, 'third')).toBe('first');
    expect(getNextRecipeIdAfterRemoval([recipes[0]], 'first')).toBeNull();
  });
});
