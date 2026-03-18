import { useState, useMemo, useCallback, useEffect } from 'react';
import type { CSSProperties } from 'react';
import type { Filters, SortConfig, SortField, FurnitureItem, RawFurnitureItem, PlacedFurniture } from './types/furniture';
import furnitureData from './data/furniture_data.json';
import SplitScreenContainer from './components/SplitScreenContainer';
import FurnitureBrowser from './components/FurnitureBrowser';
import RoomDesignerWorkspace from './components/RoomDesignerWorkspace';
import SaveImportModal from './components/SaveImportModal';

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
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortConfig>(defaultSort);
  const [ownership, setOwnership] = useState<Record<string, number>>(loadOwnership);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [placed, setPlaced] = useState<PlacedFurniture[]>(loadRoom);
  const [importModalOpen, setImportModalOpen] = useState(false);

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
    setPlaced((prev) => prev.filter((p) => p.instanceId !== instanceId));
  }, []);

  const handleMoveFurniture = useCallback((instanceId: string, row: number, col: number) => {
    setPlaced((prev) => prev.map((p) => p.instanceId === instanceId ? { ...p, row, col } : p));
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
    <div style={layoutStyles.main}>
      <SplitScreenContainer>
        <div
          style={{
            ...layoutStyles.browserWrapper,
            width: expanded ? '38%' : 'calc(100% - 24px)',
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
          />
        </div>
        <RoomDesignerWorkspace
          visible={expanded}
          placed={placed}
          onPlace={handlePlaceFurniture}
          onRemove={handleRemoveFurniture}
          onMove={handleMoveFurniture}
        />
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
