import { vi } from 'vitest';
import type { RecipeContents } from '../../recipeManagement';

type RecipeContentsMock = Partial<RecipeContents>;

export const azureOpenAIMock = {
  chat: {
    completions: {
      create: vi.fn(),
    },
  },
};

export function setupAzureOpenAIMock(recipeContents: RecipeContentsMock = {}) {
  const defaultContents: RecipeContents = {
    title: null,
    pageNumber: null,
    content: '',
  };

  const contents: RecipeContents = {
    ...defaultContents,
    ...recipeContents,
  };

  azureOpenAIMock.chat.completions.create.mockReset();
  azureOpenAIMock.chat.completions.create.mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify(contents),
        },
      },
    ],
  });
}
