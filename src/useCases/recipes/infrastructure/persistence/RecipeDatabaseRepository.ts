import type { Prisma } from '@prisma/client';
import { isArray } from 'lodash-es';
import type { Identifier } from '../../../../application/model/identifier';
import type { Logger } from '../../../../application/server/logging';
import type { DatabaseClient } from '../../../../common/persistence/database';
import { DatabaseRepository } from '../../../../common/persistence/DatabaseRepository';
import type { NewRecipe, Recipe, RecipeChanges, RecipeRepository, RecipeWithCookbook } from '../../recipeManagement';

export class RecipeDatabaseRepository extends DatabaseRepository implements RecipeRepository {
  constructor(
    private readonly database: DatabaseClient,
    log: Logger,
  ) {
    super(log);
  }

  async insert(newRecipe: NewRecipe): Promise<Recipe> {
    return this.database.recipe.create({
      data: {
        ...newRecipe,
        ingredients: {
          createMany: {
            data: newRecipe.ingredients.map((ingredient, index) => ({
              sortOrder: index,
              ...ingredient,
            })),
          },
        },
      },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async insertMany(newRecipes: NewRecipe[]): Promise<Recipe[]> {
    // Prisma does not support creating multiple records and multiple related records
    // https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#create-multiple-records-and-multiple-related-records
    return this.database.$transaction(async (tx: Prisma.TransactionClient) => {
      const recipes: Recipe[] = [];

      for (const newRecipe of newRecipes) {
        recipes.push(await tx.recipe.create({
          data: {
            ...newRecipe,
            ingredients: {
              createMany: {
                data: newRecipe.ingredients.map((ingredient, index) => ({
                  sortOrder: index,
                  ...ingredient,
                })),
              },
            },
          },
          include: {
            ingredients: { orderBy: { sortOrder: 'asc' } },
          },
        }));
      }

      return recipes;
    });
  }

  async update(recipeId: Identifier, recipeChanges: RecipeChanges): Promise<Recipe | null> {
    try {
      return await this.database.recipe.update({
        where: { id: recipeId },
        data: {
          ...recipeChanges,
          ingredients: isArray(recipeChanges.ingredients)
            ? {
                deleteMany: {},
                createMany: {
                  data: recipeChanges.ingredients.map((ingredient, index) => ({
                    sortOrder: index,
                    ...ingredient,
                  })),
                },
              }
            : undefined,
        },
        include: {
          ingredients: { orderBy: { sortOrder: 'asc' } },
        },
      });
    }
    catch (error: unknown) {
      return this.handleMissingEntityError(error);
    }
  }

  async findById(recipeId: Identifier): Promise<Recipe | null> {
    return this.database.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async getAll(): Promise<RecipeWithCookbook[]> {
    return this.database.recipe.findMany({
      include: {
        ingredients: { orderBy: { sortOrder: 'asc' } },
        cookbook: { include: { authors: { orderBy: { sortOrder: 'asc' } } } },
      },
      orderBy: { title: 'asc' },
    });
  }

  async delete(recipeId: Identifier): Promise<Recipe | null> {
    try {
      return await this.database.recipe.delete({
        where: { id: recipeId },
        include: {
          ingredients: { orderBy: { sortOrder: 'asc' } },
        },
      });
    }
    catch (error: unknown) {
      return this.handleMissingEntityError(error);
    }
  }
}
