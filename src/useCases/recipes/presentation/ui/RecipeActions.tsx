import { useRef } from 'react';
import { Link } from 'react-router';
import deleteIcon from './assets/delete.svg';
import editIcon from './assets/edit.svg';
import photoIcon from './assets/photo.svg';
import styles from './RecipeActions.module.css';

type Props = {
  recipeId: string;
  pending: boolean;
  onPhoto: (file: File) => void;
  onDelete: () => void;
};

export function RecipeActions({ recipeId, pending, onPhoto, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={styles.actions}>
      <Link className={styles.action} to={`/admin/recipes/${recipeId}/edit`}>
        <img src={editIcon} alt="" width="25" height="25" />
        <span>Bearbeiten</span>
      </Link>
      <button className={styles.action} type="button" disabled={pending} onClick={() => inputRef.current?.click()}>
        <img src={photoIcon} alt="" width="28" height="25" />
        <span>
          Foto
          <br />
          hinzufügen
        </span>
      </button>
      <input
        ref={inputRef}
        className={styles.fileInput}
        type="file"
        accept="image/*"
        aria-label="Rezeptfoto auswählen"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPhoto(file);
          event.target.value = '';
        }}
      />
      <button className={styles.action} type="button" disabled={pending} onClick={onDelete}>
        <img src={deleteIcon} alt="" width="23" height="25" />
        <span>Löschen</span>
      </button>
    </div>
  );
}
