import { useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { CookbookDto, EditRecipeDto, RecipeDto } from '../api/client';
import { RecipeActions } from './RecipeActions';
import styles from './RecipeSheet.module.css';
import { clampSheetHeight, formatRecipeSource, shouldExpandSheet } from './recipeBrowserState';

type Props = {
  recipe: RecipeDto;
  cookbooks: CookbookDto[];
  expanded: boolean;
  editing: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onSave: (changes: Pick<EditRecipeDto, 'title' | 'cookbookId' | 'pageNumber'>) => void;
  onPhoto: () => void;
  onDelete: () => void;
  pending: boolean;
  editPending: boolean;
  photoPending: boolean;
  deletionPending: boolean;
  error: string | null;
};

const EXPANSION_HEIGHT = 144;

export function RecipeSheet({ recipe, cookbooks, expanded, editing, onExpandedChange, onEdit, onComplete, onCancel, onSave, onPhoto, onDelete, pending, editPending, photoPending, deletionPending, error }: Props) {
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [optimisticExpanded, setOptimisticExpanded] = useState<boolean | null>(null);
  const [title, setTitle] = useState(recipe.title);
  const [cookbookId, setCookbookId] = useState(recipe.cookbookId ?? '');
  const [pageNumber, setPageNumber] = useState(recipe.pageNumber?.toString() ?? '');
  const [, updateMeasurement] = useReducer(revision => revision + 1, 0);
  const [editSource, setEditSource] = useState({ editing, id: recipe.id, title: recipe.title, cookbookId: recipe.cookbookId, pageNumber: recipe.pageNumber });
  if (optimisticExpanded !== null && optimisticExpanded === expanded) setOptimisticExpanded(null);
  if (editSource.editing !== editing || editSource.id !== recipe.id || editSource.title !== recipe.title || editSource.cookbookId !== recipe.cookbookId || editSource.pageNumber !== recipe.pageNumber) {
    setEditSource({ editing, id: recipe.id, title: recipe.title, cookbookId: recipe.cookbookId, pageNumber: recipe.pageNumber });
    if (editing) {
      setTitle(recipe.title);
      setCookbookId(recipe.cookbookId ?? '');
      setPageNumber(recipe.pageNumber?.toString() ?? '');
    }
  }
  const sheetRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const collapsedHeightRef = useRef(0);
  const heightAnimationRef = useRef<Animation | null>(null);
  const previousRecipeIdRef = useRef(recipe.id);
  const dragRef = useRef<{ pointerId: number; startY: number; startHeight: number; collapsedHeight: number; lastY: number; lastTime: number; velocity: number; moved: boolean; onHandle: boolean } | null>(null);
  const source = formatRecipeSource(recipe);
  const displayedExpanded = optimisticExpanded ?? expanded;
  const minimumHeight = dragRef.current?.collapsedHeight ?? collapsedHeightRef.current;
  const expandedHeight = minimumHeight + EXPANSION_HEIGHT;
  const height = dragHeight ?? (displayedExpanded && minimumHeight > 0 ? expandedHeight : null);
  const progress = height === null ? (displayedExpanded ? 1 : 0) : Math.min(1, Math.max(0, (height - minimumHeight) / EXPANSION_HEIGHT));
  const textChannel = Math.round(255 * (1 - progress));
  const sheetStyle = {
    '--recipe-sheet-progress': progress,
    '--recipe-sheet-text': `rgb(${textChannel} ${textChannel} ${textChannel})`,
    ...height === null ? {} : { height: `${height}px` },
  } as CSSProperties;

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const recipeChanged = previousRecipeIdRef.current !== recipe.id;
    previousRecipeIdRef.current = recipe.id;
    if (!sheet) return;

    if (displayedExpanded) {
      if (collapsedHeightRef.current > 0) return;

      const renderedHeight = sheet.style.height;
      sheet.removeAttribute('data-expanded');
      sheet.style.height = 'auto';
      const targetHeight = sheet.getBoundingClientRect().height;
      sheet.dataset.expanded = 'true';
      sheet.style.height = renderedHeight;
      collapsedHeightRef.current = targetHeight;
      updateMeasurement();
      return;
    }

    const fromHeight = heightAnimationRef.current
      ? sheet.getBoundingClientRect().height
      : collapsedHeightRef.current;
    heightAnimationRef.current?.cancel();
    heightAnimationRef.current = null;
    const targetHeight = sheet.getBoundingClientRect().height;
    collapsedHeightRef.current = targetHeight;

    if (!recipeChanged || fromHeight === 0 || Math.abs(fromHeight - targetHeight) < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = sheet.animate(
      [{ height: `${fromHeight}px` }, { height: `${targetHeight}px` }],
      { duration: 220, easing: 'ease' },
    );
    heightAnimationRef.current = animation;
    animation.onfinish = () => {
      if (heightAnimationRef.current === animation) heightAnimationRef.current = null;
    };
  }, [displayedExpanded, recipe.id]);

  useLayoutEffect(() => {
    if (!editing) return;
    const frame = requestAnimationFrame(() => {
      titleInputRef.current?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [editing]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || displayedExpanded || dragHeight !== null) return;
    const updateHeight = () => {
      if (heightAnimationRef.current || dragRef.current) return;
      collapsedHeightRef.current = sheet.getBoundingClientRect().height;
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [displayedExpanded, dragHeight, recipe.id]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (editing || event.button !== 0 || (event.target as HTMLElement).closest('a, input, select, textarea, button:not([data-recipe-sheet-handle])')) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    heightAnimationRef.current?.cancel();
    heightAnimationRef.current = null;
    const currentHeight = event.currentTarget.getBoundingClientRect().height;
    const minimumHeight = displayedExpanded ? collapsedHeightRef.current : currentHeight;
    dragRef.current = { pointerId: event.pointerId, startY: event.clientY, startHeight: currentHeight, collapsedHeight: minimumHeight, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, moved: false, onHandle: Boolean((event.target as HTMLElement).closest('[data-recipe-sheet-handle]')) };
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const delta = current.startY - event.clientY;
    if (Math.abs(delta) > 4) current.moved = true;
    if (current.moved) {
      event.stopPropagation();
      const elapsed = Math.max(1, event.timeStamp - current.lastTime);
      current.velocity = (current.lastY - event.clientY) / elapsed;
      current.lastY = event.clientY;
      current.lastTime = event.timeStamp;
      setDragHeight(clampSheetHeight(current.startHeight + delta, current.collapsedHeight, current.collapsedHeight + EXPANSION_HEIGHT));
    }
  };

  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (current.moved) {
      const expandedHeight = current.collapsedHeight + EXPANSION_HEIGHT;
      const height = clampSheetHeight(current.startHeight + current.startY - event.clientY, current.collapsedHeight, expandedHeight);
      const nextExpanded = shouldExpandSheet(height, current.velocity, current.collapsedHeight, expandedHeight);
      setOptimisticExpanded(nextExpanded);
      onExpandedChange(nextExpanded);
    }
    else if (current.onHandle && event.type === 'pointerup') {
      setOptimisticExpanded(!displayedExpanded);
      onExpandedChange(!displayedExpanded);
    }
    dragRef.current = null;
    setDragHeight(null);
  };

  return (
    <div className={`${styles.shade} swiper-no-swiping`}>
      <section
        ref={sheetRef}
        className={styles.sheet}
        data-expanded={displayedExpanded || undefined}
        data-dragging={dragHeight !== null || undefined}
        style={sheetStyle}
        aria-label="Rezeptdetails"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <button
          className={styles.handleButton}
          data-recipe-sheet-handle
          type="button"
          disabled={editing}
          aria-label={displayedExpanded ? 'Rezeptdetails einklappen' : 'Rezeptdetails ausklappen'}
          aria-expanded={displayedExpanded}
          onClick={(event) => {
            if (event.detail !== 0) return;
            setOptimisticExpanded(!displayedExpanded);
            onExpandedChange(!displayedExpanded);
          }}
        >
          <span className={styles.handle} />
        </button>
        <form
          key={recipe.id}
          className={styles.content}
          onSubmit={(event) => {
            event.preventDefault();
            onSave({
              title: title.trim(),
              cookbookId: cookbookId || null,
              pageNumber: pageNumber === '' ? null : Number(pageNumber),
            });
          }}
        >
          <div className={styles.heading}>
            <div
              className={styles.headingMode}
              data-active={!editing || undefined}
              aria-hidden={editing}
              inert={editing}
            >
              <h1>{recipe.title}</h1>
              {source && <p>{source}</p>}
            </div>
            <div
              className={`${styles.headingMode} ${styles.editFields}`}
              data-active={editing || undefined}
              aria-hidden={!editing}
              inert={!editing}
            >
              <div className={`${styles.field} ${styles.titleField}`}>
                <input
                  ref={titleInputRef}
                  aria-label="Titel"
                  placeholder={title === '' ? 'Titel' : undefined}
                  value={title}
                  required
                  onChange={event => setTitle(event.target.value)}
                />
              </div>
              <div className={styles.sourceFields}>
                <div className={styles.field}>
                  <select aria-label="Kochbuch" value={cookbookId} onChange={event => setCookbookId(event.target.value)}>
                    <option value="">Kein Kochbuch</option>
                    {cookbooks.map(cookbook => <option key={cookbook.id} value={cookbook.id}>{cookbook.title}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <input
                    aria-label="Seite"
                    placeholder={pageNumber === '' ? 'Seite' : undefined}
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={pageNumber}
                    onChange={event => setPageNumber(event.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.expandedContent} inert={!displayedExpanded && dragHeight === null}>
            <RecipeActions
              hasPhoto={recipe.photoFileId !== null}
              complete={recipe.cookbookId !== null}
              pending={pending}
              photoPending={photoPending}
              deletionPending={deletionPending}
              editing={editing}
              editPending={editPending}
              onEdit={onEdit}
              onComplete={onComplete}
              onCancel={onCancel}
              onPhoto={onPhoto}
              onDelete={onDelete}
            />
            {pending && <p className={styles.operationMessage} role="status">Wird verarbeitet …</p>}
            {error && <p className={styles.operationMessage} role="alert">{error}</p>}
          </div>
        </form>
      </section>
    </div>
  );
}
