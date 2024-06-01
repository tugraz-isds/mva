import { POINT_MATERIAL_BRUSHED, POINT_MATERIAL_FILTERED } from '../../../util/materials';
import * as THREE from 'three';
import {
  drawPoint,
  getHoveredPoint,
  getPartitionGeometry,
  getPartitionGeometryStroke,
  getPartitionMaterial,
  getPartitionMaterialStroke,
  getPartitionRecordsByName,
  getPoint,
  getStroke,
  initScene,
  isPointInPolygon,
  resetPoints,
  type PointType,
  type StrokeType
} from './drawingUtil';
import { DEFAULT_PARTITION, areSetsEqual, getSetDifference } from '../../../util/util';
import type { PartitionType } from '../../partitions/types';
import type { CoordinateType } from '../../../util/types';
import { getUpdatedPartition } from '../../partitions/util';

let width: number, height: number;

let canvas: OffscreenCanvas;
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let points: PointType[] = [];
let hoveredPoints: PointType[] = [];
let strokes: (StrokeType | null)[] = [];
let pointSize: number;

let selectionShapeLinePositions: CoordinateType[] = [];
let isDragging = false;

let hoveredPointsIndices = new Set<number>(),
  brushedPointsIndices = new Set<number>();
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
    case 'mouseUp':
      mouse = data.mouse;
      handleMouseUp(data.event);
      break;
    case 'setSelectionShapeLine':
      selectionShapeLinePositions = data.points;
      break;
    case 'updateHovered':
      removeHoveredPoints(getSetDifference(data.previouslyHoveredIndices, data.hoveredIndices));
      hoveredPointsIndices = data.hoveredIndices;
      drawHoveredPoints(hoveredPointsIndices);
      break;
    case 'updateBrushed':
      removeBrushedPoints(getSetDifference(data.previouslyBrushedIndices, data.brushedIndices));
      brushedPointsIndices = data.brushedIndices;
      drawBrushedPoints(brushedPointsIndices);
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
    const partition = partitions.get(partitionsData[i]);
    const hasStroke = partition?.shape.includes('hollow');
    if (show[i]) {
      if (brushedPointsIndices.has(i)) drawPoint(points[i], POINT_MATERIAL_BRUSHED, false, 1);
      else {
        if (hasStroke && strokes[i] !== null)
          (strokes[i] as StrokeType).material = getPartitionMaterialStroke(partition);
        drawPoint(points[i], getPartitionMaterial(partition), false, 0);
      }
    } else {
      if (hasStroke && strokes[i] !== null) (strokes[i] as StrokeType).material = POINT_MATERIAL_FILTERED;
      else drawPoint(points[i], POINT_MATERIAL_FILTERED, false, -1);
    }
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
      strokes[i] = stroke;
      scene.add(stroke);
    }
  });

  animate();
}

function handleMouseMove() {
  if (isDragging) return;

  raycaster.setFromCamera(mouse, camera); // Check for intersections
  const hoveredPointsSet: Set<number> = new Set();
  const intersectingPoints = raycaster.intersectObjects(points);
  intersectingPoints.forEach((intersection) => {
    const point = intersection.object as any;
    if (pointShow[point.index]) hoveredPointsSet.add(point.index);
  });

  if (areSetsEqual(hoveredPointsIndices, hoveredPointsSet)) return;

  removeHoveredPoints(getSetDifference(hoveredPointsIndices, hoveredPointsSet));
  hoveredPointsIndices = hoveredPointsSet;
  drawHoveredPoints(hoveredPointsIndices);

  postMessage({
    function: 'setHovered',
    hoveredIndices: hoveredPointsIndices
  });
}

function handleMouseDown(event: { ctrlKey: boolean; shiftKey: boolean }) {
  isDragging = true;
  selectionShapeLinePositions = [];

  let brushedPointsSet: Set<number> = new Set([...brushedPointsIndices]);
  // Add to brushed if Shift key is pressed
  if (event.shiftKey) {
    hoveredPointsIndices.forEach((i) => {
      brushedPointsSet.add(i);
    });
  }
  // Toggle brushed if Ctrl key is pressed
  else if (event.ctrlKey) {
    hoveredPointsIndices.forEach((i) => {
      if (brushedPointsSet.has(i)) brushedPointsSet.delete(i);
      else brushedPointsSet.add(i);
    });
  }
  // Set brushed to hovered
  else {
    brushedPointsSet = new Set<number>();
    hoveredPointsIndices.forEach((i) => {
      if (!brushedPointsSet.has(i) && pointShow[i]) brushedPointsSet.add(i);
    });
  }

  if (areSetsEqual(brushedPointsIndices, brushedPointsSet)) return;

  removeBrushedPoints(getSetDifference(brushedPointsIndices, brushedPointsSet));
  brushedPointsIndices = brushedPointsSet;
  drawBrushedPoints(brushedPointsIndices);
  postMessage({
    function: 'setBrushed',
    brushedIndices: brushedPointsIndices
  });
}

function handleMouseUp(event: { ctrlKey: boolean; shiftKey: boolean }) {
  if (selectionShapeLinePositions.length > 1) {
    let brushedPointsSet: Set<number> = new Set();
    if (event.ctrlKey || event.shiftKey) brushedPointsSet = new Set([...brushedPointsIndices]);
    points.forEach((point) => {
      const i = point.index as number;
      if (isPointInPolygon({ x: point.position.x, y: point.position.y }, selectionShapeLinePositions)) {
        if (event.ctrlKey) {
          if (brushedPointsSet.has(i)) brushedPointsSet.delete(i);
          else brushedPointsSet.add(i);
        } else brushedPointsSet.add(i);
      }
    });

    removeBrushedPoints(getSetDifference(brushedPointsIndices, brushedPointsSet));
    brushedPointsIndices = brushedPointsSet;
    drawBrushedPoints(brushedPointsIndices);
    postMessage({
      function: 'setBrushed',
      brushedIndices: brushedPointsIndices
    });
  }

  isDragging = false;
  selectionShapeLinePositions = [];
}

function drawHoveredPoints(indices: Set<number>) {
  indices.forEach((i) => {
    const partition = partitions.get(partitionsData[i]);
    const hoveredPoint = getHoveredPoint([points[i].position.x, points[i].position.y], i, 4, partition);
    hoveredPoints.push(hoveredPoint);
    scene.add(hoveredPoint);
  });
}

function removeHoveredPoints(indices: Set<number>) {
  hoveredPoints.forEach((point) => {
    if (indices.has(point.index as number)) scene.remove(point);
  });
}

function drawBrushedPoints(indices: Set<number>) {
  indices.forEach((i) => {
    if (!pointShow[i]) return;
    drawPoint(points[i], POINT_MATERIAL_BRUSHED, true, 1);
  });
}

function removeBrushedPoints(indices: Set<number>) {
  indices.forEach((i) => {
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
      else if (updatedProperty === 'shape') updatePartitionShape(updatedPartition);
      else if (updatedProperty === 'visible') updatePartitionVisible(updatedPartition);
      else if (updatedProperty === 'size') updatePartitionShape(updatedPartition, true);
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
  const hasStroke = partition?.shape.includes('hollow');
  partitionRecords.forEach((i) => {
    if (!pointShow[i]) return;
    drawPoint(points[i], getPartitionMaterial(partition), true);
    if (hasStroke && strokes[i] !== null) {
      (strokes[i] as StrokeType).material = getPartitionMaterialStroke(partition);
    }
  });
}

function updatePartitionShape(partitionName: string, brushed: boolean = false) {
  let partitionRecords: number[];
  if (brushed) {
    partitionRecords = Array.from(new Set([...brushedPointsIndices, ...hoveredPointsIndices]));
  } else {
    partitionRecords = getPartitionRecordsByName(partitionsData, partitionName);
  }
  const partition = partitions.get(partitionName);
  partitionRecords.forEach((i) => {
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

    const geometry = getPartitionGeometry(pointSize, partition);
    const material = !pointShow[i]
      ? POINT_MATERIAL_FILTERED
      : brushed && brushedPointsIndices.has(i)
      ? POINT_MATERIAL_BRUSHED
      : getPartitionMaterial(partition);
    const newPoint = new THREE.Mesh(geometry, material) as PointType;
    newPoint.position.set(points[i].position.x, points[i].position.y, brushed ? 1 : points[i].position.z);
    newPoint.index = i;
    scene.remove(points[i]);
    scene.add(newPoint);
    points[i] = newPoint;
  });
}

function updatePartitionVisible(partitionName: string) {
  const partitionRecords = getPartitionRecordsByName(partitionsData, partitionName);
  const partition = partitions.get(partitionName);
  partitionRecords.forEach((i) => {
    if (partition?.visible) {
      scene.add(points[i]);
      if (strokes[i] !== null) scene.add(strokes[i] as StrokeType);
    } else {
      scene.remove(points[i]);
      if (strokes[i] !== null) scene.remove(strokes[i] as StrokeType);
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
