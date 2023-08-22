<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
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

	const lineData: DSVParsedArray<any>[] = []; // Array to store the data for each drawn line

	let app: PIXI.Application; // Pixi Application object

	let dimensions: string[]; // Dimensions used for swapping

	// Function to draw a single line
	function drawLine(dataRow: any) {
		lineData.push(dataRow); // Store the data for each line

		// Draw line with Pixi
		const line = new SmoothGraphics();
		line.lineStyle(2, 0xffffff, 0.75);
		line.tint = 0x4169e1;
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

		line.eventMode = 'static'; // Add event listeners for hover interactions
		line.on('mouseover', () => {
			line.tint = 0xee4b2b;
			app.stage.addChildAt(line, app.stage.children.length - 1);
		});
		line.on('mouseout', () => {
			line.tint = 0x4169e1;
		});

		// Add the line to the stage
		app.stage.addChild(line);
	}

	// Function to iterate all data, call drawLine, and add to canvas
	function drawLines() {
		dataset.forEach((d: any) => {
			drawLine(d);
		});
	}

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

	// Function that swaps line points when axes are swapped
	export const swapPoints = (fromIndex: number, toIndex: number) => {
		dimensions = reorderArray(dimensions, fromIndex, toIndex);
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
</script>
