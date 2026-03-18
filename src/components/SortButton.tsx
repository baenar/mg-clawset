import type { CSSProperties, ReactNode } from 'react';
import type { SortDirection } from '../types/furniture';

const buttonStyle: CSSProperties = {
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
  justifyContent: 'center',
  gap: 2,
  whiteSpace: 'nowrap',
};

interface Props {
  label: ReactNode;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}

export default function SortButton({ label, active, direction, onClick }: Props) {
  const arrow = active ? (direction === 'asc' ? ' ▲' : ' ▼') : '';

  // When active, tint icon images red using CSS filter
  const iconFilter = active
    ? 'brightness(0) saturate(100%) invert(35%) sepia(60%) saturate(2000%) hue-rotate(330deg) brightness(95%)'
    : undefined;

  return (
    <button
      style={{
        ...buttonStyle,
        ...(active ? { color: 'var(--accent)' } : {}),
      }}
      onClick={onClick}
    >
      <span style={iconFilter ? { filter: iconFilter, display: 'flex' } : { display: 'flex' }}>
        {label}
      </span>
      {arrow}
    </button>
  );
}
