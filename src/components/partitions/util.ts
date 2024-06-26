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
import { DEFAULT_PARTITION } from '../../util/util';
import { hexStringToRgba, rgbaToHexNumber } from '../../util/colors';
import type { Writable } from 'svelte/store';
import type { PartitionShapeType, PartitionType } from './types';

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

export const PARTITION_COLORS = [
  '#4146cb',
  '#0fb5ae',
  '#df3d83',
  '#7e84fa',
  '#72e06a',
  '#7227d3',
  '#e8c701',
  '#bce830',
  '#ca5d01',
  '#f78510',
  '#147af3',
  '#018f5c'
];

export function getPartitionName(name: string, partitionNames: string[]) {
  if (name.length === 0) name = 'Partition';

  if (!partitionNames.includes(name)) return name;

  let i = 1;
  while (true) {
    const partitionName = `${name} (${i})`;
    if (!partitionNames.includes(partitionName)) return partitionName;

    i++;
  }
}

export function addPartition(
  name: string,
  partitions: Map<string, PartitionType>,
  partitionsStore: Writable<Map<string, PartitionType>>,
  selectedPartitionStore: Writable<string | null>
) {
  const shape = Array.from(PARTITION_SHAPES.keys())[partitions.size % PARTITION_SHAPES.size];
  const color = PARTITION_COLORS[partitions.size % PARTITION_COLORS.length];
  partitions.set(name, {
    size: 0,
    shape: shape,
    color: hexStringToRgba(color),
    visible: true
  });
  partitionsStore.set(partitions);
  selectedPartitionStore.set(name);
}

export function updatePartition(
  name: string,
  partition: PartitionType,
  partitions: Map<string, PartitionType>,
  partitionsStore: Writable<Map<string, PartitionType>>
) {
  partitions.set(name, partition);
  partitionsStore.set(partitions);
}

export function deletePartition(
  name: string,
  partitions: Map<string, PartitionType>,
  partitionsData: string[],
  partitionsStore: Writable<Map<string, PartitionType>>,
  partitionsDataStore: Writable<string[]>
) {
  const defaultPartition = partitions.get(DEFAULT_PARTITION);
  if (!defaultPartition) return;
  let changedRecords = 0;
  partitionsData.forEach((partition, i) => {
    if (partition === name) {
      defaultPartition.size++;
      changedRecords++;
      partitionsData[i] = DEFAULT_PARTITION;
    }
  });
  partitions.set(DEFAULT_PARTITION, defaultPartition);
  partitions.delete(name);
  partitionsStore.set(partitions);
  if (changedRecords > 0) partitionsDataStore.set(partitionsData);
}

export function renamePartition(
  oldName: string,
  newName: string,
  partitions: Map<string, PartitionType>,
  partitionsData: string[],
  partitionsStore: Writable<Map<string, PartitionType>>,
  partitionsDataStore: Writable<string[]>
) {
  if (oldName === newName || !partitions.has(oldName)) return;

  newName = getPartitionName(newName, Array.from(partitions.keys()));

  const partitionsUpdated = new Map(
    Array.from(partitions.entries()).map((record) => (record[0] === oldName ? [newName, record[1]] : record))
  );
  partitions = new Map(partitionsUpdated);
  partitionsData = partitionsData.map((record) => (record = record === oldName ? newName : record));
  partitionsStore.set(partitions);
  partitionsDataStore.set(partitionsData);
}

export function hidePartition(
  name: string,
  partitions: Map<string, PartitionType>,
  partitionsStore: Writable<Map<string, PartitionType>>
) {
  const partition = partitions.get(name);
  if (!partition) return;
  partition.visible = !partition.visible;
  partitions.set(name, partition);
  partitionsStore.set(partitions);
}

export function addRecordsToPartition(
  name: string,
  partitions: Map<string, PartitionType>,
  partitionsData: string[],
  brushedArray: Set<number>,
  brushedArrayStore: Writable<Set<number>>,
  hoveredArray: Set<number>,
  hoveredArrayStore: Writable<Set<number>>,
  partitionsStore: Writable<Map<string, PartitionType>>,
  partitionsDataStore: Writable<string[]>
) {
  [...brushedArray, ...hoveredArray].forEach((i) => {
    const oldPartition = partitions.get(partitionsData[i]);
    const newPartition = partitions.get(name);
    if (!oldPartition || !newPartition || partitionsData[i] === name) return;
    oldPartition.size--;
    partitions.set(partitionsData[i], oldPartition);
    partitionsData[i] = name;
    newPartition.size++;
    partitions.set(partitionsData[i], newPartition);
  });
  partitionsDataStore.set(partitionsData);
  partitionsStore.set(partitions);

  setTimeout(() => {
    brushedArrayStore.set(new Set());
    hoveredArrayStore.set(new Set());
  }, 0);
}

export function getUpdatedPartition(
  partitionsOld: Map<string, PartitionType>,
  partitionsNew: Map<string, PartitionType>
): {
  updatedPartition: string | null;
  updatedProperty: 'visible' | 'shape' | 'color' | 'size' | null;
} {
  const partitionsNewArray = Array.from(partitionsNew.entries());
  for (let i = 0; i < partitionsOld.size; i++) {
    const partitionOld = Array.from(partitionsOld.entries())[i];
    const partitionNew = partitionsNewArray[i];

    if (partitionOld[1].visible !== partitionNew[1].visible)
      return { updatedPartition: partitionOld[0], updatedProperty: 'visible' };
    if (partitionOld[1].shape !== partitionNew[1].shape)
      return { updatedPartition: partitionOld[0], updatedProperty: 'shape' };
    if (rgbaToHexNumber(partitionOld[1].color) !== rgbaToHexNumber(partitionNew[1].color))
      return { updatedPartition: partitionOld[0], updatedProperty: 'color' };
    if (partitionNew[1].size > partitionOld[1].size)
      return { updatedPartition: partitionOld[0], updatedProperty: 'size' };
  }

  return { updatedPartition: null, updatedProperty: null };
}
