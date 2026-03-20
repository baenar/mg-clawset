import type { CSSProperties } from 'react';

interface Props {
  value: number;
  compact?: boolean;
}

export default function StatDisplay({ value, compact }: Props) {
  const isDecimal = value !== Math.floor(value);
  const style: CSSProperties = {
    width: '100%',
    textAlign: 'center',
    fontSize: compact ? (isDecimal ? 10 : 12) : (isDecimal ? 12 : 14),
    fontWeight: 500,
    color: 'var(--text-h)',
  };

  return <span style={style}>{isDecimal ? value.toFixed(2) : value}</span>;
}
