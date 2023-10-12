<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import * as THREE from 'three';
	import { brushingArray, hoveredArray, previouslyHoveredArray } from '../../stores/brushing';
	import { filtersArray } from '../../stores/parcoord';
	import { linkingArray } from '../../stores/linking';
	import type { DSVParsedArray } from 'd3';
	import type { AxesFilter } from './AxesFilterType';

	export let width: number;
	export let height: number;
	export let dataset: DSVParsedArray<any>;
	export let initialDimensions: string[] = []; // Initial order of dimensions
	export let margin: any;
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	let newWidth = width < 100 * initialDimensions.length ? initialDimensions.length * 100 : width;

	// ThreeJS elements
	let canvasEl: HTMLCanvasElement;
	let camera: THREE.OrthographicCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let line: any;
	let raycaster: THREE.Raycaster;
	let mouse: THREE.Vector2;

	let hoveredLine: any; // Currently hovered line object
	let hoveredLines: any[] = []; // Currently hovered line objects
	let lines: THREE.Line[] = []; // Array to store all line objects
	let lineShow: boolean[] = []; // Array of booleans that store info if each line should be drawn
	let lineColors: number[] = []; // Array of number colors for all lines
	let linePositions: number[] = []; // Array of number positions for all lines

	let dimensions: string[]; // Dimensions used for swapping
	let axesFilters: AxesFilter[] = []; // Filter values array for linking
	let hoveredLinesIndices = new Set<number>(); // Currently hovered lines
	let previouslyHoveredLinesIndices = new Set<number>(); // Previously hovered lines
	let brushedLinesIndices = new Set<number>(); // Currently brushed lines

	// Apply filters
	const unsubscribeFilters = filtersArray.subscribe((value: any) => {
		axesFilters = value;
		if (dataset?.length > 0 && dimensions?.length > 0) {
			if (axesFilters.length === dimensions.length) applyFilters();
		}
	});

	const unsubscribeBrushing = brushingArray.subscribe((value: any) => {
		brushedLinesIndices = value;
		if (dataset?.length > 0 && dimensions?.length > 0) {
			//drawLines();
		}
	});

	const unsubscribeHovered = hoveredArray.subscribe((value: Set<number>) => {
		removeHoveredLines(previouslyHoveredLinesIndices);
		hoveredLinesIndices = value;
		drawHoveredLines(hoveredLinesIndices);
		previouslyHoveredArray.set(hoveredLinesIndices);
	});

	const unsubscribePrevHovered = previouslyHoveredArray.subscribe((value: Set<number>) => {
		previouslyHoveredLinesIndices = value;
	});

	// Function to initialize ThreeJS scene
	function initScene() {
		// Create a scene
		scene = new THREE.Scene();

		// Create a camera
		camera = new THREE.OrthographicCamera(0, newWidth, 0, height, 0.1, 1000);
		camera.position.set(0, 0, 5);

		// Create a renderer and append the canvas to the specified element
		renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasEl });
		renderer.setClearColor(0xffffff);
		renderer.setSize(newWidth, height);
		const parcoordDiv = document.getElementById('parcoord-canvas');
		if (parcoordDiv instanceof HTMLElement) parcoordDiv.appendChild(renderer.domElement);

		// Initialize raycaster and mouse
		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();
	}

	function drawLines() {
		lines = [];
		dataset.forEach((dataRow: any, idx: number) => {
			drawLine(dataRow, idx);
		});

		render();
	}

	// Function to draw a single line from array
	function drawLine(dataRow: any[], idx: number) {
		const linePoints = [];
		for (let i = 0; i < dimensions.length; i++) {
			const dim = dimensions[i];

			let yPos;
			if (yScales[dim].invert) yPos = yScales[dim](dataRow[dim as any]);
			else yPos = yScales[dim](dataRow[dim as any]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

			linePoints.push(
				new THREE.Vector3(
					xScales[i],
					isNaN(yScales[dim](dataRow[dim as any])) ? margin.top : yPos + margin.top,
					linePositions[idx]
				)
			);
		}

		const material = new THREE.LineBasicMaterial({
			color: lineColors[idx],
			linewidth: 1,
			transparent: true,
			opacity: 0.75
		});
		const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
		line = new THREE.Line(geometry, material);
		line.index = idx; // Add custom property index to hovered line
		lines.push(line);
		scene.add(line);
	}

	function drawHoveredLines(hoveredLines: Set<number>) {
		hoveredLines.forEach((i) => {
			const line = lines[i];
			line.material = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 1 });
			changeLinePosition(line, 2);
		});
		render();
	}

	function removeHoveredLines(hoveredLines: Set<number>) {
		hoveredLines.forEach((i) => {
			const line = lines[i];
			line.material = new THREE.LineBasicMaterial({ color: lineColors[i], linewidth: 1 });
			changeLinePosition(line, linePositions[i]);
		});
		render();
	}

	// Function to handle mousemove events
	function handleMouseMove(event: MouseEvent) {
		// Calculate normalized mouse coordinates relative to the canvas
		const canvasRect = canvasEl.getBoundingClientRect();
		mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
		mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;

		// If mouse is not in parcoord, return
		if (
			!(
				event.clientY >= canvasRect.top &&
				event.clientY <= canvasRect.bottom &&
				event.clientX >= canvasRect.left &&
				event.clientX <= canvasRect.right
			)
		)
			return;

		hoveredLines = [];

		raycaster.setFromCamera(mouse, camera); // Update the raycaster
		const intersects = raycaster.intersectObjects(lines); // Check for intersections

		// Add hovered lines
		intersects.forEach((intersection) => {
			const line = intersection.object as THREE.Line;
			hoveredLines.push(line);
		});

		// Highlight all currently hovered lines
		const hoveredLinesSet: Set<number> = new Set();
		hoveredLines.forEach((line: any) => {
			hoveredLinesSet.add(line.index);
			// line.material = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 1 });
			// changeLinePosition(line, 2);
		});
		hoveredArray.set(hoveredLinesSet);

		//render();
	}

	// function handleClick() {
	// 	if (hoveredLine?.index === undefined) return;

	// 	if (brushedLinesIndices.has(hoveredLine.index))
	// 		// Remove the index if it exists
	// 		brushedLinesIndices.delete(hoveredLine.index);
	// 	else brushedLinesIndices.add(hoveredLine.index); // Add the index if it doesn't exist
	// 	brushingArray.set(brushedLinesIndices);
	// }

	export const applyFilters = () => {
		lineShow = [];
		dataset.forEach((line: any[], idx: number) => {
			lineShow[idx] = true;
			dimensions.forEach((dim: string, j: number) => {
				if (!axesFilters[j]?.pixels) return;

				const originalYValue = line[dim as any];
				const scaledYValue = yScales[dim](originalYValue);
				const filterValueStart = yScales[dim].invert
					? axesFilters[j].pixels.start
					: axesFilters[j].pixels.start - yScales[dim].step() / 2;
				const filterValueEnd = yScales[dim].invert
					? axesFilters[j].pixels.end
					: axesFilters[j].pixels.end - yScales[dim].step() / 2;
				if (scaledYValue < filterValueStart || scaledYValue > filterValueEnd) {
					lineShow[idx] = false;
				}
			});
			if (lineShow[idx]) {
				lineColors[idx] = 0x4169e1;
				linePositions[idx] = 0;
				lines[idx].material = new THREE.LineBasicMaterial({ color: 0x4169e1, linewidth: 1 }); // Set color to active
				changeLinePosition(lines[idx], 0);
			} else {
				lineColors[idx] = 0xcbd5e0;
				linePositions[idx] = -1;
				lines[idx].material = new THREE.LineBasicMaterial({ color: 0xcbd5e0, linewidth: 1 }); // Set color to inactive
				changeLinePosition(lines[idx], -1);
			}
		});

		// Change color for brushed lines
		// const material = new THREE.LineBasicMaterial({ color: 0xfb923c, linewidth: 1 });
		// brushedLinesIndices.forEach((idx: number) => {
		// 	if (idx === undefined) return;
		// 	lines[idx].material = material;
		// 	changeLinePosition(lines[idx], 1);
		// });

		linkingArray.set(lineShow);

		render();
	};

	export const handleInvertAxis = () => {
		drawLines();
	};

	function changeLinePosition(line: THREE.Line, newZPosition: number) {
		const positions = line.geometry.attributes.position.array;

		// Iterate through the positions and update the z-coordinate
		for (let i = 0; i < positions.length; i += 3) {
			positions[i + 2] = newZPosition;
		}

		// Update the position attribute and tell Three.js to update the rendering
		line.geometry.attributes.position.needsUpdate = true;
	}

	function render() {
		if (!renderer) return;
		renderer.clear();
		renderer.render(scene, camera);
		// console.log(scene.children.length);
	}

	function initialzeArrays() {
		dimensions = initialDimensions;
		lineShow = Array(dataset.length).fill(true);
		lineColors = Array(dataset.length).fill(0x4169e1);
		linePositions = Array(dataset.length).fill(0);
		linkingArray.set(lineShow);
	}

	onMount(() => {
		initialzeArrays();
		initScene();
		drawLines();
		window.addEventListener('mousemove', handleMouseMove, false);
		// window.addEventListener('click', handleClick, false);
	});

	afterUpdate(() => {
		if (axesFilters.length !== dimensions.length) {
			dimensions = initialDimensions;
			initialzeArrays();
		}
		initScene();
		drawLines();
	});

	onDestroy(() => {
		window.removeEventListener('mousemove', handleMouseMove);
		unsubscribeFilters();
		unsubscribeBrushing();
		unsubscribeHovered();
		unsubscribePrevHovered();
	});
</script>

<canvas bind:this={canvasEl} />
