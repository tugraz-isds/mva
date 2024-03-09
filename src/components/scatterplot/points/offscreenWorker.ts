import * as THREE from 'three';
import {
  POINT_MATERIAL_ACTIVE,
  POINT_MATERIAL_BRUSHED,
  POINT_MATERIAL_FILTERED,
  POINT_MATERIAL_HOVERED
} from '../../../util/materials';
import { areSetsEqual } from '../../../util/util';

let width: number, height: number;

let canvas: OffscreenCanvas;
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let points: (THREE.Mesh & { index?: number })[] = [];

let hoveredPointsIndices = new Set<number>(),
  previouslyHoveredPointsIndices = new Set<number>(),
  brushedPointsIndices = new Set<number>(),
  previouslyBrushedPointsIndices = new Set<number>();
let pointShow: boolean[] = [];

self.onmessage = function (message) {
  const data = message.data;
  switch (data.function) {
    case 'init':
      ({ canvas, width, height } = data);
      init();
      break;
    case 'resetPoints':
      resetPoints(data.pointShow);
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
      init();
      resizeCanvas(canvas, width, height);
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

function resetPoints(show: boolean[]) {
  pointShow = show;
  points = [];
}

function setLinking(show: boolean[]) {
  pointShow.forEach((isPointShow: boolean, i: number) => {
    if (isPointShow === show[i]) return;
    const point = points[i];
    if (show[i]) {
      if (brushedPointsIndices.has(i)) {
        point.material = POINT_MATERIAL_BRUSHED;
        changePointPosition(point, 1);
      } else {
        point.material = POINT_MATERIAL_ACTIVE;
        changePointPosition(point, 0);
      }
    } else {
      point.material = POINT_MATERIAL_FILTERED;
      changePointPosition(point, -1);
    }
    point.material.needsUpdate = false;
  });
  pointShow = show;
}

function drawPoints(inputPoints: number[][]) {
  scene.children = [];
  const pointGeometry = new THREE.CircleGeometry(3, 16);
  inputPoints.forEach((currPoint: number[], i: number) => {
    const material = POINT_MATERIAL_ACTIVE;
    material.needsUpdate = false;
    const point: THREE.Mesh & { index?: number } = new THREE.Mesh(pointGeometry, material);
    point.position.set(currPoint[0], currPoint[1], currPoint[2]);
    point.index = i;
    points[i] = point;
    scene.add(point);
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
    const point = points[i];
    point.material = POINT_MATERIAL_HOVERED;
    changePointPosition(point, 2);
    point.material.needsUpdate = true;
  });
}

function removePreviouslyHoveredPoints(hoveredIndices: Set<number> | null = null) {
  if (hoveredIndices) previouslyHoveredPointsIndices = hoveredIndices;
  previouslyHoveredPointsIndices.forEach((i) => {
    if (!pointShow[i] || hoveredPointsIndices.has(i)) return;
    const point = points[i];
    if (brushedPointsIndices.has(i)) {
      point.material = POINT_MATERIAL_BRUSHED;
      changePointPosition(point, 1);
    } else {
      point.material = POINT_MATERIAL_ACTIVE;
      changePointPosition(point, 0);
    }
    point.material.needsUpdate = false;
  });
}

function drawBrushedPoints(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) brushedPointsIndices = brushedIndices;
  brushedPointsIndices.forEach((i) => {
    if (!pointShow[i]) return;
    const point = points[i];
    point.material = POINT_MATERIAL_BRUSHED;
    changePointPosition(point, 1);
    point.material.needsUpdate = true;
  });
}

function removePreviouslyBrushedPoints(brushedIndices: Set<number> | null = null) {
  if (brushedIndices) previouslyBrushedPointsIndices = brushedIndices;
  previouslyBrushedPointsIndices.forEach((i) => {
    if (!pointShow[i]) return;
    const point = points[i];
    point.material = POINT_MATERIAL_ACTIVE;
    changePointPosition(point, 0);
    point.material.needsUpdate = false;
  });
}

function changePointPosition(point: THREE.Mesh & { index?: number }, newZPosition: number) {
  point.position.z = newZPosition;
  point.geometry.attributes.position.needsUpdate = true;
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
