import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Check, Utensils } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { addRecipeFromPhoto } from '../api/client';
import styles from './AddRecipeOverlay.module.css';
import { FeatureOverlay } from './FeatureOverlay';
import sheetStyles from './RecipeSheet.module.css';
import foodStyles from './RememberFoodOverlay.module.css';

type Props = {
  open: boolean;
  onClose: () => void;
  onRecipeCreated: (recipeId: string) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
  onPendingChange?: (pending: boolean) => void;
};

export function RememberFoodOverlay({ open, onClose, onRecipeCreated, returnFocusRef, onPendingChange }: Props) {
  const queryClient = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const mutation = useMutation({
    mutationFn: () => addRecipeFromPhoto(title.trim(), photoFile!),
    onSuccess: async (recipe) => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      onRecipeCreated(recipe.id);
    },
  });
  const resetMutationRef = useRef(mutation.reset);
  resetMutationRef.current = mutation.reset;

  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  useEffect(() => {
    if (open) return;
    setPhotoFile(null);
    setTitle('');
    resetMutationRef.current();
  }, [open]);

  useEffect(() => {
    if (mutation.isPending) loadingRef.current?.focus();
    else if (open && photoFile) titleInputRef.current?.focus();
  }, [mutation.isPending, open, photoFile]);

  useEffect(() => onPendingChange?.(mutation.isPending), [mutation.isPending, onPendingChange]);

  const close = () => {
    if (!mutation.isPending) onClose();
  };

  return (
    <FeatureOverlay icon={Utensils} open={open} title="Essen merken" closeDisabled={mutation.isPending} onClose={close} returnFocusRef={returnFocusRef}>
      {mutation.isPending
        ? (
            <div ref={loadingRef} className={styles.loading} role="status" tabIndex={-1}>
              <h2>Essen wird gespeichert …</h2>
            </div>
          )
        : (
            <form
              className={styles.step}
              onSubmit={(event) => {
                event.preventDefault();
                if (photoFile && title.trim()) mutation.mutate();
              }}
            >
              <div className={styles.intro}>
                <h2>{photoFile ? 'Wie heißt das Essen?' : 'Essen fotografieren'}</h2>
                <p>{photoFile ? 'Gib einen Titel ein. Das Rezept kannst du später vervollständigen.' : 'Fotografiere das fertige Essen oder wähle ein Foto aus.'}</p>
              </div>
              {!photoFile && (
                <div className={styles.photoPrompt}>
                  <button className={`${styles.iconCta} ${styles.photoCta}`} type="button" onClick={() => fileInputRef.current?.click()}>
                    <Camera aria-hidden="true" size={32} strokeWidth={1.5} />
                    <span>Foto auswählen</span>
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                className={styles.fileInput}
                type="file"
                accept="image/*"
                aria-label="Essen fotografieren oder Bild auswählen"
                tabIndex={-1}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setPhotoFile(file);
                  event.target.value = '';
                }}
              />
              {photoFile && (
                <div className={foodStyles.details}>
                  {previewUrl && <img className={foodStyles.photo} src={previewUrl} alt="Ausgewähltes Essen" />}
                  <div className={`${sheetStyles.field} ${sheetStyles.titleField} ${foodStyles.title}`}>
                    <input
                      ref={titleInputRef}
                      id="remember-food-title"
                      aria-label="Titel"
                      placeholder={title === '' ? 'Titel' : undefined}
                      value={title}
                      required
                      onChange={event => setTitle(event.target.value)}
                    />
                  </div>
                  <button className={`${styles.iconCta} ${foodStyles.saveCta}`} type="submit" disabled={!title.trim()}>
                    <Check aria-hidden="true" size={32} strokeWidth={1.5} />
                    <span>Essen merken</span>
                  </button>
                </div>
              )}
              {mutation.error && <p className={styles.error} role="alert">{mutation.error.message}</p>}
            </form>
          )}
    </FeatureOverlay>
  );
}
