# Recipe Photo and Completion Workflow

## Objective

Support two distinct ways to add a recipe:

- **Rezept hinzufügen** keeps the existing workflow: select a cookbook and upload a photographed written recipe for extraction.
- **Essen merken** adds a new workflow: upload a photo of prepared food, then enter a title. The resulting recipe can be completed later.

Terminology is strict:

- **Photo** means a photo of prepared food and uses `photoFile` / `photoFileId`.
- **Recipe** means a photographed written recipe used for extraction and uses `recipeFile` / `recipeFileId`.
- Do not use the combined term “recipe photo” in APIs, code symbols, schemas, UI text, tests, or comments.

Recipe state is derived rather than persisted:

```ts
const isComplete = recipe.cookbookId !== null;
```

- A complete recipe has a cookbook reference.
- An incomplete recipe has no cookbook reference.
- Instructions are nullable; missing instructions are stored as `null`. A Prisma migration makes the column nullable and converts existing blank values to `null`. No status column is required.

Existing uncommitted UI work must be preserved. In particular, build on the current changes in `RecipeSheet`, `RecipeActions`, `RecipeBrowserController`, `AppMenu`, and `AddRecipeOverlay`; do not revert or overwrite unrelated work.

## API Contract

| Method and endpoint | Purpose | Multipart fields |
| --- | --- | --- |
| `POST /api/recipes/from-recipe` | Create a complete recipe through the existing extraction workflow | `cookbookId`, `recipeFile` |
| `POST /api/recipes/from-photo` | Create an incomplete recipe through “Essen merken” | `title`, `photoFile` |
| `POST /api/recipes/:recipeId/from-recipe` | Complete an existing incomplete recipe | `cookbookId`, `recipeFile` |
| `PUT /api/recipes/:recipeId/photo` | Add or replace the prepared-food photo | `photoFile` |
| `GET /api/recipes/:recipeId/photo` | Retrieve the prepared-food photo | optional `variant` query |

## Step 1: Rename the Existing Recipe Extraction Workflow

Implement this step before adding the new `/from-photo` endpoint.

Change the current endpoint:

```text
POST /api/recipes/from-photo
```

to:

```text
POST /api/recipes/from-recipe
```

The request remains multipart but `cookbookId` becomes required so this workflow always creates a complete recipe:

```text
cookbookId: UUID
recipeFile: image
```

Rename the corresponding symbols consistently:

- `addRecipeFromPhoto` to `addRecipeFromRecipe`
- `AddRecipeFromPhotoArgs` to `AddRecipeFromRecipeArgs`
- `addRecipeFromPhotoDtoSchema` to `addRecipeFromRecipeDtoSchema`
- `AddFromPhotoRecipeDto` to `AddRecipeFromRecipeDto`
- client `addRecipeFromPhoto()` to `addRecipeFromRecipe()`
- related mutation, fixture, test, comment, and logging names

The existing `AddRecipeOverlay` continues to implement this workflow:

1. Select a cookbook.
2. Upload the photographed written recipe.
3. Extract and create the complete recipe.

Rename the legacy admin presentation consistently:

- `RecipeFromPhotoController.tsx` to `RecipeFromRecipeController.tsx`
- `/admin/recipes/from-photo` to `/admin/recipes/from-recipe`
- “Upload from Photo” to “Upload from Recipe”
- update `adminRoutes.ts`, imports, client calls, and mutation names

## Step 2: Add the Essen Merken Workflow

After Step 1 frees the route, add:

```text
POST /api/recipes/from-photo
```

Request:

```text
title: string
photoFile: image
```

Add `addRecipeFromPhoto` to `recipeManagement.ts`. It must:

1. Trim and validate the title.
2. Save the photo and its preview/display variants.
3. Insert a recipe with:
   - the entered title;
   - the stored `photoFileId`;
   - `cookbookId: null`;
   - `recipeFileId: null`;
   - `pageNumber: null`;
   - `instructions: null`;
   - an empty ingredient list.
4. Remove the saved photo and variants if persistence fails.
5. Return `201`.

Use these names:

- `AddRecipeFromPhotoArgs`
- `addRecipeFromPhotoDtoSchema`
- `AddRecipeFromPhotoDto`
- client `addRecipeFromPhoto(title, photoFile)`

Extend the App Menu with two separate actions:

- **Rezept hinzufügen** opens the existing recipe extraction workflow.
- **Essen merken** opens the new photo-first workflow.

Use separate callbacks such as `onAddRecipe` and `onRememberFood`.

Add a separate route-backed overlay, using `/recipes/remember`, with this sequence:

1. Ask the user to upload or take a photo.
2. Show a preview and allow the photo to be replaced.
3. Ask for the title.
4. Submit both values through `addRecipeFromPhoto`.
5. Invalidate the recipes query and navigate to the new recipe.

The workflow must not ask for a cookbook or `recipeFile`. Preserve the established loading, error, retry, focus-restoration, and close-protection behavior.

The existing `/recipes/new` route remains the route for “Rezept hinzufügen”.

## Step 3: Complete an Incomplete Recipe

Add:

```text
POST /api/recipes/:recipeId/from-recipe
```

Request:

```text
cookbookId: UUID
recipeFile: image
```

Add `completeRecipeFromRecipe` to `recipeManagement.ts`. It must:

1. Verify that the recipe exists before invoking extraction.
2. Extract the recipe contents from `recipeFile`.
3. Save the recipe file.
4. Update `cookbookId`, `recipeFileId`, title, instructions, ingredients, and page number.
5. Preserve `photoFileId`.
6. Remove the newly saved recipe file if persistence fails.
7. Remove a replaced recipe file only after the database update succeeds.

A non-empty detected title replaces the title entered during “Essen merken”. If extraction produces no usable title, retain the existing title because recipes require a title.

Use these names:

- `CompleteRecipeFromRecipeArgs`
- `completeRecipeFromRecipeDtoSchema`
- `CompleteRecipeFromRecipeDto`
- client `completeRecipeFromRecipe(recipeId, cookbookId, recipeFile)`

Return `200`; return `404` for a missing recipe and `422` for invalid input.

## Step 4: Make Recipe Sheet Actions State Dependent

Derive completeness from `recipe.cookbookId !== null`.

For a complete recipe, keep the current Recipe Sheet UI unchanged:

- “Bearbeiten”
- “Foto hinzufügen” or “Foto ersetzen”
- “Löschen”
- existing inline editing

For an incomplete recipe, replace only “Bearbeiten” with “Vervollständigen”. Keep the photo and delete actions available.

“Vervollständigen” must not activate inline editing. It opens a route-backed completion workflow at `/recipes/:recipeId/complete`:

1. Select a cookbook.
2. Upload the photographed written recipe.
3. Call `completeRecipeFromRecipe`.
4. Refresh the recipes query.
5. Close the completion overlay.

After success, `cookbookId` is non-null, so the Recipe Sheet naturally returns to the complete state and displays “Bearbeiten”.

## Step 5: Integrate Routing and Controller State

Add or retain these routes:

```text
/recipes/new
/recipes/remember
/recipes/:recipeId
/recipes/:recipeId/complete
```

Update `RecipeBrowserController` to:

- derive which creation or completion overlay is open from the route;
- provide separate handlers for “Rezept hinzufügen” and “Essen merken”;
- add the completion mutation;
- block carousel interaction while any overlay or relevant mutation is active;
- preserve the selected recipe and focus restoration;
- keep inline editing available only through the complete-recipe action;
- include creation, completion, edit, photo, and delete operations in the appropriate pending states.

## Step 6: Tighten API Validation

Update the API schemas to:

- require a trimmed, non-empty title for `/from-photo`;
- require `cookbookId` for both `/from-recipe` endpoints;
- validate cookbook and recipe IDs with `identifierSchema`;
- require image MIME types for `photoFile` and `recipeFile`;
- accept only positive integer page numbers where supplied;
- remove `photoFileId` and `recipeFileId` from public JSON add/edit schemas because storage IDs are server-managed.

## Step 7: Update Request Examples

Update `examples/requests.http`.

Replace the existing extraction example with:

```http
### add complete recipe
POST http://localhost:3000/api/recipes/from-recipe
Content-Type: multipart/form-data; boundary=...

cookbookId
your-cookbook-id-here

recipeFile
< ./recipe1.jpg
```

Add the new workflow:

```http
### remember food
POST http://localhost:3000/api/recipes/from-photo
Content-Type: multipart/form-data; boundary=...

photoFile
< ./photo1.jpg

title
Roasted Eggplant
```

Add completion:

```http
### complete an existing recipe
POST http://localhost:3000/api/recipes/:id/from-recipe
Content-Type: multipart/form-data; boundary=...

cookbookId
your-cookbook-id-here

recipeFile
< ./recipe1.jpg
```

Remove server-managed `photoFileId` and `recipeFileId` from the manual JSON creation example.

## Step 8: Test the Workflows and Failure Handling

Update `recipeManagement.integration.test.ts` and `recipeMockData.ts` to cover:

- direct complete creation through `/from-recipe`;
- the required cookbook for direct complete creation;
- incomplete creation through `/from-photo`;
- `cookbookId: null` and stored photo variants after “Essen merken”;
- completion through `/:recipeId/from-recipe`;
- the extracted title replacing the manually entered title;
- the existing title being retained when extraction returns no title;
- the prepared-food photo being preserved during completion;
- the transition from incomplete to complete;
- the correct Recipe Sheet action for each state;
- missing fields, invalid UUIDs, non-image uploads, and missing recipes;
- cleanup after extraction, storage, or persistence failures where practical;
- replacement of an existing `recipeFile`;
- deletion cleanup for both file types.

Do not add UI component tests. Cover UI behavior with Playwright integration tests only when Playwright integration-test work and infrastructure are in scope.

## Validation

Run the checks relevant to the completed changes:

```text
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

Include the nullable-instructions migration. Report any check that cannot be run and do not commit unless explicitly requested.
