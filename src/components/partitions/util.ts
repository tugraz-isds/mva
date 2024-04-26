import {
  shape_circle_hollow_icon,
  shape_circle_icon,
  shape_cross_icon,
  shape_plus_icon,
  shape_square_hollow_icon,
  shape_square_icon,
  shape_triangle_hollow_icon,
  shape_triangle_icon
} from '../../util/icon-definitions';
import type { PartitionShapeType } from './types';

export const PARTITION_SHAPES: Map<PartitionShapeType, string> = new Map([
  ['circle', shape_circle_icon],
  ['triangle', shape_triangle_icon],
  ['square', shape_square_icon],
  ['plus', shape_plus_icon],
  ['cross', shape_cross_icon],
  ['circle hollow', shape_circle_hollow_icon],
  ['triangle hollow', shape_triangle_hollow_icon],
  ['square hollow', shape_square_hollow_icon]
]);
