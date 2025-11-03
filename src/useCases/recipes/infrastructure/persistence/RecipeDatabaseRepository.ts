import { eq, getTableColumns } from 'drizzle-orm';
import { groupBy } from 'lodash-es';
import type { Identifier } from '../../../../application/model/identifier';
import type { Database } from '../../../../common/persistence/database';
import { DatabaseRepository } from '../../../../common/persistence/DatabaseRepository';
import type { NewRecipe, Recipe, RecipeChanges, RecipeRepository, RecipeWithCookbook } from '../../recipeManagement';
import { cookbooksTable } from './cookbooksTable';
import { ingredientsTable, type IngredientEntity } from './ingredientsTable';
import { recipesTable, type RecipeEntity } from './recipesTable';

export class RecipeDatabaseRepository extends DatabaseRepository<typeof recipesTable> implements RecipeRepository {
  constructor(
    database: Database<{
      recipesTable: typeof recipesTable;
      cookbooksTable: typeof cookbooksTable;
      ingredientsTable: typeof ingredientsTable;
    }>,
  ) {
    super(database, recipesTable);
  }

  async insert({ ingredients, ...newRecipe }: NewRecipe): Promise<Recipe> {
    const recipeWithId = {
      id: crypto.randomUUID(),
      ...newRecipe,
    };

    const [recipeEntity] = await this.database.insert(recipesTable).values(recipeWithId).returning();

    let ingredientEntities: IngredientEntity[] = [];

    if (ingredients.length > 0) {
      const ingredientsWithId = ingredients.map((ingredient, index: number) => ({
        id: crypto.randomUUID(),
        recipeId: recipeEntity.id,
        sortOrder: index,
        ...ingredient,
      }));

      ingredientEntities = await this.database.insert(ingredientsTable).values(ingredientsWithId).returning();
    }

    return toRecipe(recipeEntity, ingredientEntities);
  }

  async update(recipeId: Identifier, { ingredients: ingredientChanges, ...recipeChanges }: RecipeChanges): Promise<Recipe | null> {
    const [updatedRecipeEntity] = await this.database
      .update(recipesTable)
      .set(recipeChanges)
      .where(eq(recipesTable.id, recipeId))
      .returning();

    if (updatedRecipeEntity === undefined) {
      return null;
    }

    if (ingredientChanges !== undefined) {
      await this.database.delete(ingredientsTable).where(eq(ingredientsTable.recipeId, recipeId));

      if (ingredientChanges.length > 0) {
        const ingredientsWithId = ingredientChanges.map((ingredient, index: number) => ({
          id: crypto.randomUUID(),
          recipeId: recipeId,
          sortOrder: index,
          ...ingredient,
        }));

        await this.database.insert(ingredientsTable).values(ingredientsWithId);
      }
    }

    const ingredientEntities = await this.database
      .select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipeId, recipeId))
      .orderBy(ingredientsTable.sortOrder);

    return toRecipe(updatedRecipeEntity, ingredientEntities);
  }

  async findById(recipeId: Identifier): Promise<Recipe | null> {
    const [recipeEntity] = await this.database
      .select()
      .from(recipesTable)
      .where(eq(recipesTable.id, recipeId));

    if (recipeEntity === undefined) {
      return null;
    }

    const ingredientEntities = await this.database
      .select()
      .from(ingredientsTable)
      .where(eq(ingredientsTable.recipeId, recipeId))
      .orderBy(ingredientsTable.sortOrder);

    return toRecipe(recipeEntity, ingredientEntities);
  }

  async getAllWithCookbooks(): Promise<RecipeWithCookbook[]> {
    const recipeEntitiesWithCookbooks = await this.database
      .select({
        ...getTableColumns(recipesTable),
        cookbook: getTableColumns(cookbooksTable),
      })
      .from(recipesTable)
      .leftJoin(cookbooksTable, eq(recipesTable.cookbookId, cookbooksTable.id));

    const ingredientEntitiesByRecipeId = groupBy(await this.database
      .select()
      .from(ingredientsTable)
      .orderBy(ingredientsTable.recipeId, ingredientsTable.sortOrder), 'recipeId');

    return recipeEntitiesWithCookbooks.map(recipeEntity => toRecipe(recipeEntity, ingredientEntitiesByRecipeId[recipeEntity.id]));
  }

  async deleteById(recipeId: Identifier): Promise<Recipe | null> {
    // Get recipe with ingredients before deletion
    const recipe = await this.findById(recipeId);

    if (!recipe) {
      return null;
    }

    // Delete ingredients (will cascade delete due to foreign key)
    await this.database.delete(ingredientsTable).where(eq(ingredientsTable.recipeId, recipeId));

    // Delete recipe
    await this.database.delete(recipesTable).where(eq(recipesTable.id, recipeId));

    return recipe;
  }
}

const toRecipe = <R extends RecipeEntity>(recipeEntity: R, ingredientEntities: IngredientEntity[]) => {
  return {
    ...recipeEntity,
    ingredients: ingredientEntities.map(({ id, sortOrder, ...ingredient }) => ingredient),
  };
};