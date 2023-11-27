<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import * as PIXI from 'pixi.js';
	import { SmoothGraphics } from '@pixi/graphics-smooth';
	import { patchGraphicsSmooth } from './patchGraphicsSmooth';
	import { brushingArray } from '../../stores/brushing';
	import { hoveredItem } from '../../stores/brushing';
	import { filtersArray } from '../../stores/parcoord';
	import { linkingArray } from '../../stores/linking';
	import { reorderArray } from '../../util/util';
	import type { DSVParsedArray } from 'd3';
	import type { AxesFilterType } from './types

	patchGraphicsSmooth();
	console.log('Is WebGL supported: ', PIXI.utils.isWebGLSupported());

	export let width: number = 0;
	export let height: number = 0;
	export let dataset: DSVParsedArray<any>;
	export let initialDimensions: string[] = []; // Initial order of dimensions
	export let margin: any;
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	const lineData: DSVParsedArray<any>[] = []; // Array to store the data for each drawn line as array of numbers
	const lineGraphicsData: SmoothGraphics[] = []; // Array to store the data for each drawn line as PIXI.Graphics object
	let lineShow: boolean[] = []; // Array of booleans that store info if each line should be drawn

	let dimensions: string[]; // Dimensions used for swapping
	let axesFilters: AxesFilterType[] = []; // Filter values array for linking
	let isCurrentlyFiltering: boolean = false;
	let hoveredLineIndex: number | null = null; // Currently hovered line
	let brushedLinesIndices = new Set<number>(); // Currently brushed lines
	let lineHover: SmoothGraphics;

	let app: PIXI.Application; // Pixi Application object

	const unsubscribeFilters = filtersArray.subscribe((value: any) => {
		axesFilters = value;
		if (dataset?.length > 0 && dimensions?.length > 0) {
			applyFilters();
		}
	});

	// Redraw after brushing
	const unsubscribeBrushing = brushingArray.subscribe((value: any) => {
		brushedLinesIndices = value;
		if (dataset?.length > 0 && dimensions?.length > 0 && app) {
			app.stage.removeChildren();
			app.renderer.resize(
				width < 100 * initialDimensions.length
					? initialDimensions.length * 100 - margin.right
					: width - margin.right,
				height
			);
			dimensions = initialDimensions;
			drawLines();
		}
	});

	// Draw hovered line
	const unsubscribeHovered = hoveredItem.subscribe((value: number | null) => {
		hoveredLineIndex = value;
		if (!app || isCurrentlyFiltering) return;
		if (hoveredLineIndex === null) {
			if (!isCurrentlyFiltering) {
				app.stage.removeChild(lineHover);
			}
		} else {
			lineHover = new SmoothGraphics();
			lineHover.lineStyle(2, 0xef4444, 1);
			drawLine(lineHover, dataset[hoveredLineIndex]);
			app.stage.addChildAt(lineHover, app.stage.children.length - 1);
		}
	});

	// Function to initialize Pixi application
	function initPixi() {
		app = new PIXI.Application({
			resolution: 1,
			backgroundColor: 0xffffff,
			width: width < 100 * initialDimensions.length ? initialDimensions.length * 100 : width,
			height: height
		});

		const parcoordDiv = document.getElementById('parcoord-canvas');
		if (parcoordDiv instanceof HTMLElement) {
			parcoordDiv.appendChild(app.view as HTMLCanvasElement); // Append the PixiJS canvas to the parent div
		}
	}

	// Function to iterate all data, call drawLine, and add to canvas
	function drawLines() {
		dataset.forEach((dataRow: any, idx: number) => {
			lineData.push(dataRow); // Store the data for each line as array
			lineShow.push(true);

			const line = new SmoothGraphics();
			line.lineStyle(1, 0xffffff, 0.75);
			line.tint = lineShow[idx] ? 0x4169e1 : 0xcbd5e0;
			drawLine(line, dataRow);
			lineGraphicsData.push(line); // Store the data for each line as PIXI.Graphics object
			app.stage.addChild(line); // Add the line to the stage

			line.eventMode = 'static'; // Add event listeners for hover interactions
			line.on('mouseover', () => {
				hoveredItem.set(idx);
			});
			line.on('mouseout', () => {
				hoveredItem.set(null);
			});
		});

		// Draw brushed lines
		brushedLinesIndices.forEach((idx: number) => {
			const lineBrushed = new SmoothGraphics();
			lineBrushed.lineStyle(2, 0xfb923c, 1);
			drawLine(lineBrushed, dataset[idx]);
			app.stage.addChildAt(lineBrushed, app.stage.children.length - 1);
		});
	}

	function drawLine(line: SmoothGraphics, dataRow: any) {
		line.moveTo(xScales[0], yScales[dimensions[0]](dataRow[dimensions[0] as any]) + margin.top);
		for (let i = 1; i < dimensions.length; i++) {
			const dim = dimensions[i];

			let yPos;
			if (yScales[dim].invert) yPos = yScales[dim](dataRow[dim as any]);
			else yPos = yScales[dim](dataRow[dim as any]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

			line.lineTo(
				xScales[i],
				isNaN(yScales[dim](dataRow[dim as any])) ? margin.top : yPos + margin.top
			);
		}
	}

	// Apply filters and change line color if needed
	export const applyFilters = () => {
		lineShow = [];
		lineData.forEach((line: any, i: number) => {
			lineShow[i] = true;
			dimensions.forEach((dim: string, j: number) => {
				if (!axesFilters[j]?.pixels) return;

				const originalYValue = line[dim];
				const scaledYValue = yScales[dim](originalYValue);
				const filterValueStart = yScales[dim].invert
					? axesFilters[j].pixels.start
					: axesFilters[j].pixels.start - yScales[dim].step() / 2;
				const filterValueEnd = yScales[dim].invert
					? axesFilters[j].pixels.end
					: axesFilters[j].pixels.end - yScales[dim].step() / 2;
				if (scaledYValue < filterValueStart || scaledYValue > filterValueEnd) {
					lineShow[i] = false;
				}
			});
			if (lineShow[i]) lineGraphicsData[i].tint = 0x4169e1;
			else lineGraphicsData[i].tint = 0xcbd5e0;
		});

		linkingArray.set(lineShow);
	};

	export const handleCurrentlyFiltering = (isFiltering: boolean) =>
		(isCurrentlyFiltering = isFiltering);

	// Function that swaps line points when axes are swapped
	export const swapPoints = (fromIndex: number, toIndex: number) => {
		dimensions = reorderArray(dimensions, fromIndex, toIndex);
		axesFilters = reorderArray(axesFilters, fromIndex, toIndex);
		app.stage.removeChildren();
		drawLines(); // Redraw lines using updated data
	};

	onMount(() => {
		dimensions = initialDimensions;
		lineShow = Array(dataset.length).fill(true);
		linkingArray.set(lineShow);
		initPixi();
	});

	afterUpdate(() => {
		if (app) {
			app.stage.removeChildren();
			app.renderer.resize(
				width < 100 * initialDimensions.length
					? initialDimensions.length * 100 - margin.right
					: width - margin.right,
				height
			);
			dimensions = initialDimensions;
			drawLines();
		}
	});

	onDestroy(() => {
		unsubscribeFilters();
		unsubscribeBrushing();
		unsubscribeHovered();
	});
</script>
