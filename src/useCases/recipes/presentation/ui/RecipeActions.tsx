import { ImagePlus, ImageUp, LoaderCircle, Pencil, Save, Trash2, TrashOff, X } from 'lucide-react';
import styles from './RecipeActions.module.css';

type Props = {
  hasPhoto: boolean;
  pending: boolean;
  photoPending: boolean;
  deletionPending: boolean;
  editing: boolean;
  editPending: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onPhoto: () => void;
  onDelete: () => void;
};

export function RecipeActions({ hasPhoto, pending, photoPending, deletionPending, editing, editPending, onEdit, onCancel, onPhoto, onDelete }: Props) {
  return (
    <div className={styles.actionGroups}>
      <div
        className={`${styles.actions} ${styles.editing}`}
        data-active={editing || undefined}
        aria-hidden={!editing}
        inert={!editing}
      >
        <button key="save" className={styles.action} type="submit" disabled={editPending} aria-busy={editPending}>
          {editPending
            ? <LoaderCircle className={styles.spinner} aria-hidden="true" size={25} strokeWidth={1.5} />
            : <Save aria-hidden="true" size={25} strokeWidth={1.5} />}
          <span>
            {editPending ? 'Wird' : 'Änderungen'}
            <br />
            speichern
          </span>
        </button>
        <button key="cancel" className={styles.action} type="button" disabled={editPending} onClick={onCancel}>
          <X aria-hidden="true" size={25} strokeWidth={1.5} />
          <span>Abbrechen</span>
        </button>
      </div>
      <div
        className={styles.actions}
        data-active={!editing || undefined}
        aria-hidden={editing}
        inert={editing}
      >
        <button
          key="edit"
          className={styles.action}
          type="button"
          disabled={pending}
          onClick={(event) => {
            event.preventDefault();
            onEdit();
          }}
        >
          <Pencil aria-hidden="true" size={25} strokeWidth={1.5} />
          <span>Bearbeiten</span>
        </button>
        <button className={styles.action} type="button" disabled={pending} aria-busy={photoPending} onClick={onPhoto}>
          {photoPending
            ? <LoaderCircle className={styles.spinner} aria-hidden="true" size={25} strokeWidth={1.5} />
            : hasPhoto
              ? <ImageUp aria-hidden="true" size={25} strokeWidth={1.5} />
              : <ImagePlus aria-hidden="true" size={25} strokeWidth={1.5} />}
          <span>
            Foto
            <br />
            {hasPhoto ? 'ersetzen' : 'hinzufügen'}
          </span>
        </button>
        <button className={styles.action} type="button" disabled={pending} onClick={onDelete}>
          {deletionPending
            ? <TrashOff aria-hidden="true" size={25} strokeWidth={1.5} />
            : <Trash2 aria-hidden="true" size={25} strokeWidth={1.5} />}
          <span>{deletionPending ? 'Rückgängig machen' : 'Löschen'}</span>
        </button>
      </div>
    </div>
  );
}
