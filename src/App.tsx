import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { Filters, SortConfig, SortField, FurnitureItem, RawFurnitureItem, PlacedFurniture } from './types/furniture';
import furnitureData from './data/furniture_data.json';
import SplitScreenContainer from './components/SplitScreenContainer';
import FurnitureBrowser from './components/FurnitureBrowser';
import RoomDesignerWorkspace from './components/RoomDesignerWorkspace';
import SaveImportModal from './components/SaveImportModal';
import { findAllAnchored, findAnchoredPieces, wouldCollide } from './utils/anchorHelpers';
import useIsMobile from './hooks/useIsMobile';

const allFurniture: FurnitureItem[] = (furnitureData as RawFurnitureItem[]).map((item, index) => ({
  ...item,
  id: `${item.name}__${index}`,
}));

// Map for save file import matching:
// 1. lowercase display name -> id
// 2. internal name (from image_url) -> id
const furnitureIdMap = new Map<string, string>();
for (const item of allFurniture) {
  // Display name match
  const displayKey = item.name.toLowerCase();
  if (!furnitureIdMap.has(displayKey)) {
    furnitureIdMap.set(displayKey, item.id);
  }
  // Internal name match: extract from "graphics/FURNITURE_xxx.svg"
  const match = item.image_url.match(/FURNITURE_(.+)\.svg$/i);
  if (match) {
    const internalKey = match[1].toLowerCase();
    if (!furnitureIdMap.has(internalKey)) {
      furnitureIdMap.set(internalKey, item.id);
    }
  }
}

const defaultFilters: Filters = {
  name: '',
  minAppeal: -20,
  minComfort: -20,
  minStimulation: -20,
  minHealth: -20,
  minMutation: -20,
  onlyOwned: false,
};

const defaultSort: SortConfig = { field: 'name', direction: 'asc' };

const ITEMS_PER_PAGE = 50;
const STORAGE_KEY = 'mg-clawset-ownership';
const ROOM_STORAGE_KEY = 'mg-clawset-room';

let nextInstanceId = 1;

function loadRoom(): PlacedFurniture[] {
  try {
    const raw = localStorage.getItem(ROOM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PlacedFurniture[];
      for (const p of parsed) {
        const num = parseInt(p.instanceId.split('-').pop() || '0', 10);
        if (num >= nextInstanceId) nextInstanceId = num + 1;
      }
      return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function loadOwnership(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

const layoutStyles: Record<string, CSSProperties> = {
  main: {
    width: '100%',
    height: '100vh',
    overflow: 'hidden',
    fontFamily: "'Rubik', system-ui, sans-serif",
  },
  browserWrapper: {
    minHeight: 0,
    height: '100%',
    position: 'relative',
    overflow: 'visible',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
  },
};

function App() {
  const isMobile = useIsMobile();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortConfig>(defaultSort);
  const [ownership, setOwnership] = useState<Record<string, number>>(loadOwnership);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [placed, setPlaced] = useState<PlacedFurniture[]>(loadRoom);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Force collapse room designer on mobile
  useEffect(() => {
    if (isMobile && expanded) setExpanded(false);
  }, [isMobile, expanded]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ownership));
  }, [ownership]);

  useEffect(() => {
    localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(placed));
  }, [placed]);

  const handlePlaceFurniture = useCallback((item: FurnitureItem, row: number, col: number) => {
    const instanceId = `placed-${nextInstanceId++}`;
    setPlaced((prev) => [...prev, { instanceId, item, row, col }]);
  }, []);

  const handleRemoveFurniture = useCallback((instanceId: string) => {
    setPlaced((prev) => {
      const cascadeIds = findAnchoredPieces(instanceId, prev);
      const removeSet = new Set([instanceId, ...cascadeIds]);
      return prev.filter((p) => !removeSet.has(p.instanceId));
    });
  }, []);

  const handleMoveFurniture = useCallback((instanceId: string, newRow: number, newCol: number) => {
    setPlaced((prev) => {
      const target = prev.find(p => p.instanceId === instanceId);
      if (!target) return prev;

      const dRow = newRow - target.row;
      const dCol = newCol - target.col;

      // Recursively find ALL pieces anchored to the moving piece
      const anchoredIds = findAllAnchored(instanceId, prev);
      const movedIds = new Set([instanceId, ...anchoredIds]);

      // Move the target and all anchored pieces by the same delta
      let next = prev.map(p =>
        movedIds.has(p.instanceId)
          ? { ...p, row: p.row + (p.instanceId === instanceId ? newRow - target.row : dRow), col: p.col + (p.instanceId === instanceId ? newCol - target.col : dCol) }
          : p
      );

      // Build occupancy from non-moved pieces to check collisions
      const occupiedByOthers = new Set<string>();
      for (const p of next) {
        if (movedIds.has(p.instanceId)) continue;
        for (let r = 0; r < p.item.shape.length; r++) {
          for (let c = 0; c < p.item.shape[r].length; c++) {
            const t = p.item.shape[r][c];
            if (t === 2 || t === 3) {
              occupiedByOthers.add(`${p.row + r},${p.col + c}`);
            }
          }
        }
      }

      // Remove anchored pieces that now collide or are out of bounds
      const toRemove = new Set<string>();
      for (const aid of anchoredIds) {
        const piece = next.find(p => p.instanceId === aid)!;
        if (wouldCollide(piece.item, piece.row, piece.col, occupiedByOthers)) {
          toRemove.add(aid);
        }
      }

      if (toRemove.size > 0) {
        // Also cascade-remove anything anchored to the colliding pieces
        for (const rid of toRemove) {
          const cascaded = findAnchoredPieces(rid, next);
          for (const cid of cascaded) toRemove.add(cid);
        }
        next = next.filter(p => !toRemove.has(p.instanceId));
      }

      return next;
    });
  }, []);

  const handleSortChange = useCallback((field: SortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPage(0);
  }, []);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handleIncrement = useCallback((id: string) => {
    setOwnership((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, []);

  const handleImportOwnership = useCallback((newOwnership: Record<string, number>) => {
    setOwnership(newOwnership);
  }, []);

  const handleDecrement = useCallback((id: string) => {
    setOwnership((prev) => {
      const current = prev[id] || 0;
      if (current <= 0) return prev;
      return { ...prev, [id]: current - 1 };
    });
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = allFurniture.filter((item) => {
      if (filters.name && !item.name.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (item.appeal < filters.minAppeal) return false;
      if (item.comfort < filters.minComfort) return false;
      if (item.stimulation < filters.minStimulation) return false;
      if (item.health < filters.minHealth) return false;
      if (item.mutation < filters.minMutation) return false;
      if (filters.onlyOwned && !(ownership[item.id] > 0)) return false;
      return true;
    });

    result = [...result].sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      if (sort.field === 'name') {
        return dir * a.name.localeCompare(b.name);
      }
      if (sort.field === 'owned') {
        return dir * ((ownership[a.id] || 0) - (ownership[b.id] || 0));
      }
      const diff = a[sort.field] - b[sort.field];
      if (diff !== 0) return dir * diff;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [filters, sort, ownership]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE));
  const clampedPage = Math.min(page, totalPages - 1);
  const pagedItems = filteredAndSorted.slice(
    clampedPage * ITEMS_PER_PAGE,
    (clampedPage + 1) * ITEMS_PER_PAGE,
  );

  return (
    <div style={{
      ...layoutStyles.main,
      ...(isMobile ? { height: 'auto', minHeight: '100vh', overflow: 'visible' } : {}),
    }}>
      <SplitScreenContainer>
        <div
          style={{
            ...layoutStyles.browserWrapper,
            width: isMobile ? '100%' : expanded ? '38%' : 'calc(100% - 24px)',
            ...(isMobile ? { height: 'auto', overflow: 'visible', transition: 'none', position: 'static' as const } : {}),
          }}
        >
          <FurnitureBrowser
            items={pagedItems}
            totalItems={filteredAndSorted.length}
            ownership={ownership}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sort={sort}
            onSortChange={handleSortChange}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            expanded={expanded}
            onToggle={() => setExpanded((prev) => !prev)}
            page={clampedPage}
            totalPages={totalPages}
            onPageChange={setPage}
            onImportClick={() => setImportModalOpen(true)}
            isMobile={isMobile}
          />
        </div>
        {!isMobile && (
          <RoomDesignerWorkspace
            visible={expanded}
            placed={placed}
            onPlace={handlePlaceFurniture}
            onRemove={handleRemoveFurniture}
            onMove={handleMoveFurniture}
          />
        )}
      </SplitScreenContainer>
      <SaveImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImportOwnership}
        furnitureIdMap={furnitureIdMap}
      />
    </div>
  );
}

export default App;
