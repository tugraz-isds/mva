<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import * as THREE from 'three';
	import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer.js';
	import { select, line as lineD3 } from 'd3';
	import {
		brushedArray,
		hoveredArray,
		previouslyHoveredArray,
		previouslyBrushedArray
	} from '../../stores/brushing';
	import { labelDimension } from '../../stores/dataset';
	import { filtersArray } from '../../stores/parcoord';
	import { linkingArray } from '../../stores/linking';
	import type { DSVParsedArray } from 'd3';
	import type { AxesFilterType } from './types';

	export let width: number;
	export let height: number;
	export let dataset: DSVParsedArray<any>;
	export let initialDimensions: string[] = []; // Initial order of dimensions
	export let margin: any;
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes
	export let setTooltipData: Function; // Callback function for tooltip

	let newWidth = width < 100 * initialDimensions.length ? initialDimensions.length * 100 : width;

	// ThreeJS elements
	let canvasEl: HTMLCanvasElement;
	let camera: THREE.OrthographicCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let line: any;
	let raycaster: THREE.Raycaster;
	let mouse: THREE.Vector2;

	let lines: THREE.Line[] = []; // Array to store all line objects
	let lineShow: boolean[] = []; // Array of booleans that store info if each line should be drawn
	let lineColors: number[] = []; // Array of number colors for all lines
	let linePositions: number[] = []; // Array of number positions for all lines

	let dimensions: string[]; // Dimensions used for swapping
	let axesFilters: AxesFilterType[] = []; // Filter values array for linking
	let hoveredLinesIndices = new Set<number>(); // Currently hovered lines
	let previouslyHoveredLinesIndices = new Set<number>(); // Previously hovered lines
	let brushedLinesIndices = new Set<number>(); // Currently brushed lines
	let previouslyBrushedLinesIndices = new Set<number>(); // Previously brushed lines
	let labelDim: string; // Dataset label dimension

	// Apply filters
	const unsubscribeFilters = filtersArray.subscribe((value: any) => {
		axesFilters = value;
		if (dataset?.length > 0 && dimensions?.length > 0) {
			if (axesFilters.length === dimensions.length) applyFilters();
		}
	});

	const unsubscribeHovered = hoveredArray.subscribe((value: Set<number>) => {
		removeHoveredLines();
		hoveredLinesIndices = value;
		drawHoveredLines();
		previouslyHoveredArray.set(hoveredLinesIndices);
	});

	const unsubscribePrevHovered = previouslyHoveredArray.subscribe((value: Set<number>) => {
		previouslyHoveredLinesIndices = value;
	});

	const unsubscribeBrushing = brushedArray.subscribe((value: any) => {
		brushedLinesIndices = value;
		drawBrushedLines();
	});

	const unsubscribePrevBrushed = previouslyBrushedArray.subscribe((value: Set<number>) => {
		previouslyBrushedLinesIndices = value;
		removeBrushedLines();
	});

	const unsubscribeLabelDim = labelDimension.subscribe((value: string) => {
		labelDim = value;
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

	function drawHoveredLines() {
		hoveredLinesIndices.forEach((i) => {
			const line = lines[i];
			line.material = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 1 });
			changeLinePosition(line, 2);
		});
		render();
	}

	function drawBrushedLines() {
		brushedLinesIndices.forEach((i) => {
			const line = lines[i];
			lineColors[i] = 0xfb923c;
			linePositions[i] = 1;
			line.material = new THREE.LineBasicMaterial({ color: lineColors[i], linewidth: 1 });
			changeLinePosition(line, linePositions[i]);
		});
		render();
	}

	function removeHoveredLines() {
		previouslyHoveredLinesIndices.forEach((i) => {
			const line = lines[i];
			line.material = new THREE.LineBasicMaterial({ color: lineColors[i], linewidth: 1 });
			changeLinePosition(line, linePositions[i]);
		});
		render();
	}

	function removeBrushedLines() {
		previouslyBrushedLinesIndices.forEach((i) => {
			const line = lines[i];
			lineColors[i] = lineShow[i] ? 0x4169e1 : 0xcbd5e0;
			linePositions[i] = lineShow[i] ? 0 : -1;
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

		raycaster.setFromCamera(mouse, camera); // Update the raycaster
		const intersects = raycaster.intersectObjects(lines); // Check for intersections

		// Add hovered lines
		const hoveredLinesSet: Set<number> = new Set();
		intersects.forEach((intersection) => {
			const line = intersection.object as any;
			hoveredLinesSet.add(line.index);
		});

		if (areSetsEqual(previouslyHoveredLinesIndices, hoveredLinesSet)) return;

		setTooltip(hoveredLinesSet, event.clientX - canvasRect.left, event.clientY - canvasRect.top);

		hoveredArray.set(hoveredLinesSet);
	}

	function handleClick(event: MouseEvent) {
		const canvasRect = canvasEl.getBoundingClientRect();
		// If mouse is not in parcoord, return
		if (
			!(
				event.clientY >= canvasRect.top + margin.top &&
				event.clientY <= canvasRect.bottom &&
				event.clientX >= canvasRect.left &&
				event.clientX <= canvasRect.right
			)
		)
			return;

		previouslyBrushedArray.set(brushedLinesIndices);

		// Add to brushed if Ctrl key is pressed
		if (event.ctrlKey) {
			hoveredLinesIndices.forEach((i) => {
				if (brushedLinesIndices.has(i)) brushedLinesIndices.delete(i);
				else brushedLinesIndices.add(i);
			});
		}
		// Set brushed to hovered
		else {
			const newBrushedLinesIndices = new Set<number>();
			hoveredLinesIndices.forEach((i) => {
				if (!brushedLinesIndices.has(i)) newBrushedLinesIndices.add(i);
			});
			brushedLinesIndices = newBrushedLinesIndices;
		}
		brushedLinesIndices.forEach((i) => {
			if (!lineShow[i]) brushedLinesIndices.delete(i);
		});
		brushedArray.set(brushedLinesIndices);
	}

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
			if (brushedLinesIndices.has(idx)) {
				if (!lineShow[idx]) brushedLinesIndices.delete(idx);
				else {
					lineColors[idx] = 0xfb923c;
					linePositions[idx] = 1;
				}
			} else {
				if (lineShow[idx]) {
					lineColors[idx] = 0x4169e1;
					linePositions[idx] = 0;
				} else {
					lineColors[idx] = 0xcbd5e0;
					linePositions[idx] = -1;
				}
			}
			lines[idx].material = new THREE.LineBasicMaterial({ color: lineColors[idx], linewidth: 1 });
			changeLinePosition(lines[idx], linePositions[idx]);
		});

		brushedArray.set(brushedLinesIndices);
		linkingArray.set(lineShow);
		render();
	};

	function setTooltip(hoveredLinesSet: Set<number>, x: number, y: number) {
		if (hoveredLinesSet.size === 0) {
			setTooltipData({
				visible: false,
				xPos: 0,
				yPos: 0,
				text: []
			});
		} else {
			let tooltipText: string[] = [];
			hoveredLinesSet.forEach((i) => {
				tooltipText.push(`${dataset[i][labelDim]}`);
			});
			setTooltipData({
				visible: true,
				xPos: x + 25,
				yPos: y,
				text: tooltipText
			});
		}
	}

	export const handleInvertAxis = () => {
		drawLines();
	};

	// Function to swap points when axes are reordered
	export const swapPoints = (fromIndex: number, toIndex: number) => {
		dimensions = reorderArray(dimensions, fromIndex, toIndex);
		axesFilters = reorderArray(axesFilters, fromIndex, toIndex);
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
	}

	// Helper function to reorder an array
	function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
		const result = [...arr];
		const [removed] = result.splice(fromIndex, 1);
		result.splice(toIndex, 0, removed);
		return result;
	}

	function initialzeArrays() {
		dimensions = initialDimensions;
		lineShow = Array(dataset.length).fill(true);
		lineColors = Array(dataset.length).fill(0x4169e1);
		linePositions = Array(dataset.length).fill(0);
		linkingArray.set(lineShow);
	}

	// Helper function to compare 2 sets
	const areSetsEqual = (set1: Set<number>, set2: Set<number>) =>
		set1.size === set2.size && [...set1].every((value) => set2.has(value));

	export const saveSVG = () => {
		const tempContainer = document.createElement('div');
		const svgContainer = select(tempContainer)
			.append('svg')
			.attr('viewBox', `0 0 ${newWidth} ${height}`);

		const lineGenerator = lineD3()
			.x((d: any) => d[0])
			.y((d: any) => d[1]);

		dataset.forEach((dataRow: any) => {
			const lineSvg = drawLineSVG(dataRow);
			svgContainer
				.append('path')
				.datum(lineSvg)
				.attr('fill', 'none')
				.attr('stroke', 'blue')
				.attr('stroke-width', 1)
				.attr('d', lineGenerator as any);
		});

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svgContainer.node() as Node);
		tempContainer.remove();
		return svgString;
	};

	function drawLineSVG(dataRow: any[]) {
		const linePoints = [];
		for (let i = 0; i < dimensions.length; i++) {
			const dim = dimensions[i];

			let yPos;
			if (yScales[dim].invert) yPos = yScales[dim](dataRow[dim as any]);
			else yPos = yScales[dim](dataRow[dim as any]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

			linePoints.push([
				xScales[i],
				isNaN(yScales[dim](dataRow[dim as any])) ? margin.top : yPos + margin.top
			]);
		}

		return linePoints;
	}

	onMount(() => {
		initialzeArrays();
		initScene();
		drawLines();
		window.addEventListener('mousemove', handleMouseMove, false);
		window.addEventListener('click', handleClick, false);
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
		unsubscribePrevBrushed();
		unsubscribeLabelDim();
	});
</script>

<canvas bind:this={canvasEl} />
