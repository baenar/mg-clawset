import type { CSSProperties } from 'react';
import type { PlacedFurniture, StatKey } from '../types/furniture';

const STATS: { key: StatKey; label: string }[] = [
  { key: 'appeal', label: 'APL' },
  { key: 'comfort', label: 'CMF' },
  { key: 'stimulation', label: 'STM' },
  { key: 'health', label: 'HLT' },
  { key: 'mutation', label: 'MUT' },
];

const containerStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '6px 10px',
  borderRadius: 10,
  background: 'var(--social-bg)',
  border: '1px solid var(--border)',
  flexWrap: 'wrap',
  alignItems: 'center',
  minWidth: 0,
  flex: '1 1 0%',
};

const statStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 13,
  fontFamily: 'var(--font)',
};

const labelStyle: CSSProperties = {
  color: 'var(--text)',
  fontWeight: 500,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const valueStyle: CSSProperties = {
  color: 'var(--text-h)',
  fontWeight: 600,
  fontSize: 14,
  minWidth: 24,
  textAlign: 'center',
};

const countStyle: CSSProperties = {
  color: 'var(--lavender-grey)',
  fontSize: 12,
  marginLeft: 'auto',
};

interface Props {
  placed: PlacedFurniture[];
}

export default function RoomStatsSummary({ placed }: Props) {
  const totals: Record<StatKey, number> = {
    appeal: 0,
    comfort: 0,
    stimulation: 0,
    health: 0,
    mutation: 0,
  };

  for (const p of placed) {
    for (const s of STATS) {
      totals[s.key] += p.item[s.key];
    }
  }

  return (
    <div style={containerStyle}>
      {STATS.map((s) => (
        <div key={s.key} style={statStyle}>
          <span style={labelStyle}>{s.label}</span>
          <span style={{
            ...valueStyle,
            color: totals[s.key] > 0
              ? 'var(--accent)'
              : totals[s.key] < 0
                ? 'var(--lavender-grey)'
                : 'var(--text-h)',
          }}>
            {totals[s.key]}
          </span>
        </div>
      ))}
      <span style={countStyle}>{placed.length} item{placed.length !== 1 ? 's' : ''}</span>
    </div>
  );
}
