import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import 'swiper/css';
import { getQueryClient } from '../../../../application/client/queryClient';
import { addRecipePhoto, recipesQuery, removeRecipe } from '../api/client';
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
  const withPhotos = recipes.filter(recipe => recipe.photoFileId !== null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousIndex = useRef(0);

  const activeIndex = Math.max(0, withPhotos.findIndex(recipe => recipe.id === activeId));
  const activeRecipe = withPhotos[activeIndex];

  useEffect(() => {
    if (withPhotos.length === 0) {
      setActiveId(null);
      return;
    }
    if (!activeId || !withPhotos.some(recipe => recipe.id === activeId)) {
      setActiveId(withPhotos[Math.min(previousIndex.current, withPhotos.length - 1)].id);
    }
  }, [activeId, withPhotos]);

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
      const next = withPhotos.filter(recipe => recipe.id !== id);
      setActiveId(next[Math.min(activeIndex, next.length - 1)]?.id ?? null);
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
    onError: (mutationError: Error) => setOperationError(mutationError.message),
  });

  const changeActive = (id: string) => {
    const index = withPhotos.findIndex(recipe => recipe.id === id);
    if (index >= 0) previousIndex.current = index;
    setActiveId(id);
    setExpanded(false);
    setOperationError(null);
  };

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
        <h1>Noch keine Rezepte mit Foto</h1>
        <p>Füge einem Rezept ein Foto hinzu, um es hier anzusehen.</p>
      </div>
    );
    return (
      <>
        <div className={styles.background} inert={menuOpen || deleteOpen}>
          <RecipeCarousel recipes={withPhotos} activeId={activeRecipe.id} blocked={menuOpen || deleteOpen} onActiveChange={changeActive} />
          <RecipeSheet
            recipe={activeRecipe}
            index={activeIndex}
            count={withPhotos.length}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onNavigate={index => changeActive(withPhotos[index].id)}
            onPhoto={(file) => {
              setOperationError(null);
              photoMutation.mutate({ id: activeRecipe.id, file });
            }}
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
      <AppMenu open={menuOpen} onOpenChange={setMenuOpen} triggerRef={triggerRef} />
    </main>
  );
}
