<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import * as PIXI from 'pixi.js';
	import { SmoothGraphics } from '@pixi/graphics-smooth';
	import { select, scaleLinear, scalePoint, extent, axisLeft, csv } from 'd3';
	import type { DSVRowArray, NumberValue } from 'd3';
	console.log('Is WebGL supported: ', PIXI.utils.isWebGLSupported());

	let width: number;
	let height: number;
	let _width: number, _height: number;

	$: {
		_width = width - margin.left - margin.right;
		_height = height - margin.top - margin.bottom;
	}

	// Data
	let data: DSVRowArray<string>;
	let dimensions: string[];
	let y: { [key: string]: any };
	let x: any;

	// D3
	let container: HTMLDivElement;
	let svg;
	const margin = { top: 30, right: 10, bottom: 50, left: 10 };

	// PixiJS
	let app: PIXI.Application;
	let graphics: PIXI.Graphics | SmoothGraphics;

	const drawLine = (dataRow: any[]) => {
		dimensions.forEach((p: any, i: number) => {
			const xCoord = x(p) || 0;
			const yCoord = y[p](dataRow[p] ?? 0) || 0;

			// Apply margins to the scaled data points
			const scaledX =
				margin.left +
				(xCoord / (_width - margin.left - margin.right)) * (_width - margin.left - margin.right);
			const scaledY =
				margin.top +
				(yCoord / (_height - margin.top - margin.bottom)) * (_height - margin.top - margin.bottom);

			if (i === 0) {
				graphics!.moveTo(scaledX, scaledY);
			} else {
				graphics!.lineTo(scaledX, scaledY);
			}
		});
	};

	const drawLines = (data: any) => {
		// Create new PixiJS application
		app = new PIXI.Application({
			resolution: 1,
			backgroundColor: 0xffffff,
			width: width,
			height: height
		});

		// Create graphics to draw lines
		//graphics = new PIXI.Graphics();
		graphics = new SmoothGraphics();
		graphics!.lineStyle(1, 0x69b3a2, 0.5);
		app.stage.addChild(graphics);

		// Draw the lines
		data.forEach((d: any) => {
			drawLine(d);
		});

		const parcoordDiv = document.getElementById('parcoord-canvas');
		if (parcoordDiv instanceof HTMLElement) {
			parcoordDiv.appendChild(app.view as HTMLCanvasElement); // Append the PixiJS canvas to the parent div
		}
	};

	const drawAxes = async () => {
		// Append the SVG object to the container div
		svg = select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Load the CSV data
		data = await csv(
			'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/iris.csv'
		);

		// Extract the list of dimensions we want to keep in the plot. Here I keep all except the column called Species
		dimensions = Object.keys(data[0]).filter(function (d) {
			return d != 'Species';
		});

		// For each dimension, build a linear scale and store them in the y object
		y = {};
		for (const name of dimensions) {
			const values = data.map((d) => +(d[name] ?? NaN)).filter((value) => !isNaN(value));
			y[name] = scaleLinear<NumberValue>()
				.domain(extent(values) as [NumberValue, NumberValue])
				.range([_height, 0]);
		}

		// Build the X scale -> find the best position for each Y axis
		x = scalePoint().range([0, _width]).padding(0.1).domain(dimensions);

		// Draw the axes
		svg
			.selectAll<SVGGElement, string>('myAxis')
			.data(dimensions)
			.join('g')
			.attr('transform', (d) => `translate(${x(d) ?? 0}, 0)`)
			.each(function (d) {
				select(this).call(axisLeft<any>(y[d]));
			})
			.append('text')
			.style('text-anchor', 'middle')
			.attr('y', -9)
			.text((d) => d)
			.style('fill', 'black');
	};

	onMount(async () => {
		await drawAxes();
		drawLines(data);
	});
</script>

<div
	id="parcoord-canvas"
	style="width: 100%; height: 100%; position: relative;"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	<div
		bind:this={container}
		style="width: 100%; height: 100%; background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 2;"
	/>
</div>
