<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import * as PIXI from 'pixi.js';
	import { SmoothGraphics } from '@pixi/graphics-smooth';
	import { patchGraphicsSmooth } from './patchGraphicsSmooth';
	import type { DSVParsedArray } from 'd3';

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
	let axesFilters: { start: number; end: number }[] = [];

	let app: PIXI.Application; // Pixi Application object

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
			line.lineStyle(2, 0xffffff, 0.75);
			line.tint = lineShow[idx] ? 0x4169e1 : 0x808080;
			drawLine(line, dataRow);
			lineGraphicsData.push(line); // Store the data for each line as PIXI.Graphics object
			app.stage.addChild(line); // Add the line to the stage

			line.eventMode = 'static'; // Add event listeners for hover interactions
			line.on('mouseover', () => {
				const lineHover = new SmoothGraphics();
				lineHover.lineStyle(3, 0xee4b2b, 1);
				drawLine(lineHover, dataRow);
				app.stage.addChildAt(lineHover, app.stage.children.length - 1);
			});
			line.on('mouseout', () => {
				app.stage.removeChildAt(app.stage.children.length - 2);
			});
		});
	}

	function drawLine(line: SmoothGraphics, dataRow: any) {
		line.moveTo(xScales[0], yScales[dimensions[0]](dataRow[dimensions[0] as any]) + margin.top);
		for (let i = 1; i < xScales.length; i++) {
			const dim = dimensions[i];
			line.lineTo(
				xScales[i],
				yScales[dim](dataRow[dim as any])
					? yScales[dim](dataRow[dim as any]) + margin.top
					: margin.top
			);
		}
	}

	// Apply filters and change line color if needed
	export const applyFilters = (axisIndex: number, filterStart: number, filterEnd: number) => {
		axesFilters[axisIndex] = { start: filterStart, end: filterEnd };

		lineData.forEach((line: any, i: number) => {
			lineShow[i] = true;
			dimensions.forEach((dim: string, j: number) => {
				if (!axesFilters[j]) return;

				const originalYValue = line[dim];
				const scaledYValue = yScales[dim](originalYValue);
				if (scaledYValue < axesFilters[j].start || scaledYValue > axesFilters[j].end) {
					lineShow[i] = false;
				}
			});
			if (lineShow[i]) lineGraphicsData[i].tint = 0x4169e1;
			else lineGraphicsData[i].tint = 0x808080;
		});
	};

	// Function that swaps line points when axes are swapped
	export const swapPoints = (fromIndex: number, toIndex: number) => {
		dimensions = reorderArray(dimensions, fromIndex, toIndex);
		axesFilters = reorderArray(axesFilters, fromIndex, toIndex);
		app.stage.removeChildren();
		drawLines(); // Redraw lines using updated data
	};

	// Helper function to reorder an array
	function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
		const result = [...arr];
		const [removed] = result.splice(fromIndex, 1);
		result.splice(toIndex, 0, removed);
		return result;
	}

	onMount(() => {
		dimensions = initialDimensions;
		axesFilters = Array(dimensions.length).fill(null);
		lineShow = Array(lineShow.length).fill(true);
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
			axesFilters = Array(dimensions.length).fill(null);
			lineShow = Array(lineShow.length).fill(true);
			drawLines();
		}
	});
</script>
