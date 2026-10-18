import { BookMarked, Hamburger, LibraryBig, LogOut, X } from 'lucide-react';
import { useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router';
import styles from './AppMenu.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddRecipe: () => void;
  restoreFocus: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export function AppMenu({ open, onAddRecipe, onOpenChange, restoreFocus, triggerRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(restoreFocus);
  restoreFocusRef.current = restoreFocus;

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
      if (event.key !== 'Tab') return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>('a, button');
      if (!focusable?.length) return;
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
      document.removeEventListener('keydown', onKeyDown);
      if (restoreFocusRef.current) triggerRef.current?.focus();
    };
  }, [open, onOpenChange, triggerRef]);

  const signOutUrl = `/oauth2/sign_out?rd=${encodeURIComponent('/oauth2/sign_in')}`;

  return (
    <>
      {open && (
        <div className={styles.overlay} role="presentation" onPointerDown={event => event.stopPropagation()}>
          <button className={styles.backdrop} type="button" aria-label="Menü schließen" onClick={() => onOpenChange(false)} />
          <div className={styles.panel} role="dialog" aria-modal="true" aria-label="Menü" ref={panelRef}>
            <nav className={styles.links} aria-label="Hauptmenü">
              <Link to="/admin/cookbooks" className={styles.link}>
                <LibraryBig aria-hidden="true" size={25} strokeWidth={1.5} />
                <span>Kochbücher</span>
              </Link>
              <button className={styles.link} type="button" onClick={onAddRecipe}>
                <BookMarked aria-hidden="true" size={25} strokeWidth={1.5} />
                <span>Rezept merken</span>
              </button>
              <a href={signOutUrl} className={styles.link}>
                <LogOut aria-hidden="true" size={25} strokeWidth={1.5} />
                <span>Abmelden</span>
              </a>
            </nav>
          </div>
        </div>
      )}
      <div className={styles.topShade}>
        <button
          ref={triggerRef}
          className={`${styles.trigger} swiper-no-swiping`}
          type="button"
          aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
        >
          {open
            ? <X aria-hidden="true" size={30} strokeWidth={1.5} />
            : <Hamburger className={styles.triggerIcon} aria-hidden="true" size={29} strokeWidth={1.5} />}
        </button>
      </div>
    </>
  );
}
