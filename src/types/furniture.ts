export interface RawFurnitureItem {
  name: string;
  image_url: string;
  shape: number[][];
  appeal: number;
  comfort: number;
  stimulation: number;
  health: number;
  mutation: number;
}

export interface FurnitureItem extends RawFurnitureItem {
  id: string;
}

export type StatKey = 'appeal' | 'comfort' | 'stimulation' | 'health' | 'mutation';

export type SortField = 'name' | StatKey | 'owned';
export type SortDirection = 'asc' | 'desc';

export interface Filters {
  name: string;
  minAppeal: number;
  minComfort: number;
  minStimulation: number;
  minHealth: number;
  minMutation: number;
  onlyOwned: boolean;
}

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface PlacedFurniture {
  instanceId: string;
  item: FurnitureItem;
  row: number;
  col: number;
}

export const ROOM_COLS = 16;
export const ROOM_ROWS = 7;
