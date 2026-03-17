import type { CSSProperties } from 'react';

interface Props {
  value: number;
  compact?: boolean;
}

export default function StatDisplay({ value, compact }: Props) {
  const style: CSSProperties = {
    width: '100%',
    textAlign: 'center',
    fontSize: compact ? 12 : 14,
    fontWeight: 500,
    color: 'var(--text-h)',
  };

  return <span style={style}>{value}</span>;
}
