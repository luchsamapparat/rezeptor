import { vi } from 'vitest';
import type { RecipeContents } from '../../recipeManagement';

type RecipeContentsMock = Partial<RecipeContents>;

export const azureOpenAIChatCompletionsCreateMock = vi.fn();

const AzureOpenAIConstructorMock = vi.fn(function AzureOpenAIClientMock() {
  return {
    chat: {
      completions: {
        create: azureOpenAIChatCompletionsCreateMock,
      },
    },
  };
});

export { AzureOpenAIConstructorMock as AzureOpenAI };

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

  azureOpenAIChatCompletionsCreateMock.mockReset();
  azureOpenAIChatCompletionsCreateMock.mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify(contents),
        },
      },
    ],
  });
}
