import { useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router';
import cookbooksIcon from './assets/cookbooks.svg';
import closeIcon from './assets/close.svg';
import logoutIcon from './assets/logout.svg';
import menuIcon from './assets/menu.svg';
import rememberIcon from './assets/remember.svg';
import styles from './AppMenu.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export function AppMenu({ open, onOpenChange, triggerRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

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
      triggerRef.current?.focus();
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
                <img src={cookbooksIcon} alt="" width="25" height="25" />
                <span>Kochbücher</span>
              </Link>
              <Link to="/admin/recipes/from-photo" className={styles.link}>
                <img src={rememberIcon} alt="" width="25" height="25" />
                <span>Rezept merken</span>
              </Link>
              <a href={signOutUrl} className={styles.link}>
                <img src={logoutIcon} alt="" width="25" height="25" />
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
          <img className={open ? undefined : styles.menuIcon} src={open ? closeIcon : menuIcon} alt="" width={open ? 30 : 29} height={open ? 30 : 25} />
        </button>
      </div>
    </>
  );
}
