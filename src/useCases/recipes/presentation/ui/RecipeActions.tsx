import { ImagePlus, ImageUp, LoaderCircle, Pencil, Trash2, TrashOff } from 'lucide-react';
import { Link } from 'react-router';
import styles from './RecipeActions.module.css';

type Props = {
  recipeId: string;
  hasPhoto: boolean;
  pending: boolean;
  photoPending: boolean;
  deletionPending: boolean;
  onPhoto: () => void;
  onDelete: () => void;
};

export function RecipeActions({ recipeId, hasPhoto, pending, photoPending, deletionPending, onPhoto, onDelete }: Props) {
  return (
    <div className={styles.actions}>
      <Link className={styles.action} to={`/admin/recipes/${recipeId}/edit`}>
        <Pencil aria-hidden="true" size={25} strokeWidth={1.5} />
        <span>Bearbeiten</span>
      </Link>
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
  );
}
