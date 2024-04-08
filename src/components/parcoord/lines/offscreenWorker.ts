import * as THREE from 'three';
import { LINE_MATERIAL_BRUSHED, LINE_MATERIAL_FILTERED, LINE_MATERIAL_HOVERED } from '../../../util/materials';
import {
  changeLinePosition,
  drawLine,
  getPartitionMaterial,
  getPartitionRecordsByName,
  getUpdatedPartition,
  initScene,
  resetLines
} from './drawingUtil';
import { DEFAULT_PARTITION, areSetsEqual } from '../../../util/util';
import type { AxesFilterType } from '../types';
import type { MarginType } from '../../../util/types';
import type { PartitionType } from '../../partitions/types';

let width: number, height: number;

let canvas: OffscreenCanvas;
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let lines: THREE.Line[] = [];

let interactable = true;
let hoveredLinesIndices = new Set<number>(),
  previouslyHoveredLinesIndices = new Set<number>(),
  brushedLinesIndices = new Set<number>(),
  previouslyBrushedLinesIndices = new Set<number>();
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
        removePreviouslyHoveredLines(hoveredLinesIndices);
        drawHoveredLines(new Set());
      }
      break;
    case 'mouseDown':
      mouse = data.mouse;
      handleMouseDown(data.event);
      break;
    case 'applyFilters':
      applyFilters(data.axesFilters, data.margin);
      break;
    case 'updateHovered':
      drawHoveredLines(data.indices);
      break;
    case 'updatePreviouslyHovered':
      removePreviouslyHoveredLines(data.indices);
      break;
    case 'updateBrushed':
      drawBrushedLines(data.indices);
      break;
    case 'updatePreviouslyBrushed':
      removePreviouslyBrushedLines(data.indices);
      break;
    case 'resizeCanvas':
      ({ width, height } = data);
      ({ scene, camera, renderer, raycaster, mouse } = initScene(canvas, width, height));
      resizeCanvas(canvas, width, height);
      break;
    case 'redrawLines':
      ({ scene, camera, renderer, raycaster, mouse } = initScene(canvas, width, height));
      drawLines(data.lines);
      break;
    case 'setPartitionsData':
      partitionsData = data.partitionsData;
      break;
    case 'setPartitions':
      updatePartitions(data.partitions);
      break;
    default:
      break;
  }
};

function drawLines(inputLines: number[][][]) {
  scene.children = [];
  inputLines.forEach((currLine: number[][], i: number) => {
    const linePoints: THREE.Vector3[] = [];
    currLine.forEach((point: number[]) => {
      linePoints.push(new THREE.Vector3(...point));
    });
    const partition = partitions.get(partitionsData[i]);
    const material = getPartitionMaterial(partition);
    material.needsUpdate = false;
    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const line: THREE.Line & { index?: number } = new THREE.Line(geometry, material);
    line.index = i;
    lines[i] = line;
    scene.add(line);
  });

  animate();
}

function handleMouseMove() {
  raycaster.setFromCamera(mouse, camera); // Check for intersections
  const hoveredLinesSet: Set<number> = new Set();
  const intersectingLines = raycaster.intersectObjects(lines);
  intersectingLines.forEach((intersection) => {
    const line = intersection.object as any;
    if (lineShow[line.index]) hoveredLinesSet.add(line.index);
  });
  previouslyHoveredLinesIndices = hoveredLinesIndices;
  if (areSetsEqual(previouslyHoveredLinesIndices, hoveredLinesSet)) return;

  hoveredLinesIndices = hoveredLinesSet;
  removePreviouslyHoveredLines();
  drawHoveredLines();

  postMessage({
    function: 'setHovered',
    hoveredIndices: hoveredLinesIndices
  });
}

function handleMouseDown(event: { ctrlKey: boolean; shiftKey: boolean }) {
  previouslyBrushedLinesIndices = brushedLinesIndices;

  // Add to brushed if Shift key is pressed
  if (event.shiftKey) {
    hoveredLinesIndices.forEach((i) => {
      brushedLinesIndices.add(i);
    });
  }
  // Toggle brushed if Ctrl key is pressed
  else if (event.ctrlKey) {
    hoveredLinesIndices.forEach((i) => {
      if (brushedLinesIndices.has(i)) brushedLinesIndices.delete(i);
      else brushedLinesIndices.add(i);
    });
  }
  // Set brushed to hovered
  else {
    const newBrushedLinesIndices = new Set<number>();
    hoveredLinesIndices.forEach((i) => {
      if (!brushedLinesIndices.has(i) && lineShow[i]) newBrushedLinesIndices.add(i);
    });
    brushedLinesIndices = newBrushedLinesIndices;
  }

  removePreviouslyBrushedLines();
  drawBrushedLines();
  postMessage({
    function: 'setBrushed',
    brushedIndices: brushedLinesIndices,
    previouslyBrushedIndices: previouslyBrushedLinesIndices
  });
}

function drawHoveredLines(hoveredIndices: Set<number> | null = null) {
  if (hoveredIndices) hoveredLinesIndices = hoveredIndices;
  hoveredLinesIndices.forEach((i) => {
    if (!lineShow[i]) return;
    drawLine(lines[i], LINE_MATERIAL_HOVERED, true, 2);
  });
}

function removePreviouslyHoveredLines(hoveredIndices: Set<number> | null = null) {
  if (hoveredIndices) previouslyHoveredLinesIndices = hoveredIndices;
  previouslyHoveredLinesIndices.forEach((i) => {
    if (!lineShow[i] || (interactable && hoveredLinesIndices.has(i))) return;
    if (brushedLinesIndices.has(i)) drawLine(lines[i], LINE_MATERIAL_BRUSHED, false, 1);
    else drawLine(lines[i], getPartitionMaterial(partitions.get(partitionsData[i])), false, 0);
  });
}

function drawBrushedLines(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) brushedLinesIndices = brushedIndices;
  brushedLinesIndices.forEach((i) => {
    if (!lineShow[i]) return;
    drawLine(lines[i], LINE_MATERIAL_BRUSHED, true, 1);
  });
}

function removePreviouslyBrushedLines(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) previouslyBrushedLinesIndices = brushedIndices;
  previouslyBrushedLinesIndices.forEach((i) => {
    if (!lineShow[i]) return;
    drawLine(lines[i], getPartitionMaterial(partitions.get(partitionsData[i])), false, 0);
  });
}

function updatePartitions(partitionsNew: Map<string, PartitionType>) {
  if (partitions.size === 0 || partitionsNew.size === 0) {
    partitions = partitionsNew;
    return;
  }

  const partitionsOldArray = Array.from(partitions.keys());
  const partitionsNewArray = Array.from(partitionsNew.keys());
  const partitionsDiff = partitionsOldArray.filter((x) => !partitionsNewArray.includes(x));
  // Partition property was updated
  if (partitionsDiff.length === 0) {
    const { updatedPartition, updatedProperty } = getUpdatedPartition(partitions, partitionsNew);
    partitions = partitionsNew;
    if (updatedPartition !== null && updatedProperty !== null) {
      updatePartitionColor(updatedPartition);
    }
  }
  // Partition was deleted
  else if (partitionsDiff.length === 1) {
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
