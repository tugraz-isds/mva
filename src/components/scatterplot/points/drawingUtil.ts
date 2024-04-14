import * as THREE from 'three';
import { rgbaToHexNumber } from '../../../util/colors';
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
  if (!partition || partition.shape === 'circle') return new THREE.CircleGeometry(pointSize, 16);
  else if (partition.shape === 'triangle' || partition.shape === 'triangle hollow') {
    const triangleGeometry = new THREE.BufferGeometry();
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
    triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return triangleGeometry;
  } else if (partition.shape === 'square' || partition.shape === 'square hollow')
    return new THREE.PlaneGeometry(pointSize * 2, pointSize * 2);
}

export function getPartitionGeometryStroke(pointSize: number, partition?: PartitionType) {
  //if (!partition || partition.shape === 'circle') return new THREE.CircleGeometry(pointSize, 16);
  if (!partition) return new THREE.CircleGeometry(pointSize, 16);
  if (partition.shape === 'triangle hollow') {
    const triangleGeometry = new THREE.BufferGeometry();
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
    triangleGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return triangleGeometry;
  } else if (partition.shape === 'square hollow') {
    const squareGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -pointSize * 1.2,
      pointSize * 1.2,
      0.0,
      -pointSize * 1.2,
      -pointSize * 1.2,
      0.0,
      pointSize * 1.2,
      -pointSize * 1.2,
      0.0,
      pointSize * 1.2,
      pointSize * 1.2,
      0.0
    ]);
    squareGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    return squareGeometry;
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
  if (point instanceof THREE.Group) {
    (point.children[0] as THREE.LineLoop).geometry.attributes.position.needsUpdate = true;
    (point.children[1] as THREE.LineLoop).geometry.attributes.position.needsUpdate = true;
  } else point.geometry.attributes.position.needsUpdate = true;
}

export function drawPoint(point: PointType, material: THREE.Material, needsUpdate?: boolean, newPosition?: number) {
  if (point instanceof THREE.Group) {
    (point.children[0] as THREE.LineLoop).material = material;
    (point.children[1] as THREE.LineLoop).material = material;
  } else point.material = material;
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

    if (partitionOld[1].shape !== partitionNew[1].shape)
      return { updatedPartition: partitionOld[0], updatedProperty: 'shape' };

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
