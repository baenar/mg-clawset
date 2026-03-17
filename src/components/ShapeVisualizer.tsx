import { useState, useRef, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';

const CELL_COLORS: Record<number, string> = {
  1: 'transparent',
  2: 'var(--lavender-grey)',
  3: 'var(--blushed-brick)',
  4: 'var(--sand-dune)',
  5: 'var(--charcoal)',
};

const CELL_BORDERS: Record<number, string> = {
  1: 'transparent',
  2: 'rgba(132,143,165,0.5)',
  3: 'rgba(193,73,83,0.5)',
  4: 'rgba(229,220,197,0.5)',
  5: 'rgba(76,76,71,0.5)',
};

const LEGEND: { type: number; label: string; description: string }[] = [
  { type: 2, label: 'Solid', description: 'Occupies space.' },
  { type: 3, label: 'Anchor Point', description: 'Occupies space; allows other items to attach.' },
  { type: 4, label: 'Anchor', description: 'Must attach to a matching Anchor Point.' },
  { type: 5, label: 'Background', description: 'Cannot overlap room borders.' },
  { type: 1, label: 'Empty', description: 'Occupies no space.' },
];

function ShapeGrid({ shape, cellSize, gap }: { shape: number[][]; cellSize: number; gap: number }) {
  const rows = shape.length;
  const cols = Math.max(...shape.map((r) => r.length));

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gap,
      }}
    >
      {shape.map((row, ri) =>
        row.map((cell, ci) => (
          <div
            key={`${ri}-${ci}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: cellSize > 12 ? 3 : 2,
              background: CELL_COLORS[cell] || 'transparent',
              border: cell !== 1 ? `1px solid ${CELL_BORDERS[cell] || 'var(--border)'}` : '1px solid transparent',
            }}
          />
        )),
      )}
    </div>
  );
}

const tooltipStyle: CSSProperties = {
  position: 'fixed',
  zIndex: 1000,
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  boxShadow: 'var(--shadow)',
  padding: 16,
  display: 'flex',
  gap: 16,
  pointerEvents: 'none',
};

const legendListStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 12,
  color: 'var(--text)',
  whiteSpace: 'nowrap',
};

const legendItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const legendSwatchStyle = (type: number): CSSProperties => ({
  width: 14,
  height: 14,
  borderRadius: 3,
  flexShrink: 0,
  background: CELL_COLORS[type] || 'transparent',
  border: type !== 1 ? `1px solid ${CELL_BORDERS[type] || 'var(--border)'}` : '1px dashed var(--border)',
});

interface Props {
  shape: number[][];
  compact?: boolean;
}

export default function ShapeVisualizer({ shape, compact }: Props) {
  const rows = shape.length;
  const cols = Math.max(...shape.map((r) => r.length));
  const baseSize = compact ? 32 : 48;
  const cellSize = Math.min(compact ? 7 : 10, Math.floor((baseSize - 4) / Math.max(rows, cols)));

  const [showTooltip, setShowTooltip] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback(() => {
    timerRef.current = setTimeout(() => setShowTooltip(true), 400);
  }, []);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setShowTooltip(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getTooltipPosition = (): CSSProperties => {
    if (!wrapperRef.current) return {};
    const rect = wrapperRef.current.getBoundingClientRect();
    return {
      top: Math.max(8, rect.top - 20),
      left: rect.right + 12,
    };
  };

  // Determine which cell types are used in this shape
  const usedTypes = new Set(shape.flat());

  const gridWrapper: CSSProperties = {
    display: 'grid',
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gap: 1,
    width: baseSize,
    height: compact ? 36 : baseSize,
    flexShrink: 0,
    alignContent: 'center',
    justifyContent: 'center',
    cursor: 'default',
  };

  const bigCellSize = Math.min(20, Math.floor(120 / Math.max(rows, cols)));

  return (
    <div
      ref={wrapperRef}
      style={gridWrapper}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {shape.map((row, ri) =>
        row.map((cell, ci) => (
          <div
            key={`${ri}-${ci}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 2,
              background: CELL_COLORS[cell] || 'transparent',
              border: cell !== 1 ? `1px solid ${CELL_BORDERS[cell] || 'var(--border)'}` : 'none',
            }}
          />
        )),
      )}
      {showTooltip && (
        <div style={{ ...tooltipStyle, ...getTooltipPosition() }}>
          <ShapeGrid shape={shape} cellSize={bigCellSize} gap={2} />
          <div style={legendListStyle}>
            {LEGEND.filter((l) => usedTypes.has(l.type)).map((l) => (
              <div key={l.type} style={legendItemStyle}>
                <div style={legendSwatchStyle(l.type)} />
                <span style={{ fontWeight: 600, color: 'var(--text-h)' }}>{l.label}</span>
                <span style={{ color: 'var(--text)', marginLeft: 2 }}>– {l.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
