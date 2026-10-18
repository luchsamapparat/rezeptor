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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const previousIndex = useRef(0);

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

  useEffect(() => {
    if (!deleteOpen) return;
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, [deleteOpen]);

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => addRecipePhoto(id, file),
    onSuccess: async () => {
      setOperationError(null);
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (mutationError: Error) => setOperationError(mutationError.message),
  });
  const deleteMutation = useMutation({
    mutationFn: removeRecipe,
    onSuccess: async (_, id) => {
      setDeleteOpen(false);
      setExpanded(false);
      setOperationError(null);
      const next = recipes.filter(recipe => recipe.id !== id);
      setActiveId(next[Math.min(activeIndex, next.length - 1)]?.id ?? null);
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (mutationError: Error) => setOperationError(mutationError.message),
  });

  const changeActive = (id: string) => {
    const index = recipes.findIndex(recipe => recipe.id === id);
    if (index >= 0) previousIndex.current = index;
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
        <div className={styles.background} inert={menuOpen || deleteOpen}>
          <RecipeCarousel recipes={recipes} activeId={activeRecipe.id} blocked={menuOpen || deleteOpen || addRecipeOpen} onActiveChange={changeActive} />
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
            onDelete={() => {
              setOperationError(null);
              setDeleteOpen(true);
            }}
            pending={photoMutation.isPending || deleteMutation.isPending}
            error={operationError}
          />
        </div>
        <dialog ref={dialogRef} className={styles.deleteDialog} onClose={() => setDeleteOpen(false)}>
          <h2>Rezept löschen?</h2>
          <p>
            „
            {activeRecipe.title}
            “ wird dauerhaft gelöscht.
          </p>
          {deleteMutation.error && <p role="alert">{deleteMutation.error.message}</p>}
          <div className={styles.deleteDialogActions}>
            <button type="button" onClick={() => setDeleteOpen(false)} disabled={deleteMutation.isPending}>Abbrechen</button>
            <button type="button" onClick={() => deleteMutation.mutate(activeRecipe.id)} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Wird gelöscht …' : 'Löschen'}</button>
          </div>
        </dialog>
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
