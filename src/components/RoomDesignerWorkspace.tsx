import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { FurnitureItem, PlacedFurniture } from '../types/furniture';
import RoomGrid from './RoomGrid';
import RoomStatsSummary from './RoomStatsSummary';

const LEGEND: { type: number; color: string; border: string; label: string }[] = [
  { type: 2, color: 'var(--lavender-grey)', border: 'rgba(132,143,165,0.5)', label: 'Solid' },
  { type: 3, color: 'var(--blushed-brick)', border: 'rgba(193,73,83,0.5)', label: 'Anchor Point' },
  { type: 4, color: 'var(--sand-dune)', border: 'rgba(229,220,197,0.5)', label: 'Anchor' },
  { type: 5, color: 'var(--charcoal)', border: 'rgba(76,76,71,0.5)', label: 'Background' },
];

interface Props {
  visible: boolean;
  placed: PlacedFurniture[];
  onPlace: (item: FurnitureItem, row: number, col: number) => void;
  onRemove: (instanceId: string) => void;
  onMove: (instanceId: string, row: number, col: number) => void;
}

export default function RoomDesignerWorkspace({ visible, placed, onPlace, onRemove, onMove }: Props) {
  const [expertView, setExpertView] = useState(false);

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--code-bg)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    marginLeft: 16,
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1), padding 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    flex: visible ? '1 1 0%' : '0 0 0%',
    opacity: visible ? 1 : 0,
    ...(visible ? {} : { marginLeft: 0, border: 'none' }),
    padding: visible ? 16 : 0,
    gap: 12,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexShrink: 0,
    flexWrap: 'wrap',
  };

  const toggleBtn: CSSProperties = {
    padding: '5px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: expertView ? 'var(--accent-bg)' : 'var(--social-bg)',
    color: expertView ? 'var(--accent)' : 'var(--text-h)',
    fontFamily: 'var(--font)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };

  const legendStyle: CSSProperties = {
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
    fontSize: 11,
    color: 'var(--text)',
    flexShrink: 0,
  };

  if (!visible) return <div style={containerStyle} />;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <RoomStatsSummary placed={placed} />
        <button style={toggleBtn} onClick={() => setExpertView((v) => !v)}>
          {expertView ? 'Image View' : 'Expert View'}
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
        <RoomGrid
          placed={placed}
          onPlace={onPlace}
          onRemove={onRemove}
          onMove={onMove}
          expertView={expertView}
        />
      </div>
      {expertView && (
        <div style={legendStyle}>
          {LEGEND.map((l) => (
            <div key={l.type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: l.color,
                border: `1px solid ${l.border}`,
              }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
