import * as THREE from 'three';
import {
  LINE_MATERIAL_ACTIVE,
  LINE_MATERIAL_BRUSHED,
  LINE_MATERIAL_FILTERED,
  LINE_MATERIAL_HOVERED,
  LINE_MATERIAL_MAP
} from '../../../util/materials';
import { COLOR_ACTIVE } from '../../../util/colors';
import { areSetsEqual } from '../../../util/util';
import type { AxesFilterType } from '../types';
import type { MarginType } from '../../../util/types';

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

self.onmessage = function (message) {
  const data = message.data;
  switch (data.function) {
    case 'init':
      ({ canvas, width, height } = data);
      init();
      break;
    case 'resetLines':
      resetLines(data.lineShow);
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
      init();
      resizeCanvas(canvas, width, height);
      break;
    case 'redrawLines':
      init();
      drawLines(data.lines);
      break;
    default:
      break;
  }
};

function init() {
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
  renderer.setClearColor(0xffffff);
  renderer.setSize(width, height, false);
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

function resetLines(show: boolean[]) {
  lineShow = show;
  lines = [];
}

function drawLines(inputLines: number[][][]) {
  scene.children = [];
  inputLines.forEach((currLine: number[][], i: number) => {
    const linePoints: THREE.Vector3[] = [];
    currLine.forEach((point: number[]) => {
      linePoints.push(new THREE.Vector3(...point));
    });
    const material = (
      lines[i] ? lines[i].material : LINE_MATERIAL_MAP.get(COLOR_ACTIVE)
    ) as THREE.LineBasicMaterial;
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
    brushedIndices: brushedLinesIndices
  });
}

function drawHoveredLines(hoveredIndices: Set<number> | null = null) {
  if (hoveredIndices) hoveredLinesIndices = hoveredIndices;
  hoveredLinesIndices.forEach((i) => {
    if (!lineShow[i]) return;
    const line = lines[i];
    line.material = LINE_MATERIAL_HOVERED;
    changeLinePosition(line, 2);
    line.material.needsUpdate = true;
  });
}

function removePreviouslyHoveredLines(hoveredIndices: Set<number> | null = null) {
  if (hoveredIndices) previouslyHoveredLinesIndices = hoveredIndices;
  previouslyHoveredLinesIndices.forEach((i) => {
    if (!lineShow[i] || (interactable && hoveredLinesIndices.has(i))) return;
    const line = lines[i];
    if (brushedLinesIndices.has(i)) {
      line.material = LINE_MATERIAL_BRUSHED;
      changeLinePosition(line, 1);
    } else {
      line.material = LINE_MATERIAL_ACTIVE;
      changeLinePosition(line, 0);
    }
    line.material.needsUpdate = false;
  });
}

function drawBrushedLines(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) brushedLinesIndices = brushedIndices;
  brushedLinesIndices.forEach((i) => {
    if (!lineShow[i]) return;
    const line = lines[i];
    line.material = LINE_MATERIAL_BRUSHED;
    changeLinePosition(line, 1);
    line.material.needsUpdate = true;
  });
}

function removePreviouslyBrushedLines(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) previouslyBrushedLinesIndices = brushedIndices;
  previouslyBrushedLinesIndices.forEach((i) => {
    if (!lineShow[i]) return;
    const line = lines[i];
    line.material = LINE_MATERIAL_ACTIVE;
    changeLinePosition(line, 0);
    line.material.needsUpdate = false;
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
        line.material = LINE_MATERIAL_ACTIVE;
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

function changeLinePosition(line: THREE.Line, newZPosition: number) {
  const positions = line.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 2] = newZPosition;
  }
  line.geometry.attributes.position.needsUpdate = true;
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
