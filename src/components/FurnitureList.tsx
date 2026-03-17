import type { CSSProperties } from 'react';
import type { FurnitureItem } from '../types/furniture';
import FurnitureCard from './FurnitureCard';

const styles: Record<string, CSSProperties> = {
  list: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: 'var(--text)',
    fontSize: 14,
  },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '8px 16px 12px',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  pageButton: {
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    fontFamily: 'var(--font)',
    fontSize: 13,
    cursor: 'pointer',
  },
  pageInfo: {
    fontSize: 13,
    color: 'var(--text)',
    minWidth: 100,
    textAlign: 'center',
  },
};

interface Props {
  items: FurnitureItem[];
  totalItems: number;
  ownership: Record<string, number>;
  onIncrement: (name: string) => void;
  onDecrement: (name: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  compact?: boolean;
}

export default function FurnitureList({
  items,
  totalItems,
  ownership,
  onIncrement,
  onDecrement,
  page,
  totalPages,
  onPageChange,
  compact,
}: Props) {
  return (
    <>
      <div style={styles.list}>
        {items.length === 0 ? (
          <div style={styles.empty}>No furniture matches your filters.</div>
        ) : (
          items.map((item) => (
            <FurnitureCard
              key={item.id}
              item={item}
              owned={ownership[item.id] || 0}
              onIncrement={() => onIncrement(item.id)}
              onDecrement={() => onDecrement(item.id)}
              compact={compact}
            />
          ))
        )}
      </div>
      <div style={styles.pagination}>
        <button
          style={{
            ...styles.pageButton,
            opacity: page === 0 ? 0.4 : 1,
            cursor: page === 0 ? 'not-allowed' : 'pointer',
          }}
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
        >
          ← Prev
        </button>
        <span style={styles.pageInfo}>
          {page + 1} / {totalPages} ({totalItems})
        </span>
        <button
          style={{
            ...styles.pageButton,
            opacity: page >= totalPages - 1 ? 0.4 : 1,
            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
          }}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
        >
          Next →
        </button>
      </div>
    </>
  );
}
