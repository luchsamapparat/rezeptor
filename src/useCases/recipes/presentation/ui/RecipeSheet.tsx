import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import type { RecipeDto } from '../api/client';
import { RecipeActions } from './RecipeActions';
import styles from './RecipeSheet.module.css';
import { clampSheetHeight, formatRecipeSource, shouldExpandSheet } from './recipeBrowserState';

type Props = {
  recipe: RecipeDto;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onPhoto: () => void;
  onDelete: () => void;
  pending: boolean;
  deletionPending: boolean;
  error: string | null;
};

const EXPANSION_HEIGHT = 144;

export function RecipeSheet({ recipe, expanded, onExpandedChange, onPhoto, onDelete, pending, deletionPending, error }: Props) {
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const collapsedHeight = useRef(0);
  const heightAnimation = useRef<Animation | null>(null);
  const previousRecipeId = useRef(recipe.id);
  const drag = useRef<{ pointerId: number; startY: number; startHeight: number; collapsedHeight: number; lastY: number; lastTime: number; velocity: number; moved: boolean; onHandle: boolean } | null>(null);
  const source = formatRecipeSource(recipe);
  const minimumHeight = drag.current?.collapsedHeight ?? collapsedHeight.current;
  const expandedHeight = minimumHeight + EXPANSION_HEIGHT;
  const height = dragHeight ?? (expanded ? expandedHeight : null);
  const progress = height === null ? 0 : Math.min(1, Math.max(0, (height - minimumHeight) / EXPANSION_HEIGHT));
  const textChannel = Math.round(255 * (1 - progress));
  const sheetStyle = {
    '--recipe-sheet-progress': progress,
    '--recipe-sheet-text': `rgb(${textChannel} ${textChannel} ${textChannel})`,
    ...height === null ? {} : { height: `${height}px` },
  } as CSSProperties;

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const recipeChanged = previousRecipeId.current !== recipe.id;
    previousRecipeId.current = recipe.id;
    if (!sheet || expanded) return;

    const fromHeight = heightAnimation.current
      ? sheet.getBoundingClientRect().height
      : collapsedHeight.current;
    heightAnimation.current?.cancel();
    heightAnimation.current = null;
    const targetHeight = sheet.getBoundingClientRect().height;
    collapsedHeight.current = targetHeight;

    if (!recipeChanged || fromHeight === 0 || Math.abs(fromHeight - targetHeight) < 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animation = sheet.animate(
      [{ height: `${fromHeight}px` }, { height: `${targetHeight}px` }],
      { duration: 220, easing: 'ease' },
    );
    heightAnimation.current = animation;
    animation.onfinish = () => {
      if (heightAnimation.current === animation) heightAnimation.current = null;
    };
  }, [expanded, recipe.id]);

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || expanded || dragHeight !== null) return;
    const updateHeight = () => {
      if (heightAnimation.current) return;
      collapsedHeight.current = sheet.getBoundingClientRect().height;
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [dragHeight, expanded, recipe.id]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('a, input, button:not([data-recipe-sheet-handle])')) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    heightAnimation.current?.cancel();
    heightAnimation.current = null;
    const currentHeight = event.currentTarget.getBoundingClientRect().height;
    const minimumHeight = expanded ? collapsedHeight.current : currentHeight;
    drag.current = { pointerId: event.pointerId, startY: event.clientY, startHeight: currentHeight, collapsedHeight: minimumHeight, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, moved: false, onHandle: Boolean((event.target as HTMLElement).closest('[data-recipe-sheet-handle]')) };
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
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
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (current.moved) {
      const expandedHeight = current.collapsedHeight + EXPANSION_HEIGHT;
      const height = clampSheetHeight(current.startHeight + current.startY - event.clientY, current.collapsedHeight, expandedHeight);
      onExpandedChange(shouldExpandSheet(height, current.velocity, current.collapsedHeight, expandedHeight));
    }
    else if (current.onHandle && event.type === 'pointerup') onExpandedChange(!expanded);
    drag.current = null;
    setDragHeight(null);
  };

  return (
    <div className={`${styles.shade} swiper-no-swiping`}>
      <section
        ref={sheetRef}
        className={styles.sheet}
        data-expanded={expanded || undefined}
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
          aria-label={expanded ? 'Rezeptdetails einklappen' : 'Rezeptdetails ausklappen'}
          aria-expanded={expanded}
          onClick={(event) => { if (event.detail === 0) onExpandedChange(!expanded); }}
        >
          <span className={styles.handle} />
        </button>
        <div key={recipe.id} className={styles.content}>
          <div className={styles.heading}>
            <h1>{recipe.title}</h1>
            {source && <p>{source}</p>}
          </div>
          <div className={styles.expandedContent} inert={!expanded && dragHeight === null}>
            <RecipeActions recipeId={recipe.id} hasPhoto={recipe.photoFileId !== null} pending={pending} deletionPending={deletionPending} onPhoto={onPhoto} onDelete={onDelete} />
            {pending && <p className={styles.operationMessage} role="status">Wird verarbeitet …</p>}
            {error && <p className={styles.operationMessage} role="alert">{error}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
