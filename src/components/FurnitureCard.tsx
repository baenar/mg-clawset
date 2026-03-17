import type { CSSProperties } from 'react';
import type { FurnitureItem } from '../types/furniture';
import FurnitureImage from './FurnitureImage';
import ShapeVisualizer from './ShapeVisualizer';
import StatDisplay from './StatDisplay';
import OwnershipCounter from './OwnershipCounter';

const GRID_FULL = '56px 48px minmax(120px, 1fr) repeat(5, 60px) 90px';
const GRID_COMPACT = '36px 28px minmax(40px, 1fr) repeat(5, 28px) 68px';

const baseCard: CSSProperties = {
  display: 'grid',
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: 12,
  background: 'var(--social-bg)',
  border: '1px solid var(--border)',
};

const nameStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: 'var(--text-h)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

interface Props {
  item: FurnitureItem;
  owned: number;
  onIncrement: () => void;
  onDecrement: () => void;
  compact?: boolean;
}

export default function FurnitureCard({ item, owned, onIncrement, onDecrement, compact }: Props) {
  return (
    <div style={{ ...baseCard, gridTemplateColumns: compact ? GRID_COMPACT : GRID_FULL, gap: compact ? 8 : 0 }}>
      <FurnitureImage src={item.image_url} alt={item.name} compact={compact} draggableItem={item} />
      <ShapeVisualizer shape={item.shape} compact={compact} />
      <div style={nameStyle} title={item.name}>{item.name}</div>
      <StatDisplay value={item.appeal} compact={compact} />
      <StatDisplay value={item.comfort} compact={compact} />
      <StatDisplay value={item.stimulation} compact={compact} />
      <StatDisplay value={item.health} compact={compact} />
      <StatDisplay value={item.mutation} compact={compact} />
      <OwnershipCounter count={owned} onIncrement={onIncrement} onDecrement={onDecrement} compact={compact} />
    </div>
  );
}
