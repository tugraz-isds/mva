import * as THREE from 'three';
import { rgbaToHexNumber } from '../../../util/colors';
import { POINT_MATERIAL_ACTIVE } from '../../../util/materials';
import type { PartitionType } from '../../partitions/types';

export type PointType = THREE.Mesh & {
  index: number;
};

export function initScene(
  canvas: OffscreenCanvas,
  width: number,
  height: number
): {
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
} {
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

export function resetPoints(pointShow: boolean[]): { pointShow: boolean[]; points: PointType[] } {
  return { pointShow, points: [] };
}

export function getPartitionMaterial(partition?: PartitionType): THREE.MeshBasicMaterial {
  return partition
    ? new THREE.MeshBasicMaterial({
        color: rgbaToHexNumber(partition.color),
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide
      })
    : POINT_MATERIAL_ACTIVE;
}

export function getPartitionGeometry(
  pointSize: number,
  partition?: PartitionType
): THREE.CircleGeometry | THREE.BufferGeometry | THREE.PlaneGeometry {
  if (!partition || partition.shape === 'circle') return new THREE.CircleGeometry(pointSize, 16);
  else if (partition.shape === 'triangle') {
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
  } else return new THREE.PlaneGeometry(pointSize * 2, pointSize * 2);
}

export function changePointPosition(
  point: THREE.Mesh & { index?: number },
  newZPosition: number
): PointType {
  point.position.z = newZPosition;
  point.geometry.attributes.position.needsUpdate = true;

  return point as PointType;
}

export function drawPoint(
  point: PointType,
  material: THREE.Material,
  needsUpdate?: boolean,
  newPosition?: number
): PointType {
  point.material = material;
  if (needsUpdate !== undefined) material.needsUpdate = needsUpdate;
  if (newPosition !== undefined) changePointPosition(point, newPosition);

  return point;
}

export function getUpdatedPartition(
  partitionsOld: Map<string, PartitionType>,
  partitionsNew: Map<string, PartitionType>
): { updatedPartition: string | null; updatedProperty: 'shape' | 'color' | null } {
  const partitionsNewArray = Array.from(partitionsNew.entries());
  Array.from(partitionsOld.entries()).forEach((partition, i) => {
    if (partition[1].shape !== partitionsNewArray[i][1].shape)
      return { updatedPartition: partition[0], updatedProperty: 'shape' };
    if (rgbaToHexNumber(partition[1].color) !== rgbaToHexNumber(partitionsNewArray[i][1].color))
      return { partition: partition[0], updatedProperty: 'color' };
  });
  return { updatedPartition: null, updatedProperty: null };
}

export function getPartitionRecordsByName(data: string[], name: string): number[] {
  return data.reduce((acc: number[], current, index) => {
    if (current === name) {
      acc.push(index);
    }
    return acc;
  }, []);
}
