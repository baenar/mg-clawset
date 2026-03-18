import { useState, useCallback, useRef, useEffect } from 'react';
import type { CSSProperties, DragEvent } from 'react';
import type { FurnitureItem, PlacedFurniture } from '../types/furniture';
import { ROOM_COLS, ROOM_ROWS } from '../types/furniture';
import { findAllAnchored, canPlaceGroup } from '../utils/anchorHelpers';

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

/** Build a 2D occupancy grid, optionally ignoring certain instanceIds (for move validation). */
function buildOccupancy(placed: PlacedFurniture[], ignoreId?: string, ignoreIds?: Set<string>): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: ROOM_ROWS }, () =>
    Array(ROOM_COLS).fill(null),
  );
  for (const p of placed) {
    if (p.instanceId === ignoreId) continue;
    if (ignoreIds?.has(p.instanceId)) continue;
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

function buildAnchorPointSet(placed: PlacedFurniture[], ignoreId?: string, ignoreIds?: Set<string>): Set<string> {
  const set = new Set<string>();

  for (let c = 0; c < ROOM_COLS; c++) {
    set.add(`${ROOM_ROWS},${c}`);
  }

  for (let c = 0; c < ROOM_COLS; c++) {
    set.add(`${-1},${c}`);
  }

  for (const p of placed) {
    if (p.instanceId === ignoreId) continue;
    if (ignoreIds?.has(p.instanceId)) continue;
    const shape = p.item.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 3) {
          set.add(`${p.row + r},${p.col + c}`);
        }
      }
    }
  }
  return set;
}

function canPlace(
  item: FurnitureItem,
  row: number,
  col: number,
  occupancy: (string | null)[][],
  anchorPointSet: Set<string>,
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
      if (cellType === 4) {
        if (gc < 0 || gc >= ROOM_COLS) return false;
        if (!anchorPointSet.has(`${gr},${gc}`)) return false;
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

function getVisualBounds(shape: number[][]): { minR: number; maxR: number; minC: number; maxC: number } {
  let minR = shape.length;
  let maxR = -1;
  let minC = shape[0]?.length ?? 0;
  let maxC = -1;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      const t = shape[r][c];
      if (t === 2 || t === 3 || t === 5) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  if (maxR === -1) {
    minR = 0;
    maxR = shape.length - 1;
    minC = 0;
    maxC = Math.max(...shape.map((row) => row.length)) - 1;
  }
  return { minR, maxR, minC, maxC };
}

/**
 * Determine vertical alignment for the furniture image.
 * - If the topmost visual row contains an anchor point (3), push image to top
 *   so it visually touches the top grid line.
 * - If there are anchor cells (4) below the visual bounds, push image to bottom
 *   so it sits on top of the anchor attachment.
 * - Otherwise center.
 */
function getImageAlignment(shape: number[][]): 'top' | 'bottom' | 'center' {
  const vis = getVisualBounds(shape);

  // Check if top visual row has anchor points (type 3)
  let topHasAnchorPoint = false;
  if (vis.minR >= 0 && vis.minR < shape.length) {
    topHasAnchorPoint = shape[vis.minR].some(c => c === 3);
  }

  // Check if there are anchor cells (type 4) below visual bounds
  let hasAnchorBelow = false;
  for (let r = vis.maxR + 1; r < shape.length; r++) {
    if (shape[r].some(c => c === 4)) { hasAnchorBelow = true; break; }
  }

  // Bottom anchor takes priority (image rests on shelf)
  if (hasAnchorBelow) return 'bottom';
  // Then top anchor point (image should touch the ceiling/top grid)
  if (topHasAnchorPoint) return 'top';
  return 'center';
}

type DragPayload =
  | { type: 'new'; item: FurnitureItem }
  | { type: 'move'; instanceId: string; item: FurnitureItem };

/** For a move drag, compute the group of shapes to highlight (target + all anchored pieces). */
interface HoverInfo {
  shapes: { row: number; col: number; shape: number[][] }[];
  valid: boolean;
}

export default function RoomGrid({ placed, onPlace, onRemove, onMove, expertView }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const dragPayloadRef = useRef<DragPayload | null>(null);

  const occupancy = buildOccupancy(placed);
  const anchorPoints = buildAnchorPointSet(placed);
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
      setHoverInfo(null);
      return;
    }

    if (payload.type === 'move') {
      // Find the target piece and all anchored pieces
      const target = placed.find(p => p.instanceId === payload.instanceId);
      if (!target) { setHoverInfo(null); return; }
      const anchoredIds = findAllAnchored(payload.instanceId, placed);
      const groupIds = new Set([payload.instanceId, ...anchoredIds]);

      const dRow = cell.row - target.row;
      const dCol = cell.col - target.col;

      // Build moved group positions
      const movedGroup = placed
        .filter(p => groupIds.has(p.instanceId))
        .map(p => ({ item: p.item, row: p.row + dRow, col: p.col + dCol }));

      // Build occupancy/anchor points excluding the entire group
      const occ = buildOccupancy(placed, undefined, groupIds);
      const ap = buildAnchorPointSet(placed, undefined, groupIds);
      const valid = canPlaceGroup(movedGroup, occ, ap);

      const shapes = movedGroup.map(p => ({ row: p.row, col: p.col, shape: p.item.shape }));
      setHoverInfo({ shapes, valid });
    } else {
      // New item from browser
      const valid = canPlace(payload.item, cell.row, cell.col, occupancy, anchorPoints);
      setHoverInfo({ shapes: [{ row: cell.row, col: cell.col, shape: payload.item.shape }], valid });
    }
  }, [getCellFromEvent, occupancy, anchorPoints, placed]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (!gridRef.current?.contains(e.relatedTarget as Node)) {
      setHoverInfo(null);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setHoverInfo(null);
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const payload = dragPayloadRef.current;

    if (payload?.type === 'move') {
      const target = placed.find(p => p.instanceId === payload.instanceId);
      if (!target) { dragPayloadRef.current = null; return; }
      const anchoredIds = findAllAnchored(payload.instanceId, placed);
      const groupIds = new Set([payload.instanceId, ...anchoredIds]);

      const dRow = cell.row - target.row;
      const dCol = cell.col - target.col;

      const movedGroup = placed
        .filter(p => groupIds.has(p.instanceId))
        .map(p => ({ item: p.item, row: p.row + dRow, col: p.col + dCol }));

      const occ = buildOccupancy(placed, undefined, groupIds);
      const ap = buildAnchorPointSet(placed, undefined, groupIds);

      if (canPlaceGroup(movedGroup, occ, ap)) {
        onMove(payload.instanceId, cell.row, cell.col);
      }
      dragPayloadRef.current = null;
      return;
    }

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      const item: FurnitureItem = JSON.parse(data);
      if (canPlace(item, cell.row, cell.col, occupancy, anchorPoints)) {
        onPlace(item, cell.row, cell.col);
      }
    } catch { /* ignore */ }
    dragPayloadRef.current = null;
  }, [getCellFromEvent, occupancy, anchorPoints, placed, onPlace, onMove]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as FurnitureItem;
      dragPayloadRef.current = { type: 'new', item: detail };
    };
    window.addEventListener('furniture-drag-start', handler);
    return () => window.removeEventListener('furniture-drag-start', handler);
  }, []);

  const hoverSet = new Set<string>();
  if (hoverInfo) {
    for (const s of hoverInfo.shapes) {
      for (let r = 0; r < s.shape.length; r++) {
        for (let c = 0; c < s.shape[r].length; c++) {
          const t = s.shape[r][c];
          // Skip empty (1) and anchor (4) cells — don't highlight anchors
          if (t !== 1 && t !== 4) {
            hoverSet.add(`${s.row + r}-${s.col + c}`);
          }
        }
      }
    }
  }

  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handlePieceDragStart = useCallback((e: DragEvent, p: PlacedFurniture) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', p.instanceId);
    dragPayloadRef.current = { type: 'move', instanceId: p.instanceId, item: p.item };
    setDraggingId(p.instanceId);
  }, []);

  const handlePieceDragEnd = useCallback(() => {
    setDraggingId(null);
    setHoverInfo(null);
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

  const furnitureOverlays = !expertView
    ? placed.map((p) => {
        const { minR, maxR, minC, maxC } = getVisualBounds(p.item.shape);
        const visualRows = maxR - minR + 1;
        const visualCols = maxC - minC + 1;
        const anchorAlign = getImageAlignment(p.item.shape);

        const fixedSrc = p.item.image_url.startsWith('public/')
          ? p.item.image_url.slice(6)
          : p.item.image_url;

        const left = `${((p.col + minC) / ROOM_COLS) * 100}%`;
        const top = `${((p.row + minR) / ROOM_ROWS) * 100}%`;
        const width = `${(visualCols / ROOM_COLS) * 100}%`;
        const height = `${(visualRows / ROOM_ROWS) * 100}%`;

        // For items with anchor at top or bottom, prioritize filling height
        // so the image touches the grid edge. Allow horizontal overflow (centered).
        const fillHeight = anchorAlign === 'top' || anchorAlign === 'bottom';

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
              zIndex: 2,
              cursor: 'grab',
              opacity: isDragging ? 0.3 : 1,
              transition: 'opacity 0.15s',
              overflow: 'visible',
              display: 'flex',
              alignItems: anchorAlign === 'bottom' ? 'flex-end' : anchorAlign === 'top' ? 'flex-start' : 'center',
              justifyContent: 'center',
            }}
            title={`${p.item.name} (drag to move, click to remove)`}
            onClick={() => onRemove(p.instanceId)}
          >
            <img
              src={fixedSrc}
              alt={p.item.name}
              draggable={false}
              style={{
                height: '100%',
                width: fillHeight ? 'auto' : '100%',
                maxWidth: fillHeight ? 'none' : '100%',
                objectFit: fillHeight ? undefined : 'contain',
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
                background: bg,
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
      {/* Hover highlight overlay – always on top of furniture images */}
      {hoverInfo && Array.from({ length: ROOM_ROWS }, (_, row) =>
        Array.from({ length: ROOM_COLS }, (_, col) => {
          const key = `hover-${row}-${col}`;
          if (!hoverSet.has(`${row}-${col}`)) return null;
          const valid = hoverInfo.valid;
          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                left: `${(col / ROOM_COLS) * 100}%`,
                top: `${(row / ROOM_ROWS) * 100}%`,
                width: `${(1 / ROOM_COLS) * 100}%`,
                height: `${(1 / ROOM_ROWS) * 100}%`,
                background: valid
                  ? 'rgba(100,200,100,0.35)'
                  : 'rgba(200,100,100,0.35)',
                border: `2px solid ${valid ? 'rgba(100,200,100,0.7)' : 'rgba(200,100,100,0.7)'}`,
                zIndex: 10,
                pointerEvents: 'none',
                boxSizing: 'border-box',
              }}
            />
          );
        }),
      )}
    </div>
  );
}
