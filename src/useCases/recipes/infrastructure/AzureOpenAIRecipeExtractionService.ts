import {
  ATTR_EXCEPTION_MESSAGE,
  ATTR_EXCEPTION_TYPE,
  ATTR_FILE_NAME,
  ATTR_FILE_SIZE,
  ATTR_GEN_AI_RESPONSE_MODEL,
} from '@opentelemetry/semantic-conventions/incubating';
import { isNull } from 'lodash-es';
import { AzureOpenAI } from 'openai';
import z, { type ZodType } from 'zod';
import type { Logger } from '../../../application/server/logging';
import { ExternalServiceError } from '../../../common/server/error';
import { getFileSize } from '../../../common/server/file';
import { resizeImage } from '../../../common/server/image';
import type { RecipeContents, RecipeExtractionService } from '../recipeManagement';

type Prompts = {
  systemPrompt: string;
  userPrompt: string;
};

export class AzureOpenAIRecipeExtractionService implements RecipeExtractionService {
  constructor(
    private apiClient: AzureOpenAI,
    private model: string,
    private instructions: Prompts,
    private readonly log: Logger,
  ) { }

  async extractRecipeContents(file: File): Promise<RecipeContents> {
    const fileSize = getFileSize(file);
    this.log.debug({
      [ATTR_FILE_NAME]: file.name,
      [ATTR_FILE_SIZE]: fileSize,
      [ATTR_GEN_AI_RESPONSE_MODEL]: this.model,
    }, 'Starting recipe extraction');

    const document = fileSize < 4 ? file : await resizeImage(file, 2048);

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

      this.log.debug({
        [ATTR_GEN_AI_RESPONSE_MODEL]: this.model,
      }, 'Received response from OpenAI');
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.log.error({
        [ATTR_EXCEPTION_TYPE]: err.constructor.name,
        [ATTR_EXCEPTION_MESSAGE]: err.message,
        [ATTR_FILE_NAME]: file.name,
        [ATTR_GEN_AI_RESPONSE_MODEL]: this.model,
      }, 'Failed to communicate with OpenAI API');
      throw new ExternalServiceError('Failed to communicate with OpenAI API.', error);
    }

    let responseJson: unknown;
    try {
      const responseContent = response.choices[0].message.content;
      responseJson = isNull(responseContent) ? null : JSON.parse(responseContent);
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.log.error({
        [ATTR_EXCEPTION_TYPE]: err.constructor.name,
        [ATTR_EXCEPTION_MESSAGE]: err.message,
        response: response.choices[0].message.content,
      }, 'Failed to parse JSON response from OpenAI');
      throw new ExternalServiceError(`Failed to parse JSON response from OpenAI: ${JSON.stringify(response.choices[0].message.content)}`, error);
    }

    const result = recipeContentSchema.safeParse(responseJson);

    if (result.success) {
      this.log.info({
        'rezeptor.recipe.title': result.data.title,
      }, 'Recipe extracted successfully');
      return result.data;
    }
    else {
      this.log.error({
        [ATTR_EXCEPTION_TYPE]: 'ValidationError',
        [ATTR_EXCEPTION_MESSAGE]: JSON.stringify(result.error.issues),
        responseJson,
      }, 'Response JSON does not match expected schema');
      throw new ExternalServiceError(`Response JSON does not match expected schema: ${JSON.stringify(responseJson)}`, result.error);
    }
  }
}

const recipeContentSchema = z.object({
  title: z.string().nullable(),
  pageNumber: z.number().nullable(),
  instructions: z.string(),
  ingredients: z.array(z.object({
    quantity: z.string().nullable(),
    unit: z.string().nullable(),
    name: z.string(),
    notes: z.string().nullable(),
  })),
}) satisfies ZodType<RecipeContents>;