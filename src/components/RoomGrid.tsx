import { useState, useCallback, useRef, useEffect } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import type { FurnitureItem, PlacedFurniture } from '../types/furniture';
import { ROOM_COLS, ROOM_ROWS } from '../types/furniture';

const CELL_COLORS: Record<number, string> = {
  1: 'transparent',
  2: 'var(--lavender-grey)',
  3: 'var(--blushed-brick)',
  4: 'var(--sand-dune)',
  5: 'var(--charcoal)',
};

const CELL_BORDERS: Record<number, string> = {
  2: 'rgba(132,143,165,0.5)',
  3: 'rgba(193,73,83,0.5)',
  4: 'rgba(229,220,197,0.5)',
  5: 'rgba(76,76,71,0.5)',
};

interface Props {
  placed: PlacedFurniture[];
  onPlace: (item: FurnitureItem, row: number, col: number) => void;
  onRemove: (instanceId: string) => void;
  onMove: (instanceId: string, row: number, col: number) => void;
  expertView: boolean;
}

/** Build a 2D occupancy grid, optionally ignoring one instanceId (for move validation). */
function buildOccupancy(placed: PlacedFurniture[], ignoreId?: string): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: ROOM_ROWS }, () =>
    Array(ROOM_COLS).fill(null),
  );
  for (const p of placed) {
    if (p.instanceId === ignoreId) continue;
    const shape = p.item.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        const cellType = shape[r][c];
        if (cellType === 2 || cellType === 3) {
          const gr = p.row + r;
          const gc = p.col + c;
          if (gr >= 0 && gr < ROOM_ROWS && gc >= 0 && gc < ROOM_COLS) {
            grid[gr][gc] = p.instanceId;
          }
        }
      }
    }
  }
  return grid;
}

function canPlace(
  item: FurnitureItem,
  row: number,
  col: number,
  occupancy: (string | null)[][],
): boolean {
  const shape = item.shape;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      const cellType = shape[r][c];
      const gr = row + r;
      const gc = col + c;
      if (cellType === 2 || cellType === 3) {
        if (gr < 0 || gr >= ROOM_ROWS || gc < 0 || gc >= ROOM_COLS) return false;
        if (occupancy[gr][gc] !== null) return false;
      }
      if (cellType === 5) {
        if (gr < 0 || gr >= ROOM_ROWS || gc < 0 || gc >= ROOM_COLS) return false;
      }
    }
  }
  return true;
}

function buildShapeTypeGrid(placed: PlacedFurniture[]): (number | null)[][] {
  const grid: (number | null)[][] = Array.from({ length: ROOM_ROWS }, () =>
    Array(ROOM_COLS).fill(null),
  );
  for (const p of placed) {
    const shape = p.item.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        const cellType = shape[r][c];
        if (cellType !== 1) {
          const gr = p.row + r;
          const gc = p.col + c;
          if (gr >= 0 && gr < ROOM_ROWS && gc >= 0 && gc < ROOM_COLS) {
            grid[gr][gc] = cellType;
          }
        }
      }
    }
  }
  return grid;
}

// Drag payload: either a new item from the browser, or a move of an existing placed piece
type DragPayload =
  | { type: 'new'; item: FurnitureItem }
  | { type: 'move'; instanceId: string; item: FurnitureItem };

export default function RoomGrid({ placed, onPlace, onRemove, onMove, expertView }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoverCells, setHoverCells] = useState<{ row: number; col: number; valid: boolean; shape: number[][] } | null>(null);
  const dragPayloadRef = useRef<DragPayload | null>(null);

  const occupancy = buildOccupancy(placed);
  const shapeTypeGrid = expertView ? buildShapeTypeGrid(placed) : null;

  const getCellFromEvent = useCallback((e: DragEvent): { row: number; col: number } | null => {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const cellW = rect.width / ROOM_COLS;
    const cellH = rect.height / ROOM_ROWS;
    const col = Math.floor((e.clientX - rect.left) / cellW);
    const row = Math.floor((e.clientY - rect.top) / cellH);
    if (row < 0 || row >= ROOM_ROWS || col < 0 || col >= ROOM_COLS) return null;
    return { row, col };
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = dragPayloadRef.current?.type === 'move' ? 'move' : 'copy';
    const cell = getCellFromEvent(e);
    const payload = dragPayloadRef.current;
    if (!cell || !payload) {
      setHoverCells(null);
      return;
    }
    // For moves, validate against occupancy that excludes the moving piece
    const occ = payload.type === 'move'
      ? buildOccupancy(placed, payload.instanceId)
      : occupancy;
    const valid = canPlace(payload.item, cell.row, cell.col, occ);
    setHoverCells({ row: cell.row, col: cell.col, valid, shape: payload.item.shape });
  }, [getCellFromEvent, occupancy, placed]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (!gridRef.current?.contains(e.relatedTarget as Node)) {
      setHoverCells(null);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setHoverCells(null);
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const payload = dragPayloadRef.current;

    // Try move payload first
    if (payload?.type === 'move') {
      const occ = buildOccupancy(placed, payload.instanceId);
      if (canPlace(payload.item, cell.row, cell.col, occ)) {
        onMove(payload.instanceId, cell.row, cell.col);
      }
      dragPayloadRef.current = null;
      return;
    }

    // Otherwise try new item from browser
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      const item: FurnitureItem = JSON.parse(data);
      if (canPlace(item, cell.row, cell.col, occupancy)) {
        onPlace(item, cell.row, cell.col);
      }
    } catch { /* ignore */ }
    dragPayloadRef.current = null;
  }, [getCellFromEvent, occupancy, placed, onPlace, onMove]);

  // Listen for drag-start from the furniture browser
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as FurnitureItem;
      dragPayloadRef.current = { type: 'new', item: detail };
    };
    window.addEventListener('furniture-drag-start', handler);
    return () => window.removeEventListener('furniture-drag-start', handler);
  }, []);

  // Build highlight set for hover preview
  const hoverSet = new Set<string>();
  if (hoverCells) {
    const { row, col, shape } = hoverCells;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 1) {
          hoverSet.add(`${row + r}-${col + c}`);
        }
      }
    }
  }

  // Track which piece is being dragged (to ghost it)
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handlePieceDragStart = useCallback((e: DragEvent, p: PlacedFurniture) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', p.instanceId);
    dragPayloadRef.current = { type: 'move', instanceId: p.instanceId, item: p.item };
    setDraggingId(p.instanceId);
  }, []);

  const handlePieceDragEnd = useCallback(() => {
    setDraggingId(null);
    setHoverCells(null);
  }, []);

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${ROOM_COLS}, 1fr)`,
    gridTemplateRows: `repeat(${ROOM_ROWS}, 1fr)`,
    width: '100%',
    aspectRatio: `${ROOM_COLS} / ${ROOM_ROWS}`,
    background: 'var(--code-bg)',
    borderRadius: 8,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    position: 'relative',
  };

  const cellBase: CSSProperties = {
    border: '1px solid var(--border)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  // Render furniture images as overlays using absolute positioning
  const furnitureOverlays = !expertView
    ? placed.map((p) => {
        const shapeRows = p.item.shape.length;
        const shapeCols = Math.max(...p.item.shape.map((r) => r.length));
        const fixedSrc = p.item.image_url.startsWith('public/')
          ? p.item.image_url.slice(6)
          : p.item.image_url;

        // Calculate percentage positions based on grid
        const left = `${(p.col / ROOM_COLS) * 100}%`;
        const top = `${(p.row / ROOM_ROWS) * 100}%`;
        const width = `${(shapeCols / ROOM_COLS) * 100}%`;
        const height = `${(shapeRows / ROOM_ROWS) * 100}%`;

        const isDragging = draggingId === p.instanceId;

        return (
          <div
            key={p.instanceId}
            draggable
            onDragStart={(e) => handlePieceDragStart(e, p)}
            onDragEnd={handlePieceDragEnd}
            style={{
              position: 'absolute',
              left,
              top,
              width,
              height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
              cursor: 'grab',
              opacity: isDragging ? 0.3 : 1,
              transition: 'opacity 0.15s',
            }}
            title={`${p.item.name} (drag to move, click to remove)`}
            onClick={() => onRemove(p.instanceId)}
          >
            <img
              src={fixedSrc}
              alt={p.item.name}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))',
              }}
            />
          </div>
        );
      })
    : null;

  return (
    <div
      ref={gridRef}
      style={gridStyle}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {Array.from({ length: ROOM_ROWS }, (_, row) =>
        Array.from({ length: ROOM_COLS }, (_, col) => {
          const key = `${row}-${col}`;
          const isHovered = hoverSet.has(key);
          const hovValid = hoverCells?.valid ?? false;
          const occupant = occupancy[row][col];
          const shapeType = shapeTypeGrid?.[row][col];

          let bg = 'transparent';
          if (expertView && shapeType) {
            bg = CELL_COLORS[shapeType] || 'transparent';
          }

          let borderColor = 'var(--border)';
          if (expertView && shapeType && shapeType !== 1) {
            borderColor = CELL_BORDERS[shapeType] || 'var(--border)';
          }

          return (
            <div
              key={key}
              style={{
                ...cellBase,
                background: isHovered
                  ? hovValid
                    ? 'rgba(100,200,100,0.25)'
                    : 'rgba(200,100,100,0.25)'
                  : bg,
                border: `1px solid ${borderColor}`,
                cursor: expertView && occupant ? 'pointer' : 'default',
              }}
              onClick={
                expertView && occupant
                  ? () => onRemove(occupant)
                  : undefined
              }
            />
          );
        }),
      )}
      {furnitureOverlays}
    </div>
  );
}
