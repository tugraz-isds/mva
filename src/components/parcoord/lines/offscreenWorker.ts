import { LINE_MATERIAL_BRUSHED, LINE_MATERIAL_FILTERED } from '../../../util/materials';
import {
  changeLinePosition,
  drawLine,
  getHoveredLine,
  getLine,
  getPartitionMaterial,
  getPartitionRecordsByName,
  getPointsFromLine,
  initScene,
  isLineIntersecting,
  resetLines,
  type LineType
} from './drawingUtil';
import { DEFAULT_PARTITION, areSetsEqual, getSetDifference } from '../../../util/util';
import type * as THREE from 'three';
import type { AxesFilterType } from '../types';
import type { CoordinateType, MarginType } from '../../../util/types';
import type { PartitionType } from '../../partitions/types';
import { getUpdatedPartition } from '../../partitions/util';

let width: number, height: number;

let canvas: OffscreenCanvas;
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let lines: LineType[] = [];
let hoveredLines: LineType[] = [];

let selectionShapeLinePositions: CoordinateType[] = [];
let isDragging = false;

let interactable = true;
let hoveredLinesIndices = new Set<number>(),
  brushedLinesIndices = new Set<number>();
let lineShow: boolean[] = [];
let partitionsData: string[] = [];
let partitions: Map<string, PartitionType> = new Map();

self.onmessage = function (message) {
  const data = message.data;
  switch (data.function) {
    case 'init':
      ({ canvas, width, height } = data);
      ({ scene, camera, renderer, raycaster, mouse } = initScene(canvas, width, height));
      break;
    case 'resetLines':
      ({ lineShow, lines } = resetLines(data.lineShow));
      break;
    case 'drawLines':
      drawLines(data.lines);
      break;
    case 'mouseMove':
      ({ mouse, interactable } = data);
      if (interactable) handleMouseMove();
      else if (!interactable && hoveredLinesIndices.size > 0) {
        removeHoveredLines(hoveredLinesIndices);
        drawHoveredLines(new Set());
      }
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
    case 'applyFilters':
      applyFilters(data.axesFilters, data.margin);
      break;
    case 'updateHovered':
      removeHoveredLines(getSetDifference(data.previouslyHoveredIndices, data.hoveredIndices));
      hoveredLinesIndices = data.hoveredIndices;
      drawHoveredLines(hoveredLinesIndices);
      break;
    case 'updateBrushed':
      removeBrushedLines(getSetDifference(data.previouslyBrushedIndices, data.brushedIndices));
      brushedLinesIndices = data.brushedIndices;
      drawBrushedLines(brushedLinesIndices);
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

function drawLines(inputLines: number[][][]) {
  scene.children = [];
  inputLines.forEach((currLine: number[][], i: number) => {
    const partition = partitions.get(partitionsData[i]);
    const line = getLine(currLine, i, lineShow[i], partition);
    lines[i] = line;
    scene.add(line);
  });

  animate();
}

function handleMouseMove() {
  if (isDragging) return;

  raycaster.setFromCamera(mouse, camera); // Check for intersections
  const hoveredLinesSet: Set<number> = new Set();
  const intersectingLines = raycaster.intersectObjects(lines);
  intersectingLines.forEach((intersection) => {
    const line = intersection.object as any;
    if (lineShow[line.index]) hoveredLinesSet.add(line.index);
  });

  if (areSetsEqual(hoveredLinesIndices, hoveredLinesSet)) return;

  removeHoveredLines(getSetDifference(hoveredLinesIndices, hoveredLinesSet));
  hoveredLinesIndices = hoveredLinesSet;
  drawHoveredLines(hoveredLinesIndices);

  postMessage({
    function: 'setHovered',
    hoveredIndices: hoveredLinesIndices
  });
}

function handleMouseDown(event: { offsetX: number; offsetY: number; ctrlKey: boolean; shiftKey: boolean }) {
  isDragging = true;
  selectionShapeLinePositions = [];

  let brushedLinesSet: Set<number> = new Set([...brushedLinesIndices]);
  // Add to brushed if Shift key is pressed
  if (event.shiftKey) {
    hoveredLinesIndices.forEach((i) => {
      brushedLinesSet.add(i);
    });
  }
  // Toggle brushed if Ctrl key is pressed
  else if (event.ctrlKey) {
    hoveredLinesIndices.forEach((i) => {
      if (brushedLinesSet.has(i)) brushedLinesSet.delete(i);
      else brushedLinesSet.add(i);
    });
  }
  // Set brushed to hovered
  else {
    brushedLinesSet = new Set<number>();
    hoveredLinesIndices.forEach((i) => {
      if (!brushedLinesSet.has(i) && lineShow[i]) brushedLinesSet.add(i);
    });
  }

  if (areSetsEqual(brushedLinesIndices, brushedLinesSet)) return;

  removeBrushedLines(getSetDifference(brushedLinesIndices, brushedLinesSet));
  brushedLinesIndices = brushedLinesSet;
  drawBrushedLines(brushedLinesIndices);
  postMessage({
    function: 'setBrushed',
    brushedIndices: brushedLinesIndices
  });
}

function handleMouseUp(event: { ctrlKey: boolean; shiftKey: boolean }) {
  if (selectionShapeLinePositions.length > 1) {
    let brushedLinesSet: Set<number> = new Set();
    if (event.ctrlKey || event.shiftKey) brushedLinesSet = new Set([...brushedLinesIndices]);
    lines.forEach((line) => {
      const i = line.index as number;
      if (isLineIntersecting(line, selectionShapeLinePositions)) {
        if (event.ctrlKey) {
          if (brushedLinesSet.has(i)) brushedLinesSet.delete(i);
          else brushedLinesSet.add(i);
        } else brushedLinesSet.add(i);
      }
    });

    removeBrushedLines(getSetDifference(brushedLinesIndices, brushedLinesSet));
    brushedLinesIndices = brushedLinesSet;
    drawBrushedLines(brushedLinesIndices);
    postMessage({
      function: 'setBrushed',
      brushedIndices: brushedLinesIndices
    });
  }

  isDragging = false;
  selectionShapeLinePositions = [];
}

function drawHoveredLines(indices: Set<number>) {
  indices.forEach((i) => {
    [-1, 0, 1].forEach((offset) => {
      const linePoints = getPointsFromLine(lines[i]).map((point) => [point.x, point.y + offset, 2]);
      const hoveredLine = getHoveredLine(linePoints, i);
      hoveredLines.push(hoveredLine);
      scene.add(hoveredLine);
    });
  });
}

function removeHoveredLines(indices: Set<number>) {
  hoveredLines.forEach((line) => {
    if (indices.has(line.index as number)) scene.remove(line);
  });
}

function drawBrushedLines(indices: Set<number>) {
  indices.forEach((i) => {
    if (!lineShow[i]) return;
    drawLine(lines[i], LINE_MATERIAL_BRUSHED, true, 1);
  });
}

function removeBrushedLines(indices: Set<number>) {
  indices.forEach((i) => {
    if (!lineShow[i]) return;
    drawLine(lines[i], getPartitionMaterial(partitions.get(partitionsData[i])), false, 0);
  });
}

function updatePartitions(partitionsNew: Map<string, PartitionType>) {
  const partitionsOld = partitions;
  partitions = partitionsNew;
  if (partitionsOld.size === 0 || partitionsNew.size === 0) return;

  const partitionsOldArray = Array.from(partitionsOld.keys());
  const partitionsNewArray = Array.from(partitions.keys());
  const partitionsDiff = partitionsOldArray.filter((x) => !partitionsNewArray.includes(x));
  // Partition property was updated
  if (partitionsDiff.length === 0) {
    const { updatedPartition, updatedProperty } = getUpdatedPartition(partitionsOld, partitions);
    if (updatedPartition !== null && updatedProperty !== null) {
      if (updatedProperty === 'color' || updatedProperty === 'size') updatePartitionColor(updatedPartition);
      else if (updatedProperty === 'visible') updatePartitionVisible(updatedPartition);
    }
  }
  // Partition was deleted
  else if (partitionsDiff.length === 1 && partitionsNewArray.length === partitionsOldArray.length - 1) {
    updatePartitionColor(DEFAULT_PARTITION);
  }
}

function updatePartitionColor(partitionName: string) {
  const partitionRecords = getPartitionRecordsByName(partitionsData, partitionName);
  const partition = partitions.get(partitionName);
  partitionRecords.forEach((i) => {
    if (!lineShow[i]) return;
    drawLine(lines[i], getPartitionMaterial(partition), true);
  });
}

function updatePartitionVisible(partitionName: string) {
  const partitionRecords = getPartitionRecordsByName(partitionsData, partitionName);
  const partition = partitions.get(partitionName);
  partitionRecords.forEach((i) => {
    if (partition?.visible) {
      scene.add(lines[i]);
    } else {
      scene.remove(lines[i]);
    }
  });
}

function applyFilters(axesFilters: AxesFilterType[], margin: MarginType) {
  if (!lines || lines.length === 0) return;
  lineShow = [];
  lines.forEach((line, i) => {
    const positions = line.geometry.attributes.position.array;
    lineShow[i] = true;
    for (let j = 0; j < positions.length / 3; j++) {
      if (!axesFilters[j] || !axesFilters[j].pixels) return;

      const lineY = positions[j * 3 + 1];
      if (
        axesFilters[j].pixels.end === 0 ||
        axesFilters[j].pixels.start === height - margin.top - margin.bottom ||
        lineY < axesFilters[j].pixels.start + margin.top ||
        lineY > axesFilters[j].pixels.end + margin.top
      )
        lineShow[i] = false;
    }
    if (lineShow[i]) {
      if (brushedLinesIndices.has(i)) {
        line.material = LINE_MATERIAL_BRUSHED;
        changeLinePosition(line, 1);
      } else {
        line.material = getPartitionMaterial(partitions.get(partitionsData[i]));
        changeLinePosition(line, 0);
      }
    } else {
      line.material = LINE_MATERIAL_FILTERED;
      changeLinePosition(line, -1);
    }
  });

  postMessage({
    function: 'setLineShow',
    lineShow
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
