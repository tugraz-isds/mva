import * as THREE from 'three';
import {
	LINE_MATERIAL_ACTIVE,
	LINE_MATERIAL_FILTERED,
	LINE_MATERIAL_HOVERED,
	LINE_MATERIAL_MAP
} from '../../../util/materials';
import { COLOR_ACTIVE } from '../../../util/colors';
import { areSetsEqual } from '../../../util/util';
import type { AxesFilterType } from '../types';

let width: number, height: number;

let canvas: OffscreenCanvas;
let camera: THREE.OrthographicCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let raycaster: THREE.Raycaster;
let mouse: THREE.Vector2;
let lines: THREE.Line[] = [];

let hoveredLinesIndices = new Set<number>(),
	previouslyHoveredLinesIndices = new Set<number>();
let lineShow: boolean[] = [];

self.onmessage = function (message) {
	const data = message.data;
	switch (data.function) {
		case 'init':
			({ canvas, width, height } = data);
			init();
			break;
		case 'drawLines':
			drawLines(data.lines);
			break;
		case 'mouseMove':
			mouse = data.mouse;
			handleMouseMove();
			break;
		case 'applyFilters':
			applyFilters(data.axesFilters);
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

function drawLines(inputLines: number[][][]) {
	console.log('Redrawing all lines');
	lines = [];
	scene.children = [];
	inputLines.forEach((currLine: number[][], i: number) => {
		const linePoints: THREE.Vector3[] = [];
		currLine.forEach((point: number[]) => {
			linePoints.push(new THREE.Vector3(...point));
		});
		// const material = LINE_MATERIAL_MAP.get(lineData[idx].color) ?? new THREE.LineBasicMaterial();
		const material = LINE_MATERIAL_MAP.get(COLOR_ACTIVE) as THREE.LineBasicMaterial;
		material.needsUpdate = false;
		const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
		const line: THREE.Line & { index?: number } = new THREE.Line(geometry, material);
		line.index = i;
		lines.push(line);
		scene.add(line);
	});
	console.log(scene.children.length);
	lineShow = Array(scene.children.length).fill(true);
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
	removeHoveredLines();
	drawHoveredLines();
	postMessage({
		function: 'setHovered',
		hoveredIndices: hoveredLinesSet
	});
}

function drawHoveredLines() {
	hoveredLinesIndices.forEach((i) => {
		const line = lines[i];
		line.material = LINE_MATERIAL_HOVERED;
		changeLinePosition(line, 2);
		line.material.needsUpdate = true;
	});
}

function removeHoveredLines() {
	previouslyHoveredLinesIndices.forEach((i) => {
		const line = lines[i];
		line.material = LINE_MATERIAL_ACTIVE;
		changeLinePosition(line, 0);
		line.material.needsUpdate = false;
	});
}

function applyFilters(axesFilters: AxesFilterType[]) {
	lineShow = [];
	lines.forEach((line, i) => {
		const positions = line.geometry.attributes.position.array;
		lineShow[i] = true;
		for (let j = 0; j < positions.length / 3; j++) {
			if (!axesFilters[j].pixels) return;

			const lineY = positions[j * 3 + 1];
			// if (!(lineY > axesFilters[j].pixels.start + 40 && lineY < axesFilters[j].pixels.end + 40))
			if (lineY < axesFilters[j].pixels.start + 40 || lineY > axesFilters[j].pixels.end + 40)
				lineShow[i] = false;
		}
		if (lineShow[i]) {
			line.material = LINE_MATERIAL_ACTIVE;
			changeLinePosition(line, 0);
		} else {
			line.material = LINE_MATERIAL_FILTERED;
			changeLinePosition(line, -1);
		}
		// const positions = line.geometry.attributes.position.array;
		// const lineY = positions[axisIndex * 3 + 1];
		// if (!(lineY > filter.start && lineY < filter.end)) {
		// 	console.log(lineY, filter);
		// 	line.material = LINE_MATERIAL_FILTERED;
		// 	changeLinePosition(line, -1);
		// }
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
