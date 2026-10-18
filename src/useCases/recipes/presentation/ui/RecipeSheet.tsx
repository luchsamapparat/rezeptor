import { useRef, useState, type PointerEvent } from 'react';
import type { RecipeDto } from '../api/client';
import { RecipeActions } from './RecipeActions';
import styles from './RecipeSheet.module.css';
import { clampSheetHeight, formatRecipeSource, shouldExpandSheet } from './recipeBrowserState';

type Props = {
  recipe: RecipeDto;
  index: number;
  count: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onNavigate: (index: number) => void;
  onPhoto: (file: File) => void;
  onDelete: () => void;
  pending: boolean;
  error: string | null;
};

const COLLAPSED = 175;
const EXPANDED = 319;

export function RecipeSheet({ recipe, index, count, expanded, onExpandedChange, onNavigate, onPhoto, onDelete, pending, error }: Props) {
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const drag = useRef<{ pointerId: number; startY: number; startHeight: number; lastY: number; lastTime: number; velocity: number; moved: boolean; onHandle: boolean } | null>(null);
  const source = formatRecipeSource(recipe);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('a, input, button:not([data-recipe-sheet-handle])')) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startY: event.clientY, startHeight: expanded ? EXPANDED : COLLAPSED, lastY: event.clientY, lastTime: event.timeStamp, velocity: 0, moved: false, onHandle: Boolean((event.target as HTMLElement).closest('[data-recipe-sheet-handle]')) };
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
      setDragHeight(clampSheetHeight(current.startHeight + delta, COLLAPSED, EXPANDED));
    }
  };

  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    event.stopPropagation();
    if (current.moved) {
      const height = clampSheetHeight(current.startHeight + current.startY - event.clientY, COLLAPSED, EXPANDED);
      onExpandedChange(shouldExpandSheet(height, current.velocity, COLLAPSED, EXPANDED));
    }
    else if (current.onHandle && event.type === 'pointerup') onExpandedChange(!expanded);
    drag.current = null;
    setDragHeight(null);
  };

  return (
    <div className={`${styles.shade} swiper-no-swiping`}>
      <section
        className={styles.sheet}
        data-expanded={expanded || undefined}
        data-dragging={dragHeight !== null || undefined}
        style={{ height: `calc(${dragHeight ?? (expanded ? EXPANDED : COLLAPSED)}px + env(safe-area-inset-bottom, 0px))` }}
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
        <div className={styles.content}>
          <div className={styles.heading}>
            <h1>{recipe.title}</h1>
            {source && <p>{source}</p>}
          </div>
          <div className={styles.expandedContent} inert={!expanded && dragHeight === null}>
            <RecipeActions recipeId={recipe.id} pending={pending} onPhoto={onPhoto} onDelete={onDelete} />
            {pending && <p className={styles.operationMessage} role="status">Wird verarbeitet …</p>}
            {error && <p className={styles.operationMessage} role="alert">{error}</p>}
            {count > 1 && (
              <nav className={styles.dots} aria-label="Rezepte">
                {Array.from({ length: count }, (_, dot) => (
                  <button
                    key={dot}
                    type="button"
                    className={styles.dot}
                    data-active={dot === index || undefined}
                    aria-label={`Rezept ${dot + 1} von ${count} anzeigen`}
                    aria-current={dot === index ? 'true' : undefined}
                    onClick={() => onNavigate(dot)}
                  />
                ))}
              </nav>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
