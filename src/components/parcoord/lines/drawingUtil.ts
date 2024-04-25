import * as THREE from 'three';
import { line as lineD3 } from 'd3-shape';
import { select } from 'd3-selection';
import { LINE_MATERIAL_ACTIVE } from '../../../util/materials';
import { COLOR_BRUSHED, COLOR_FILTERED, rgbaToHexNumber, rgbaToHexString } from '../../../util/colors';
import type { PartitionType } from '../../partitions/types';
import type { DSVParsedArray } from 'd3-dsv';
import type { DimensionDataType, MarginType, RecordDataType } from '../../../util/types';

export function initScene(canvas: OffscreenCanvas, width: number, height: number) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setClearColor(0xffffff);
  renderer.setSize(width, height, false);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  return { scene, camera, renderer, raycaster, mouse };
}

export function resetLines(lineShow: boolean[]) {
  return { lineShow, lines: [] };
}

export function getPartitionMaterial(partition?: PartitionType) {
  return partition
    ? new THREE.LineBasicMaterial({
        color: rgbaToHexNumber(partition.color),
        linewidth: 1,
        transparent: true,
        opacity: 0.75
      })
    : LINE_MATERIAL_ACTIVE;
}

export function changeLinePosition(line: THREE.Line, newZPosition: number) {
  const positions = line.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) positions[i + 2] = newZPosition;
  line.geometry.attributes.position.needsUpdate = true;
}

export function drawLine(line: THREE.Line, material: THREE.Material, needsUpdate?: boolean, newPosition?: number) {
  line.material = material;
  if (needsUpdate !== undefined) material.needsUpdate = needsUpdate;
  if (newPosition !== undefined) changeLinePosition(line, newPosition);
}

export function getUpdatedPartition(
  partitionsOld: Map<string, PartitionType>,
  partitionsNew: Map<string, PartitionType>
) {
  const partitionsNewArray = Array.from(partitionsNew.entries());
  for (let i = 0; i < partitionsOld.size; i++) {
    const partitionOld = Array.from(partitionsOld.entries())[i];
    const partitionNew = partitionsNewArray[i];

    if (partitionOld[1].visible !== partitionNew[1].visible)
      return { updatedPartition: partitionOld[0], updatedProperty: 'visible' };
    if (rgbaToHexNumber(partitionOld[1].color) !== rgbaToHexNumber(partitionNew[1].color))
      return { updatedPartition: partitionOld[0], updatedProperty: 'color' };
  }

  return { updatedPartition: null, updatedProperty: null };
}

export function getPartitionRecordsByName(data: string[], name: string) {
  return data.reduce((acc: number[], current, index) => {
    if (current === name) {
      acc.push(index);
    }
    return acc;
  }, []);
}

export function saveSVGUtil(
  width: number,
  height: number,
  dataset: DSVParsedArray<any>,
  lineShow: boolean[],
  lineData: RecordDataType[],
  dimensions: string[],
  yScales: any,
  xScales: any[],
  margin: MarginType,
  dimensionDataStore: Map<string, DimensionDataType>,
  partitionsStore: Map<string, PartitionType>,
  partitionsDataStore: string[],
  brushedArray: Set<number>
) {
  const tempContainer = document.createElement('div');
  const svgContainer = select(tempContainer).append('svg').attr('viewBox', `0 0 ${width} ${height}`);

  const lineGenerator = lineD3()
    .x((d: any) => d[0])
    .y((d: any) => d[1]);

  const filteredIndices: number[] = [],
    activeIndices: number[] = [];
  lineShow.forEach((value: boolean, i: number) => {
    value ? activeIndices.push(i) : filteredIndices.push(i);
  });

  const drawLineSVG = (dataRow: any[], color: string, opacity: number) => {
    const linePoints = [];
    for (let i = 0; i < dimensions.length; i++) {
      const dim = dimensions[i];

      let yPos;
      if (dimensionDataStore.get(dim)?.type === 'numerical') yPos = yScales[dim](dataRow[dim as any]);
      else yPos = yScales[dim](dataRow[dim as any]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

      linePoints.push([xScales[i], isNaN(yScales[dim](dataRow[dim as any])) ? margin.top : yPos + margin.top]);
    }

    svgContainer
      .append('path')
      .datum(linePoints)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', opacity)
      .attr('d', lineGenerator as any);
  };

  filteredIndices.forEach((i) => {
    drawLineSVG(dataset[i], `#${COLOR_FILTERED.toString(16).replace(/^0x/, '')}`, 0.75);
  });

  activeIndices.forEach((i) => {
    if (lineData[i].color === COLOR_BRUSHED) return;
    drawLineSVG(dataset[i], rgbaToHexString(partitionsStore.get(partitionsDataStore[i])?.color), 0.75);
  });

  brushedArray.forEach((i) => {
    drawLineSVG(dataset[i], `#${COLOR_BRUSHED.toString(16).replace(/^0x/, '')}`, 1);
  });

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgContainer.node() as Node);
  tempContainer.remove();
  return svgString;
}
