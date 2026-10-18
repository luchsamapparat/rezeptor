import { ImagePlus, ImageUp, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import styles from './RecipeActions.module.css';

type Props = {
  recipeId: string;
  hasPhoto: boolean;
  pending: boolean;
  onPhoto: () => void;
  onDelete: () => void;
};

export function RecipeActions({ recipeId, hasPhoto, pending, onPhoto, onDelete }: Props) {
  return (
    <div className={styles.actions}>
      <Link className={styles.action} to={`/admin/recipes/${recipeId}/edit`}>
        <Pencil aria-hidden="true" size={25} strokeWidth={1.5} />
        <span>Bearbeiten</span>
      </Link>
      <button className={styles.action} type="button" disabled={pending} onClick={onPhoto}>
        {hasPhoto
          ? <ImageUp aria-hidden="true" size={25} strokeWidth={1.5} />
          : <ImagePlus aria-hidden="true" size={25} strokeWidth={1.5} />}
        <span>
          Foto
          <br />
          {hasPhoto ? 'ersetzen' : 'hinzufügen'}
        </span>
      </button>
      <button className={styles.action} type="button" disabled={pending} onClick={onDelete}>
        <Trash2 aria-hidden="true" size={25} strokeWidth={1.5} />
        <span>Löschen</span>
      </button>
    </div>
  );
}
