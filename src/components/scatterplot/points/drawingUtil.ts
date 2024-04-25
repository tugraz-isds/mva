import * as THREE from 'three';
import { select } from 'd3-selection';
import { COLOR_BRUSHED, COLOR_FILTERED, rgbaToHexNumber, rgbaToHexString } from '../../../util/colors';
import { LINE_MATERIAL_ACTIVE, POINT_MATERIAL_ACTIVE } from '../../../util/materials';
import type { PartitionType } from '../../partitions/types';

export type PointType = THREE.Mesh & {
  index?: number;
};

export type StrokeType = THREE.LineLoop & {
  index?: number;
};

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

export function resetPoints(pointShow: boolean[]) {
  return { pointShow, points: [], strokes: Array(pointShow.length).fill(null) };
}

export function getPartitionMaterial(partition?: PartitionType): THREE.Material {
  return partition
    ? new THREE.MeshBasicMaterial({
        color: rgbaToHexNumber(partition.color),
        transparent: true,
        opacity: partition.shape.includes('hollow') ? 0 : 0.75,
        side: THREE.DoubleSide
      })
    : POINT_MATERIAL_ACTIVE;
}

export function getPartitionMaterialStroke(partition?: PartitionType) {
  return partition
    ? new THREE.LineBasicMaterial({
        color: rgbaToHexNumber(partition.color),
        linewidth: 1,
        transparent: true,
        opacity: 0.75
      })
    : LINE_MATERIAL_ACTIVE;
}

export function getPartitionGeometry(pointSize: number, partition?: PartitionType) {
  if (!partition || partition.shape === 'circle' || partition.shape === 'circle hollow')
    return new THREE.CircleGeometry(pointSize * 1.2, 16);
  else if (partition.shape === 'triangle' || partition.shape === 'triangle hollow') {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -pointSize * 1.2,
      pointSize * 1.2,
      0.0,
      0.0,
      -pointSize * 1.2,
      0.0,
      pointSize * 1.2,
      pointSize * 1.2,
      0.0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  } else if (partition.shape === 'plus' || partition.shape === 'cross') {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -(pointSize + 1) * 0.3,
      -(pointSize + 1),
      0.0,
      (pointSize + 1) * 0.3,
      -(pointSize + 1),
      0.0,
      (pointSize + 1) * 0.3,
      pointSize + 1,
      0.0,
      -(pointSize + 1) * 0.3,
      pointSize + 1,
      0.0,
      -(pointSize + 1),
      -(pointSize + 1) * 0.3,
      0.0,
      pointSize + 1,
      -(pointSize + 1) * 0.3,
      0.0,
      pointSize + 1,
      (pointSize + 1) * 0.3,
      0.0,
      -(pointSize + 1),
      (pointSize + 1) * 0.3,
      0.0
    ]);
    const indices = new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    if (partition.shape === 'cross') geometry.rotateZ(Math.PI / 4);
    return geometry;
  } else if (partition.shape === 'square' || partition.shape === 'square hollow')
    return new THREE.PlaneGeometry(pointSize * 2, pointSize * 2);
}

export function getPartitionGeometryStroke(pointSize: number, partition?: PartitionType) {
  if (!partition || partition.shape === 'circle hollow') return new THREE.RingGeometry(pointSize, pointSize * 1.2, 16);
  if (partition.shape === 'triangle hollow') {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -pointSize * 1.2,
      pointSize * 1.2,
      0.0,
      0.0,
      -pointSize * 1.2,
      0.0,
      pointSize * 1.2,
      pointSize * 1.2,
      0.0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  } else if (partition.shape === 'square hollow') {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -pointSize,
      pointSize,
      0.0,
      -pointSize,
      -pointSize,
      0.0,
      pointSize,
      -pointSize,
      0.0,
      pointSize,
      pointSize,
      0.0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return geometry;
  }
}

export function getPoint(
  currPoint: number[],
  index: number,
  pointData: PointType,
  pointSize: number,
  partition?: PartitionType
) {
  let point: PointType;
  const pointGeometry = getPartitionGeometry(pointSize, partition);
  const material = getPartitionMaterial(partition);
  material.needsUpdate = false;
  point = new THREE.Mesh(pointGeometry, material);
  point.position.set(currPoint[0], currPoint[1], pointData ? pointData.position.z : currPoint[2]);
  point.index = index;

  return point;
}

export function getStroke(
  currPoint: number[],
  index: number,
  pointData: PointType,
  pointSize: number,
  partition?: PartitionType
) {
  let stroke: StrokeType;
  const pointGeometry = getPartitionGeometryStroke(pointSize, partition);
  const material = getPartitionMaterialStroke(partition);
  material.needsUpdate = false;
  stroke = new THREE.LineLoop(pointGeometry, material);
  stroke.position.set(currPoint[0], currPoint[1], pointData ? pointData.position.z : currPoint[2]);
  stroke.index = index;

  return stroke;
}

export function changePointPosition(point: PointType, newZPosition: number) {
  point.position.z = newZPosition;
  point.geometry.attributes.position.needsUpdate = true;
}

export function drawPoint(point: PointType, material: THREE.Material, needsUpdate?: boolean, newPosition?: number) {
  point.material = material;
  if (needsUpdate !== undefined) material.needsUpdate = needsUpdate;
  if (newPosition !== undefined) changePointPosition(point, newPosition);
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
    if (partitionOld[1].shape !== partitionNew[1].shape)
      return { updatedPartition: partitionOld[0], updatedProperty: 'shape' };
    if (rgbaToHexNumber(partitionOld[1].color) !== rgbaToHexNumber(partitionNew[1].color))
      return { updatedPartition: partitionOld[0], updatedProperty: 'color' };
    if (partitionNew[1].size > partitionOld[1].size)
      return { updatedPartition: partitionOld[0], updatedProperty: 'size' };
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
  pointShow: boolean[],
  points: number[][],
  partitionsStore: Map<string, PartitionType>,
  partitionsDataStore: string[],
  brushedArray: Set<number>
) {
  const tempContainer = document.createElement('div');
  const svgContainer = select(tempContainer).append('svg').attr('viewBox', `0 0 ${width} ${height}`);

  const filteredIndices: number[] = [],
    activeIndices: number[] = [];
  pointShow.forEach((value: boolean, i: number) => {
    value ? activeIndices.push(i) : filteredIndices.push(i);
  });

  const drawPointSVG = (point: number[], color: string, opacity: number) => {
    svgContainer
      .append('circle')
      .attr('cx', point[0])
      .attr('cy', point[1])
      .attr('r', 5)
      .attr('fill', color)
      .attr('fill-opacity', opacity);
  };

  filteredIndices.forEach((i) => {
    drawPointSVG(points[i], `#${COLOR_FILTERED.toString(16).replace(/^0x/, '')}`, 0.75);
  });

  activeIndices.forEach((i) => {
    if (brushedArray.has(i)) return;
    drawPointSVG(points[i], rgbaToHexString(partitionsStore.get(partitionsDataStore[i])?.color), 0.75);
  });

  brushedArray.forEach((i) => {
    drawPointSVG(points[i], `#${COLOR_BRUSHED.toString(16).replace(/^0x/, '')}`, 1);
  });

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgContainer.node() as Node);
  tempContainer.remove();
  return svgString;
}
