import type { CSSProperties } from 'react';
import type { SortDirection } from '../types/furniture';

const styles: Record<string, CSSProperties> = {
  button: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font)',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text)',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    whiteSpace: 'nowrap',
  },
  active: {
    color: 'var(--accent)',
  },
};

interface Props {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}

export default function SortButton({ label, active, direction, onClick }: Props) {
  const arrow = active ? (direction === 'asc' ? ' ▲' : ' ▼') : '';
  return (
    <button
      style={{ ...styles.button, ...(active ? styles.active : {}) }}
      onClick={onClick}
    >
      {label}{arrow}
    </button>
  );
}
