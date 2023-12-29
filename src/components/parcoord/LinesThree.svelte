<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import * as THREE from 'three';
	import { select, line as lineD3 } from 'd3';
	import {
		brushedArray,
		hoveredArray,
		previouslyHoveredArray,
		previouslyBrushedArray
	} from '../../stores/brushing';
	import { labelDimension, dimensionTypeStore } from '../../stores/dataset';
	import { filtersArray, parcoordIsInteractable } from '../../stores/parcoord';
	import { COLOR_ACTIVE, COLOR_BRUSHED, COLOR_FILTERED } from '../../util/colors';
	import {
		MATERIAL_MAP,
		MATERIAL_HOVERED,
		MATERIAL_BRUSHED,
		MATERIAL_DRAGGING_RECT
	} from '../../util/materials';
	import { reorderArray, areSetsEqual } from '../../util/util';
	import { linkingArray } from '../../stores/linking';
	import type { DSVParsedArray } from 'd3';
	import type { AxesFilterType, LineDataType } from './types';

	export let width: number;
	export let height: number;
	export let dataset: DSVParsedArray<any>;
	export let initialDimensions: string[] = []; // Initial order of dimensions
	export let margin: any;
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes
	export let setTooltipData: Function; // Callback function for tooltip

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
	let lineData: LineDataType[] = []; // Array of line data for all lines

	let dimensions: string[]; // Dimensions used for swapping
	let axesFilters: AxesFilterType[] = []; // Filter values array for linking
	let hoveredLinesIndices = new Set<number>(); // Currently hovered lines
	let previouslyHoveredLinesIndices = new Set<number>(); // Previously hovered lines
	let brushedLinesIndices = new Set<number>(); // Currently brushed lines
	let previouslyBrushedLinesIndices = new Set<number>(); // Previously brushed lines
	let labelDim: string; // Dataset label dimension

	let isDragging: boolean = false; // Is user currently dragging
	let dragStart: {
		x: number;
		y: number;
	} | null = null;
	let draggingRectangle: THREE.Line;
	let intersectingLines: any[];

	// Apply filters
	const unsubscribeFilters = filtersArray.subscribe((value: any) => {
		axesFilters = value;
		if (dataset?.length > 0 && dimensions?.length > 0) {
			if (axesFilters.length === dimensions.length) applyFilters();
		}
	});

	let dimensionTypes: Map<string, string>;
	const unsubscribeDimTypes = dimensionTypeStore.subscribe((value: Map<string, string>) => {
		dimensionTypes = value;
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
	export function initScene() {
		// Create a scene
		scene = new THREE.Scene();

		// Create a camera
		camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
		camera.position.set(0, 0, 5);

		// Create a renderer and append the canvas to the specified element
		renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasEl });
		renderer.setClearColor(0xffffff);
		renderer.setSize(width, height);
		const parcoordDiv = document.getElementById('parcoord-canvas');
		if (parcoordDiv instanceof HTMLElement) parcoordDiv.appendChild(renderer.domElement);

		// Initialize raycaster and mouse
		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();
	}

	export function drawLines(newWidth: number | undefined = undefined) {
		if (newWidth) width = newWidth;

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
			if (dimensionTypes.get(dim) === 'numerical') yPos = yScales[dim](dataRow[dim as any]);
			else yPos = yScales[dim](dataRow[dim as any]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

			linePoints.push(
				new THREE.Vector3(
					xScales[i],
					isNaN(yScales[dim](dataRow[dim as any])) ? margin.top : yPos + margin.top,
					lineData[idx].position
				)
			);
		}

		const material = MATERIAL_MAP.get(lineData[idx].color) ?? new THREE.LineBasicMaterial();
		material.needsUpdate = false;
		const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
		line = new THREE.Line(geometry, material);
		line.index = idx; // Add custom property index to hovered line
		lines.push(line);
		scene.add(line);
	}

	function drawHoveredLines() {
		hoveredLinesIndices.forEach((i) => {
			const line = lines[i];
			line.material = MATERIAL_HOVERED;
			changeLinePosition(line, 2);
			line.material.needsUpdate = true;
		});
		render();
	}

	function drawBrushedLines() {
		brushedLinesIndices.forEach((i) => {
			const line = lines[i];
			lineData[i] = { color: COLOR_BRUSHED, position: 1 };
			line.material = MATERIAL_BRUSHED;
			changeLinePosition(line, 1);
			line.material.needsUpdate = true;
		});
		render();
	}

	function removeHoveredLines() {
		previouslyHoveredLinesIndices.forEach((i) => {
			const line = lines[i];
			line.material = MATERIAL_MAP.get(lineData[i].color) ?? new THREE.LineBasicMaterial();
			line.material.needsUpdate = false;
			changeLinePosition(line, lineData[i].position);
		});
	}

	function removeBrushedLines() {
		previouslyBrushedLinesIndices.forEach((i) => {
			const line = lines[i];
			lineData[i] = {
				color: lineShow[i] ? COLOR_ACTIVE : COLOR_FILTERED,
				position: lineShow[i] ? 0 : -1
			};
			line.material = MATERIAL_MAP.get(lineData[i].color) ?? new THREE.LineBasicMaterial();
			line.material.needsUpdate = false;
			changeLinePosition(line, lineData[i].position);
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
			) ||
			!$parcoordIsInteractable
		)
			return;

		// Check for intersections
		raycaster.setFromCamera(mouse, camera); // Update the raycaster
		if (isDragging) {
			if (!dragStart) return;
			const rectWidth = event.clientX - canvasRect.left - dragStart.x,
				rectHeight = event.clientY - canvasRect.top - dragStart.y;
			drawDraggingRectangle(rectWidth, rectHeight);

			previouslyBrushedArray.set(brushedLinesIndices);
			intersectingLines.push(...raycaster.intersectObjects(lines));
			// Add to brushed if Ctrl key is pressed
			if (event.ctrlKey) {
				intersectingLines.forEach((intersection) => {
					const line = intersection.object as any;
					brushedLinesIndices.add(line.index);
				});
			}
			// Set brushed to lines in drawn rectangle
			else {
				const newBrushedLinesIndices = new Set<number>();
				intersectingLines.forEach((intersection) => {
					const line = intersection.object as any;
					newBrushedLinesIndices.add(line.index);
				});
				brushedLinesIndices = newBrushedLinesIndices;
			}
			brushedLinesIndices.forEach((i) => {
				if (!lineShow[i]) brushedLinesIndices.delete(i);
			});
			brushedArray.set(brushedLinesIndices);
		} else {
			// Add hovered lines
			intersectingLines = raycaster.intersectObjects(lines);
			const hoveredLinesSet: Set<number> = new Set();
			intersectingLines.forEach((intersection) => {
				const line = intersection.object as any;
				if (lineShow[line.index]) hoveredLinesSet.add(line.index);
			});

			if (areSetsEqual(previouslyHoveredLinesIndices, hoveredLinesSet)) return;
			setTooltip(hoveredLinesSet, event.clientX - canvasRect.left, event.clientY - canvasRect.top);
			hoveredArray.set(hoveredLinesSet);
		}
	}

	function handleMouseDown(event: MouseEvent) {
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

		isDragging = true;
		dragStart = { x: event.clientX - canvasRect.left, y: event.clientY - canvasRect.top };
		setTooltipData({ visible: false, xPos: 0, yPos: 0, text: [] });
		intersectingLines = [];

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

	function handleMouseUp(event: MouseEvent) {
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

		isDragging = false;
		dragStart = null;
		scene.remove(draggingRectangle);
		intersectingLines = [];
	}

	function drawDraggingRectangle(rectWidth: number, rectHeight: number) {
		if (!dragStart) return;
		scene.remove(draggingRectangle);
		const rectanglePoints = [
			new THREE.Vector3(dragStart.x, dragStart.y, 3),
			new THREE.Vector3(dragStart.x + rectWidth, dragStart.y, 3),
			new THREE.Vector3(dragStart.x + rectWidth, dragStart.y + rectHeight, 3),
			new THREE.Vector3(dragStart.x, dragStart.y + rectHeight, 3),
			new THREE.Vector3(dragStart.x, dragStart.y, 3)
		];

		const material = MATERIAL_DRAGGING_RECT;

		const geometry = new THREE.BufferGeometry().setFromPoints(rectanglePoints);
		draggingRectangle = new THREE.Line(geometry, material);

		scene.add(draggingRectangle);
		render();
	}

	export const applyFilters = () => {
		lineShow = [];
		dataset.forEach((line: any[], idx: number) => {
			lineShow[idx] = true;
			dimensions.forEach((dim: string, j: number) => {
				if (!axesFilters[j]?.pixels) return;

				const originalYValue = line[dim as any];
				const scaledYValue = yScales[dim](originalYValue);
				const filterValueStart =
					dimensionTypes.get(dim) === 'numerical'
						? axesFilters[j].pixels.start
						: axesFilters[j].pixels.start - yScales[dim].step() / 2;
				const filterValueEnd =
					dimensionTypes.get(dim) === 'numerical'
						? axesFilters[j].pixels.end
						: axesFilters[j].pixels.end - yScales[dim].step() / 2;
				if (scaledYValue < filterValueStart || scaledYValue > filterValueEnd) {
					lineShow[idx] = false;
				}
			});
			if (brushedLinesIndices.has(idx)) {
				if (!lineShow[idx]) brushedLinesIndices.delete(idx);
				else lineData[idx] = { color: COLOR_BRUSHED, position: 1 };
			} else {
				if (lineShow[idx]) lineData[idx] = { color: COLOR_ACTIVE, position: 0 };
				else lineData[idx] = { color: COLOR_FILTERED, position: -1 };
			}
			lines[idx].material = MATERIAL_MAP.get(lineData[idx].color) ?? new THREE.LineBasicMaterial();
			changeLinePosition(lines[idx], lineData[idx].position);
		});

		brushedArray.set(brushedLinesIndices);
		linkingArray.set(lineShow);
		render();
	};

	function setTooltip(hoveredLinesSet: Set<number>, x: number, y: number) {
		if (hoveredLinesSet.size === 0) {
			setTooltipData({ visible: false, xPos: 0, yPos: 0, text: [] });
		} else {
			let tooltipText: string[] = [];
			hoveredLinesSet.forEach((i) => {
				tooltipText.push(`${dataset[i][labelDim]}`);
			});
			setTooltipData({ visible: true, xPos: x + 25, yPos: y, text: tooltipText });
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

		line.geometry.attributes.position.needsUpdate = true; // Update position and update the rendering
	}

	function render() {
		if (!renderer) return;
		renderer.clear();
		renderer.render(scene, camera);
	}

	function initialzeArrays() {
		dimensions = initialDimensions;
		lineShow = Array(dataset.length).fill(true);
		lineData = Array(dataset.length).fill({ color: COLOR_ACTIVE, position: 0 });
		linkingArray.set(lineShow);
	}

	export const saveSVG = () => {
		const tempContainer = document.createElement('div');
		const svgContainer = select(tempContainer)
			.append('svg')
			.attr('viewBox', `0 0 ${width} ${height}`);

		const lineGenerator = lineD3()
			.x((d: any) => d[0])
			.y((d: any) => d[1]);

		const filteredIndices: number[] = [],
			activeIndices: number[] = [];
		lineShow.forEach((value: boolean, i: number) => {
			value ? activeIndices.push(i) : filteredIndices.push(i);
		});

		const drawLineSVG = (dataRow: any[], color: number, opacity: number) => {
			const linePoints = [];
			for (let i = 0; i < dimensions.length; i++) {
				const dim = dimensions[i];

				let yPos;
				if (dimensionTypes.get(dim) === 'numerical') yPos = yScales[dim](dataRow[dim as any]);
				else yPos = yScales[dim](dataRow[dim as any]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

				linePoints.push([
					xScales[i],
					isNaN(yScales[dim](dataRow[dim as any])) ? margin.top : yPos + margin.top
				]);
			}

			svgContainer
				.append('path')
				.datum(linePoints)
				.attr('fill', 'none')
				.attr('stroke', `#${color.toString(16).replace(/^0x/, '')}`)
				.attr('stroke-width', 1)
				.attr('stroke-opacity', opacity)
				.attr('d', lineGenerator as any);
		};

		filteredIndices.forEach((i) => {
			drawLineSVG(dataset[i], COLOR_FILTERED, 0.75);
		});

		activeIndices.forEach((i) => {
			if (lineData[i].color === COLOR_BRUSHED) return;
			drawLineSVG(dataset[i], COLOR_ACTIVE, 0.75);
		});

		brushedLinesIndices.forEach((i) => {
			drawLineSVG(dataset[i], COLOR_BRUSHED, 1);
		});

		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svgContainer.node() as Node);
		tempContainer.remove();
		return svgString;
	};

	onMount(() => {
		initialzeArrays();
		initScene();
		drawLines();
		window.addEventListener('mousemove', handleMouseMove, false);
		window.addEventListener('mousedown', handleMouseDown, false);
		window.addEventListener('mouseup', handleMouseUp, false);
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
		unsubscribeDimTypes();
		unsubscribeBrushing();
		unsubscribeHovered();
		unsubscribePrevHovered();
		unsubscribePrevBrushed();
		unsubscribeLabelDim();
	});
</script>

<canvas bind:this={canvasEl} />
