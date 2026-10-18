import { X, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useRef, useState, type PropsWithChildren, type RefObject } from 'react';
import styles from './FeatureOverlay.module.css';

type Props = PropsWithChildren<{
  icon: LucideIcon;
  open: boolean;
  title: string;
  closeDisabled?: boolean;
  contentRef?: RefObject<HTMLDivElement | null>;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}>;

const focusableSelector = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function FeatureOverlay({ children, closeDisabled = false, contentRef, icon: Icon, open, title, onClose, returnFocusRef }: Props) {
  const titleId = useId();
  const [rendered, setRendered] = useState(open);
  const [closing, setClosing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const displayedChildrenRef = useRef(children);
  const closeDisabledRef = useRef(closeDisabled);
  const onCloseRef = useRef(onClose);
  const openRef = useRef(open);
  if (open) displayedChildrenRef.current = children;
  closeDisabledRef.current = closeDisabled;
  onCloseRef.current = onClose;
  openRef.current = open;

  useEffect(() => {
    if (open) {
      setRendered(true);
      setClosing(false);
      return;
    }
    if (!rendered) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRendered(false);
      return;
    }

    setClosing(true);
    const timeout = window.setTimeout(() => {
      setRendered(false);
      setClosing(false);
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [open, rendered]);

  useEffect(() => {
    if (!rendered) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overlay = overlayRef.current;
    const siblings = overlay?.parentElement
      ? Array.from(overlay.parentElement.children).filter(
          (element): element is HTMLElement => element !== overlay && element instanceof HTMLElement && !element.inert,
        )
      : [];
    siblings.forEach(element => element.inert = true);

    const focusFrame = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openRef.current && !closeDisabledRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = overlayRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable?.length) {
        event.preventDefault();
        panelRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
      siblings.forEach(element => element.inert = false);
      (returnFocusRef?.current ?? previousFocus)?.focus();
    };
  }, [rendered]);

  if (!rendered) return null;

  return (
    <div ref={overlayRef} className={styles.overlay} data-closing={closing || undefined} role="presentation">
      <button
        className={styles.backdrop}
        type="button"
        aria-label={`${title} schließen`}
        disabled={closeDisabled}
        tabIndex={-1}
        onClick={onClose}
      />
      <button
        className={styles.close}
        type="button"
        aria-label={`${title} schließen`}
        disabled={closeDisabled}
        onClick={onClose}
      >
        <X aria-hidden="true" size={34} strokeWidth={1.5} />
      </button>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <Icon aria-hidden="true" size={30} strokeWidth={1.5} />
          <h1 id={titleId}>{title}</h1>
        </header>
        <div ref={contentRef} className={styles.content}>{open ? children : displayedChildrenRef.current}</div>
      </div>
    </div>
  );
}
