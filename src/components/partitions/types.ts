import type { RgbaColor } from 'svelte-awesome-color-picker';

export type PartitionShapeType =
  | 'circle'
  | 'triangle'
  | 'square'
  | 'plus'
  | 'cross'
  | 'circle hollow'
  | 'triangle hollow'
  | 'square hollow';

export type PartitionType = {
  size: number;
  shape: PartitionShapeType;
  color: RgbaColor;
  visible: boolean;
};
