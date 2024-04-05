import type { RgbaColor } from 'svelte-awesome-color-picker';

export type ColorPickerPositionType = {
  position: { x: number; y: number };
  windowSize: { width: number; height: number };
};

export type PartitionShapeType = 'circle' | 'triangle' | 'square';

export type PartitionType = {
  size: number;
  shape: PartitionShapeType;
  color: RgbaColor;
};
