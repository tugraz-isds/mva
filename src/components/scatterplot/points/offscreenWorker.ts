import { POINT_MATERIAL_BRUSHED, POINT_MATERIAL_FILTERED, POINT_MATERIAL_HOVERED } from '../../../util/materials';
import * as THREE from 'three';
import {
  drawPoint,
  getPartitionGeometry,
  getPartitionGeometryStroke,
  getPartitionMaterial,
  getPartitionMaterialStroke,
  getPartitionRecordsByName,
  getPoint,
  getStroke,
  getUpdatedPartition,
  initScene,
  resetPoints,
  type PointType,
  type StrokeType
} from './drawingUtil';
import { DEFAULT_PARTITION, areSetsEqual } from '../../../util/util';
import type { PartitionType } from '../../partitions/types';

let width: number, height: number;

let canvas: OffscreenCanvas;
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let points: PointType[] = [];
let strokes: (StrokeType | null)[] = [];
let pointSize: number;

let hoveredPointsIndices = new Set<number>(),
  previouslyHoveredPointsIndices = new Set<number>(),
  brushedPointsIndices = new Set<number>(),
  previouslyBrushedPointsIndices = new Set<number>();
let pointShow: boolean[] = [];
let partitionsData: string[] = [];
let partitions: Map<string, PartitionType> = new Map();

self.onmessage = function (message) {
  const data = message.data;
  switch (data.function) {
    case 'init':
      ({ canvas, width, height, pointSize } = data);
      ({ scene, camera, renderer, raycaster, mouse } = initScene(canvas, width, height));
      break;
    case 'resetPoints':
      ({ pointShow, points, strokes } = resetPoints(data.pointShow));
      break;
    case 'setLinking':
      setLinking(data.pointShow);
      break;
    case 'drawPoints':
      drawPoints(data.points);
      break;
    case 'mouseMove':
      mouse = data.mouse;
      handleMouseMove();
      break;
    case 'mouseDown':
      mouse = data.mouse;
      handleMouseDown(data.event);
      break;
    case 'updateHovered':
      drawHoveredPoints(data.indices);
      break;
    case 'updatePreviouslyHovered':
      removePreviouslyHoveredPoints(data.indices);
      break;
    case 'updateBrushed':
      drawBrushedPoints(data.indices);
      break;
    case 'updatePreviouslyBrushed':
      removePreviouslyBrushedPoints(data.indices);
      break;
    case 'resizeCanvas':
      ({ width, height } = data);
      ({ scene, camera, renderer, raycaster, mouse } = initScene(canvas, width, height));
      resizeCanvas(canvas, width, height);
      break;
    case 'updatePartitions':
      if (data.partitionsData !== null) partitionsData = data.partitionsData;
      if (data.partitions !== null) updatePartitions(data.partitions);
      break;
    default:
      break;
  }
};

function setLinking(show: boolean[]) {
  pointShow.forEach((isPointShow: boolean, i: number) => {
    if (isPointShow === show[i]) return;
    if (show[i]) {
      if (brushedPointsIndices.has(i)) drawPoint(points[i], POINT_MATERIAL_BRUSHED, false, 1);
      else drawPoint(points[i], getPartitionMaterial(partitions.get(partitionsData[i])), false, 0);
    } else drawPoint(points[i], POINT_MATERIAL_FILTERED, false, -1);
  });
  pointShow = show;
}

function drawPoints(inputPoints: number[][]) {
  scene.children = [];
  strokes = Array(inputPoints.length).fill(null);
  inputPoints.forEach((currPoint: number[], i: number) => {
    const partition = partitions.get(partitionsData[i]);
    const point = getPoint(currPoint, i, points[i], pointSize, partition);
    points[i] = point as PointType;
    scene.add(point);

    if (partition?.shape.includes('hollow')) {
      const stroke = getStroke(currPoint, i, points[i], pointSize, partition);
      scene.add(stroke);
    }
  });

  animate();
}

function handleMouseMove() {
  raycaster.setFromCamera(mouse, camera); // Check for intersections
  const hoveredPointsSet: Set<number> = new Set();
  const intersectingPoints = raycaster.intersectObjects(points);
  intersectingPoints.forEach((intersection) => {
    const line = intersection.object as any;
    if (pointShow[line.index]) hoveredPointsSet.add(line.index);
  });
  previouslyHoveredPointsIndices = hoveredPointsIndices;
  if (areSetsEqual(previouslyHoveredPointsIndices, hoveredPointsSet)) return;

  hoveredPointsIndices = hoveredPointsSet;
  removePreviouslyHoveredPoints();
  drawHoveredPoints();

  postMessage({
    function: 'setHovered',
    hoveredIndices: hoveredPointsIndices
  });
}

function handleMouseDown(event: { ctrlKey: boolean; shiftKey: boolean }) {
  previouslyBrushedPointsIndices = brushedPointsIndices;

  // Add to brushed if Shift key is pressed
  if (event.shiftKey) {
    hoveredPointsIndices.forEach((i) => {
      brushedPointsIndices.add(i);
    });
  }
  // Toggle brushed if Ctrl key is pressed
  else if (event.ctrlKey) {
    hoveredPointsIndices.forEach((i) => {
      if (brushedPointsIndices.has(i)) brushedPointsIndices.delete(i);
      else brushedPointsIndices.add(i);
    });
  }
  // Set brushed to hovered
  else {
    const newBrushedPointsIndices = new Set<number>();
    hoveredPointsIndices.forEach((i) => {
      if (!brushedPointsIndices.has(i) && pointShow[i]) newBrushedPointsIndices.add(i);
    });
    brushedPointsIndices = newBrushedPointsIndices;
  }

  removePreviouslyBrushedPoints();
  drawBrushedPoints();
  postMessage({
    function: 'setBrushed',
    brushedIndices: brushedPointsIndices,
    previouslyBrushedIndices: previouslyBrushedPointsIndices
  });
}

function drawHoveredPoints(hoveredIndices: Set<number> | null = null) {
  if (hoveredIndices) hoveredPointsIndices = hoveredIndices;
  hoveredPointsIndices.forEach((i) => {
    if (!pointShow[i]) return;
    drawPoint(points[i], POINT_MATERIAL_HOVERED, true, 2);
  });
}

function removePreviouslyHoveredPoints(hoveredIndices: Set<number> | null = null) {
  if (hoveredIndices) previouslyHoveredPointsIndices = hoveredIndices;
  previouslyHoveredPointsIndices.forEach((i) => {
    if (!pointShow[i] || hoveredPointsIndices.has(i)) return;
    if (brushedPointsIndices.has(i)) drawPoint(points[i], POINT_MATERIAL_BRUSHED, false, 1);
    else drawPoint(points[i], getPartitionMaterial(partitions.get(partitionsData[i])), false, 0);
  });
}

function drawBrushedPoints(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) brushedPointsIndices = brushedIndices;
  brushedPointsIndices.forEach((i) => {
    if (!pointShow[i]) return;
    drawPoint(points[i], POINT_MATERIAL_BRUSHED, true, 1);
  });
}

function removePreviouslyBrushedPoints(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) previouslyBrushedPointsIndices = brushedIndices;
  previouslyBrushedPointsIndices.forEach((i) => {
    if (!pointShow[i]) return;
    drawPoint(points[i], getPartitionMaterial(partitions.get(partitionsData[i])), false, 0);
  });
}

function updatePartitions(partitionsNew: Map<string, PartitionType>) {
  const partitionsOld = partitions;
  partitions = partitionsNew;
  if (partitionsOld.size === 0 || partitionsNew.size === 0) {
    return;
  }

  const partitionsOldArray = Array.from(partitionsOld.keys());
  const partitionsNewArray = Array.from(partitions.keys());
  const partitionsDiff = partitionsOldArray.filter((x) => !partitionsNewArray.includes(x));
  // Partition property was updated
  if (partitionsDiff.length === 0) {
    const { updatedPartition, updatedProperty } = getUpdatedPartition(partitionsOld, partitions);
    if (updatedPartition !== null && updatedProperty !== null) {
      if (updatedProperty === 'color') updatePartitionColor(updatedPartition);
      else updatePartitionShape(updatedPartition);
    }
  }
  // Partition was deleted
  else if (partitionsDiff.length === 1 && partitionsNewArray.length === partitionsOldArray.length - 1) {
    updatePartitionColor(DEFAULT_PARTITION);
    updatePartitionShape(DEFAULT_PARTITION);
  }
}

function updatePartitionColor(partitionName: string) {
  const partitionRecords = getPartitionRecordsByName(partitionsData, partitionName);
  const partition = partitions.get(partitionName);
  partitionRecords.forEach((i) => {
    if (!pointShow[i]) return;
    drawPoint(points[i], getPartitionMaterial(partition), true);
  });
}

function updatePartitionShape(partitionName: string) {
  const partitionRecords = getPartitionRecordsByName(partitionsData, partitionName);
  const partition = partitions.get(partitionName);
  partitionRecords.forEach((i) => {
    const geometry = getPartitionGeometry(pointSize, partition);
    const material = getPartitionMaterial(partition);
    const newPoint = new THREE.Mesh(geometry, material) as PointType;
    newPoint.position.set(points[i].position.x, points[i].position.y, points[i].position.z);
    newPoint.index = i;
    scene.remove(points[i]);
    scene.add(newPoint);
    points[i] = newPoint;

    scene.remove(strokes[i] as StrokeType);
    if (partition?.shape.includes('hollow')) {
      const materialStroke = getPartitionMaterialStroke(partition);
      const geometryStroke = getPartitionGeometryStroke(pointSize, partition);
      const newStroke = new THREE.LineLoop(geometryStroke, materialStroke) as StrokeType;
      newStroke.position.set(points[i].position.x, points[i].position.y, points[i].position.z);
      newStroke.index = i;
      scene.add(newStroke);
      strokes[i] = newStroke;
    } else if (strokes[i] !== null) {
      strokes[i] = null;
    }
  });
}

function render() {
  renderer?.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function resizeCanvas(canvas: OffscreenCanvas, width: number, height: number) {
  if (!canvas) return;
  canvas.width = width;
  canvas.height = height;

  postMessage({
    function: 'canvasResized',
    height,
    width
  });
}
