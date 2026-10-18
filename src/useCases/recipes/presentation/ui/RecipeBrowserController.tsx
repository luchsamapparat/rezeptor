import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import 'swiper/css';
import { getQueryClient } from '../../../../application/client/queryClient';
import { addRecipePhoto, recipesQuery, removeRecipe } from '../api/client';
import { AddRecipeOverlay } from './AddRecipeOverlay';
import { AppMenu } from './AppMenu';
import { RecipeCarousel } from './RecipeCarousel';
import { RecipeSheet } from './RecipeSheet';
import { getNextRecipeIdAfterRemoval } from './recipeBrowserState';
import type { Route } from './+types/RecipeBrowserController';
import './RecipeBrowser.css';
import styles from './RecipeBrowser.module.css';

export const loader = async ({ context }: Route.LoaderArgs) => ({
  recipes: await getQueryClient(context).ensureQueryData(recipesQuery()).catch(() => null),
});

export default function RecipeBrowserController({ loaderData }: Route.ComponentProps) {
  const queryClient = useQueryClient();
  const { data: recipes = [], isPending, error, refetch } = useQuery(recipesQuery({ initialData: loaderData.recipes ?? undefined }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addRecipeOpen, setAddRecipeOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const previousIndex = useRef(0);
  const deleteTimerRef = useRef<number | null>(null);
  const pendingDeleteIdRef = useRef<string | null>(null);
  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;

  const activeIndex = Math.max(0, recipes.findIndex(recipe => recipe.id === activeId));
  const activeRecipe = recipes[activeIndex];

  useEffect(() => {
    if (recipes.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !recipes.some(recipe => recipe.id === activeId)) {
      setActiveId(recipes[Math.min(previousIndex.current, recipes.length - 1)].id);
    }
  }, [activeId, recipes]);

  useEffect(() => () => {
    if (deleteTimerRef.current !== null) window.clearTimeout(deleteTimerRef.current);
  }, []);

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => addRecipePhoto(id, file),
    onSuccess: async () => {
      setOperationError(null);
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (mutationError: Error) => setOperationError(mutationError.message),
  });
  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; redirectToId?: string | null }) => removeRecipe(id),
    onSuccess: async (_, { redirectToId }) => {
      setExpanded(false);
      setOperationError(null);
      if (redirectToId !== undefined) setActiveId(redirectToId);
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (mutationError: Error) => setOperationError(mutationError.message),
  });

  const cancelPendingDeletion = () => {
    if (deleteTimerRef.current !== null) window.clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = null;
    pendingDeleteIdRef.current = null;
    setPendingDeleteId(null);
  };

  const commitPendingDeletion = (redirectToId?: string | null) => {
    const id = pendingDeleteIdRef.current;
    if (!id) return;

    cancelPendingDeletion();
    deleteMutation.mutate({ id, redirectToId });
  };

  const togglePendingDeletion = () => {
    if (pendingDeleteIdRef.current === activeRecipe?.id) {
      cancelPendingDeletion();
      return;
    }
    if (!activeRecipe || deleteMutation.isPending) return;

    setOperationError(null);
    pendingDeleteIdRef.current = activeRecipe.id;
    setPendingDeleteId(activeRecipe.id);
    deleteTimerRef.current = window.setTimeout(() => {
      const id = pendingDeleteIdRef.current;
      if (!id) return;
      commitPendingDeletion(getNextRecipeIdAfterRemoval(recipesRef.current, id));
    }, 5_000);
  };

  const changeActive = (id: string) => {
    const index = recipes.findIndex(recipe => recipe.id === id);
    if (index >= 0) previousIndex.current = index;
    if (pendingDeleteIdRef.current && pendingDeleteIdRef.current !== id) commitPendingDeletion();
    setActiveId(id);
    setExpanded(false);
    setOperationError(null);
  };

  const choosePhoto = () => photoInputRef.current?.click();

  const renderContent = () => {
    if (isPending) return <div className={styles.state} role="status"><h1>Rezepte werden geladen …</h1></div>;
    if (error) return (
      <div className={styles.state} role="alert">
        <h1>Rezepte konnten nicht geladen werden.</h1>
        <button type="button" onClick={() => void refetch()}>Erneut versuchen</button>
      </div>
    );
    if (!activeRecipe) return (
      <div className={styles.state}>
        <h1>Noch keine Rezepte</h1>
      </div>
    );
    return (
      <>
        <div className={styles.background} inert={menuOpen}>
          <RecipeCarousel recipes={recipes} activeId={activeRecipe.id} blocked={menuOpen || addRecipeOpen || deleteMutation.isPending} onActiveChange={changeActive} />
          <button
            className={`${styles.addPhoto} swiper-no-swiping`}
            type="button"
            data-visible={activeRecipe.photoFileId === null || undefined}
            aria-hidden={activeRecipe.photoFileId !== null}
            tabIndex={activeRecipe.photoFileId === null ? 0 : -1}
            disabled={activeRecipe.photoFileId !== null || photoMutation.isPending || deleteMutation.isPending}
            onClick={choosePhoto}
          >
            <ImagePlus aria-hidden="true" size={32} strokeWidth={1.5} />
            <span>Foto hinzufügen</span>
          </button>
          <input
            ref={photoInputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            aria-label="Rezeptfoto auswählen"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setOperationError(null);
                photoMutation.mutate({ id: activeRecipe.id, file });
              }
              event.target.value = '';
            }}
          />
          <RecipeSheet
            recipe={activeRecipe}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onPhoto={choosePhoto}
            onDelete={togglePendingDeletion}
            pending={photoMutation.isPending || deleteMutation.isPending}
            deletionPending={pendingDeleteId === activeRecipe.id}
            error={operationError}
          />
        </div>
      </>
    );
  };

  return (
    <main className={styles.browser} data-recipe-browser>
      {renderContent()}
      <AppMenu
        open={menuOpen}
        onAddRecipe={() => {
          setMenuOpen(false);
          setAddRecipeOpen(true);
        }}
        onOpenChange={setMenuOpen}
        restoreFocus={!addRecipeOpen}
        triggerRef={triggerRef}
      />
      <AddRecipeOverlay
        open={addRecipeOpen}
        onClose={() => setAddRecipeOpen(false)}
        onRecipeCreated={(recipeId) => {
          setActiveId(recipeId);
          setExpanded(false);
          setAddRecipeOpen(false);
        }}
        returnFocusRef={triggerRef}
      />
    </main>
  );
}
