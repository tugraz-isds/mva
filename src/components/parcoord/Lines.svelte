<script lang="ts">
	import * as PIXI from 'pixi.js';
	import { SmoothGraphics } from '@pixi/graphics-smooth';
	import { scaleLinear, extent } from 'd3';
	import type { DSVParsedArray } from 'd3';
	import { onMount } from 'svelte';

	console.log('Is WebGL supported: ', PIXI.utils.isWebGLSupported());

	export let width: number = 0;
	export let height: number = 0;
	export let dataset: DSVParsedArray<any>;
	export let initialDimensions: string[] = []; // Initial order of dimensions
	export let margin: any;

	const lineData: DSVParsedArray<any>[] = []; // Array to store the data for each drawn line

	let app: PIXI.Application; // Pixi Application object
	let graphics: PIXI.Graphics | SmoothGraphics; // Pixi (Smooth) Graphics object

	let xScales: any[] = []; // Scales for all of the X-axes
	let yScales: any = {}; // Scales for all of the Y-axes

	let dimensions: string[]; // Dimensions used for swapping

	// Update yScales when dataset changes
	$: {
		if (dataset) {
			dimensions = initialDimensions;
			yScales = initialDimensions.reduce((acc: any, dim: string) => {
				const dimExtent: any = extent(dataset, (d: any) => +d[dim]);
				acc[dim] = scaleLinear()
					.domain(dimExtent)
					.range([height - margin.top - margin.bottom, 0]);
				return acc;
			}, {});
		}
	}

	// Update xScale when dimensions change
	$: {
		if (width > 0 && initialDimensions) {
			const newWidth =
				width < 100 * initialDimensions.length
					? initialDimensions.length * 100 - margin.right
					: width - margin.right;
			xScales = initialDimensions.map((_, i) =>
				scaleLinear()
					.domain([0, initialDimensions.length - 1])
					.range([margin.left, newWidth])(i)
			);
			if (app) {
				app.stage.removeChildren();
				app.renderer.resize(newWidth, height);
				drawLines();
			}
		}
	}

	// Function to draw a single line
	function drawLine(dataRow: any) {
		lineData.push(dataRow); // Store the data for each line

		// Draw line with Pixi
		graphics.moveTo(xScales[0], yScales[dimensions[0]](dataRow[dimensions[0] as any]) + margin.top);
		for (let i = 1; i < xScales.length; i++) {
			const dim = dimensions[i];
			graphics.lineTo(
				xScales[i],
				yScales[dim](dataRow[dim as any])
					? yScales[dim](dataRow[dim as any]) + margin.top
					: margin.top
			);
		}
	}

	// Function to iterate all data and call drawLine
	function drawLines() {
		//graphics = new PIXI.Graphics();
		graphics = new SmoothGraphics();
		graphics!.lineStyle(1, 0x69b3a2, 0.5);
		app.stage.addChild(graphics);

		// Draw the lines
		dataset.forEach((d: any) => {
			drawLine(d);
		});

		const parcoordDiv = document.getElementById('parcoord-canvas');
		if (parcoordDiv instanceof HTMLElement) {
			parcoordDiv.appendChild(app.view as HTMLCanvasElement); // Append the PixiJS canvas to the parent div
		}
	}

	// Function that swaps line points when axes are swapped
	export const swapPoints = (fromIndex: number, toIndex: number) => {
		//xScales = reorderArray(xScales, fromIndex, toIndex);
		dimensions = reorderArray(dimensions, fromIndex, toIndex);

		app.stage.removeChildren();

		// Redraw lines using updated data
		drawLines();
	};

	// Function to initialize Pixi application
	function initPixi() {
		app = new PIXI.Application({
			resolution: 1,
			backgroundColor: 0xffffff,
			width: width < 100 * initialDimensions.length ? initialDimensions.length * 100 : width,
			height: height
		});
	}

	// Helper function to reorder an array
	function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
		const result = [...arr];
		const [removed] = result.splice(fromIndex, 1);
		result.splice(toIndex, 0, removed);
		return result;
	}

	onMount(() => {
		initPixi();
	});
</script>
