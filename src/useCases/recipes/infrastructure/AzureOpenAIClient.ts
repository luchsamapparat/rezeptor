import { isNull } from 'lodash-es';
import { AzureOpenAI } from 'openai';
import z, { ZodType } from 'zod';
import { ExternalServiceError } from '../../../common/server/error';
import { getFileSize } from '../../../common/server/file';
import { resizeImage } from '../../../common/server/image';
import type { RecipeContents, RecipeExtractionService } from '../recipeManagement';

type Prompts = {
  systemPrompt: string;
  userPrompt: string;
};

type AzureOpenAIClientOptions = {
  endpoint: string;
  key: string;
  deployment: string;
  model: string;
  instructions: Prompts;
};

export class AzureOpenAIClient implements RecipeExtractionService {
  private apiClient: AzureOpenAI;
  private model: string;
  private instructions: Prompts;

  constructor({ endpoint, key, deployment, model, instructions }: AzureOpenAIClientOptions) {
    this.apiClient = new AzureOpenAI({
      endpoint,
      apiKey: key,
      deployment,
      // see https://learn.microsoft.com/en-us/azure/ai-foundry/openai/reference
      apiVersion: '2025-04-01-preview',
    });
    this.model = model;
    this.instructions = instructions;
  }

  async extractRecipeContents(file: File): Promise<RecipeContents> {
    const document = (getFileSize(file) < 4) ? file : await resizeImage (file, 2048);

    let response: Awaited<ReturnType<typeof this.apiClient.chat.completions.create>>;

    try {
      response = await this.apiClient.chat.completions.create({
        messages: [
          { role: 'system', content: this.instructions.systemPrompt },
          {
            role: 'user', content: [
              { type: 'text', text: this.instructions.userPrompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${Buffer.from(await document.arrayBuffer()).toString('base64')}` } },
            ],
          },
        ],
        response_format: {
          type: 'json_schema', json_schema: {
            name: 'recipeContentSchema',
            schema: z.toJSONSchema(recipeContentSchema),
          },
        },
        model: this.model,
      });
    }
    catch (error) {
      throw new ExternalServiceError('Failed to communicate with OpenAI API.', error);
    }

    let responseJson: unknown;
    try {
      const responseContent = response.choices[0].message.content;
      responseJson = isNull(responseContent) ? null : JSON.parse(responseContent);
    }
    catch (error) {
      throw new ExternalServiceError(`Failed to parse JSON response from OpenAI: ${JSON.stringify(response.choices[0].message.content)}`, error);
    }

    const result = recipeContentSchema.safeParse(responseJson);

    if (result.success) {
      return result.data;
    }
    else {
      throw new ExternalServiceError(`Response JSON does not match expected schema: ${JSON.stringify(responseJson)}`, result.error);
    }
  }
}

const recipeContentSchema = z.object({
  title: z.string().nullable(),
  pageNumber: z.number().nullable(),
  content: z.string(),
}) satisfies ZodType<RecipeContents>;