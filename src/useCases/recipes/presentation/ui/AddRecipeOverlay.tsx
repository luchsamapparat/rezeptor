import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Apple, Book, BookCopy, BookMarked, BookPlus, Camera, Carrot, Croissant, Pizza, Soup } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router';
import { addRecipeFromPhoto, cookbooksQuery } from '../api/client';
import styles from './AddRecipeOverlay.module.css';
import { FeatureOverlay } from './FeatureOverlay';

type Props = {
  open: boolean;
  onClose: () => void;
  onRecipeCreated: (recipeId: string) => void;
  returnFocusRef: RefObject<HTMLElement | null>;
};

const loadingIcons = [Apple, Carrot, Croissant, Pizza, Soup];

export function AddRecipeOverlay({ open, onClose, onRecipeCreated, returnFocusRef }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'cookbook' | 'photo'>('cookbook');
  const [cookbookId, setCookbookId] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const { data: cookbooks = [], isPending: cookbooksPending, error: cookbooksError, refetch } = useQuery({
    ...cookbooksQuery(),
    enabled: open,
  });

  const addRecipeMutation = useMutation({
    mutationFn: (recipeFile: File) => addRecipeFromPhoto(recipeFile, cookbookId),
    onSuccess: async (recipe) => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      onRecipeCreated(recipe.id);
    },
  });
  const resetMutationRef = useRef(addRecipeMutation.reset);
  resetMutationRef.current = addRecipeMutation.reset;

  useEffect(() => {
    if (open) return;
    setStep('cookbook');
    setCookbookId('');
    resetMutationRef.current();
  }, [open]);

  useEffect(() => {
    if (addRecipeMutation.isPending) loadingRef.current?.focus();
  }, [addRecipeMutation.isPending]);

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [step]);

  const close = () => {
    if (!addRecipeMutation.isPending) onClose();
  };
  const selectedCookbook = cookbooks.find(cookbook => cookbook.id === cookbookId);

  const renderCookbookStep = () => {
    if (cookbooksPending) return <div className={styles.centerState} role="status">Kochbücher werden geladen …</div>;
    if (cookbooksError) return (
      <div className={styles.centerState} role="alert">
        <p>Kochbücher konnten nicht geladen werden.</p>
        <button className={styles.secondaryButton} type="button" onClick={() => void refetch()}>Erneut versuchen</button>
      </div>
    );

    return (
      <div className={styles.step}>
        <div className={styles.intro}>
          <h2>Kochbuch auswählen</h2>
          <p>Aus welchem Kochbuch kommt das Rezept?</p>
        </div>

        {cookbooks.length > 0
          ? (
              <div className={styles.cookbookList} aria-label="Kochbuch">
                {cookbooks.map(cookbook => (
                  <button
                    className={styles.cookbook}
                    key={cookbook.id}
                    type="button"
                    onClick={() => {
                      setCookbookId(cookbook.id);
                      setStep('photo');
                    }}
                  >
                    <Book aria-hidden="true" size={22} strokeWidth={1.5} />
                    <span className={styles.cookbookText}>
                      <strong>{cookbook.title}</strong>
                      <small>{cookbook.authors.map(({ name }) => name).join(', ')}</small>
                    </span>
                  </button>
                ))}
              </div>
            )
          : <p className={styles.empty}>Du hast noch kein Kochbuch angelegt.</p>}

        <Link className={`${styles.iconCta} ${styles.newCookbook}`} to="/admin/cookbooks">
          <BookPlus aria-hidden="true" size={32} strokeWidth={1.5} />
          <span>Neues Kochbuch</span>
        </Link>
      </div>
    );
  };

  const renderPhotoStep = () => {
    if (addRecipeMutation.isPending) return (
      <div ref={loadingRef} className={styles.loading} role="status" aria-live="polite" tabIndex={-1}>
        <div className={styles.loadingIcons} aria-hidden="true">
          {loadingIcons.map((Icon, index) => (
            <Icon className={styles.loadingIcon} key={Icon.displayName ?? index} size={52} strokeWidth={1.25} />
          ))}
        </div>
        <h2>Rezept wird verarbeitet</h2>
        <p>Das kann einen kleinen Moment dauern …</p>
      </div>
    );

    return (
      <div className={styles.step}>
        <div className={styles.intro}>
          <h2>Rezept fotografieren</h2>
          <p>Fotografiere das Rezept oder wähle ein Foto aus.</p>
        </div>
        <div className={styles.photoPrompt}>
          <button
            className={`${styles.iconCta} ${styles.photoCta}`}
            type="button"
            aria-label="Rezept fotografieren oder Bild auswählen"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera aria-hidden="true" size={32} strokeWidth={1.5} />
            <span>Foto auswählen</span>
          </button>
          <input
            ref={fileInputRef}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            aria-label="Rezept fotografieren oder Bild auswählen"
            tabIndex={-1}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) addRecipeMutation.mutate(file);
              event.target.value = '';
            }}
          />
          <p className={styles.changeCookbook}>
            Das Rezept ist nicht aus
            {' '}
            <strong>{selectedCookbook?.title ?? 'diesem Kochbuch'}</strong>
            ?
          </p>
          <button
            className={`${styles.iconCta} ${styles.changeCookbookCta}`}
            type="button"
            onClick={() => setStep('cookbook')}
          >
            <BookCopy aria-hidden="true" size={32} strokeWidth={1.5} />
            <span>Kochbuch ändern</span>
          </button>
        </div>
        {addRecipeMutation.error && (
          <div className={styles.error} role="alert">
            <p>Das Rezept konnte nicht verarbeitet werden. Bitte versuche es erneut.</p>
            <p className={styles.errorDetail}>{addRecipeMutation.error.message}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <FeatureOverlay
      icon={BookMarked}
      open={open}
      title="Rezept merken"
      closeDisabled={addRecipeMutation.isPending}
      contentRef={contentRef}
      onClose={close}
      returnFocusRef={returnFocusRef}
    >
      <div className={styles.stepViewport} data-step={step}>
        <div className={`${styles.stepPane} ${styles.cookbookPane}`} inert={step !== 'cookbook'}>
          {renderCookbookStep()}
        </div>
        <div className={`${styles.stepPane} ${styles.photoPane}`} inert={step !== 'photo'}>
          {renderPhotoStep()}
        </div>
      </div>
    </FeatureOverlay>
  );
}
