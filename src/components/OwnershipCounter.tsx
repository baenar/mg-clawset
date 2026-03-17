import type { CSSProperties } from 'react';

interface Props {
  count: number;
  onIncrement: () => void;
  onDecrement: () => void;
  compact?: boolean;
}

export default function OwnershipCounter({ count, onIncrement, onDecrement, compact }: Props) {
  const btnSize = compact ? 22 : 26;

  const wrapper: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? 2 : 4,
    flexShrink: 0,
    justifyContent: 'center',
  };

  const button: CSSProperties = {
    width: btnSize,
    height: btnSize,
    borderRadius: 6,
    border: '1px solid var(--border)',
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    fontFamily: 'var(--font)',
    fontSize: compact ? 14 : 16,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    padding: 0,
  };

  const countStyle: CSSProperties = {
    minWidth: compact ? 18 : 24,
    textAlign: 'center',
    fontSize: compact ? 12 : 14,
    fontWeight: 600,
    color: 'var(--text-h)',
  };

  return (
    <div style={wrapper}>
      <button
        style={{
          ...button,
          opacity: count === 0 ? 0.4 : 1,
          cursor: count === 0 ? 'not-allowed' : 'pointer',
        }}
        onClick={onDecrement}
        disabled={count === 0}
      >
        −
      </button>
      <span style={countStyle}>{count}</span>
      <button style={button} onClick={onIncrement}>
        +
      </button>
    </div>
  );
}
