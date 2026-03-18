import type { CSSProperties } from 'react';
import type { Filters, SortConfig, SortField } from '../types/furniture';
import SearchInput from './SearchInput';
import StatFilter from './StatFilter';
import ToggleSwitch from './ToggleSwitch';
import SortButton from './SortButton';
import StatIcon from './StatIcon';
import CatMascot from './CatMascot';

const GRID_FULL = '56px 48px minmax(120px, 1fr) repeat(5, 60px) 90px';
const GRID_COMPACT = '36px 28px minmax(40px, 1fr) repeat(5, 28px) 68px';

const styles: Record<string, CSSProperties> = {
  wrapper: {
    padding: '12px 0',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'sticky',
    top: 0,
    background: 'var(--bg)',
    zIndex: 10,
    borderRadius: '16px 16px 0 0',
  },
};

const statColumns: { label: string; stat: string; field: SortField; filterKey: keyof Filters }[] = [
  { label: 'APL', stat: 'appeal', field: 'appeal', filterKey: 'minAppeal' },
  { label: 'CMF', stat: 'comfort', field: 'comfort', filterKey: 'minComfort' },
  { label: 'STM', stat: 'stimulation', field: 'stimulation', filterKey: 'minStimulation' },
  { label: 'HLT', stat: 'health', field: 'health', filterKey: 'minHealth' },
  { label: 'MUT', stat: 'mutation', field: 'mutation', filterKey: 'minMutation' },
];

interface Props {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
  compact?: boolean;
}

export default function FilterHeader({ filters, onFiltersChange, sort, onSortChange, compact }: Props) {
  const update = (partial: Partial<Filters>) =>
    onFiltersChange({ ...filters, ...partial });

  const headerGrid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: compact ? GRID_COMPACT : GRID_FULL,
    gridTemplateRows: 'auto auto',
    alignItems: 'center',
    gap: compact ? '8px 8px' : '8px 0',
    padding: '0 29px',
  };

  return (
    <div style={styles.wrapper}>
      <div style={headerGrid}>
        <CatMascot compact={compact} />
        <SortButton
          label="Name"
          active={sort.field === 'name'}
          direction={sort.direction}
          onClick={() => onSortChange('name')}
        />
        {statColumns.map((col) => (
          <SortButton
            key={col.field}
            label={<StatIcon stat={col.stat} size={18} />}
            active={sort.field === col.field}
            direction={sort.direction}
            onClick={() => onSortChange(col.field)}
          />
        ))}
        <SortButton
          label="Owned"
          active={sort.field === 'owned'}
          direction={sort.direction}
          onClick={() => onSortChange('owned')}
        />

        <SearchInput value={filters.name} onChange={(v) => update({ name: v })} />
        {statColumns.map((col) => (
          <StatFilter
            key={col.field}
            label={col.label}
            value={filters[col.filterKey] as number}
            onChange={(v) => update({ [col.filterKey]: v })}
          />
        ))}
        <ToggleSwitch
          checked={filters.onlyOwned}
          onChange={(v) => update({ onlyOwned: v })}
          label={compact ? '' : 'Only'}
        />
      </div>
    </div>
  );
}
