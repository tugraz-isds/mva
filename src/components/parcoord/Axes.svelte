<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { axisLeft, select, drag, symbol, symbolTriangle } from 'd3';
	import { filtersArray } from '../../stores/parcoord';
	import type { AxesFilter } from './AxesFilterType';

	export let width: number; // Container width
	export let height: number; // Container height
	export let dimensions: string[] = []; // Initial order of dimensions
	export let margin: any; // Margin object
	export let handleAxesSwapped: Function; // Callback function when axes are swapped
	export let handleInvertAxis: Function; // Callback function when filter is applied
	export let handleCurrentlyFiltering: Function; // Callback function when filtering starts/stops
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	// SVG elements arrays
	let axisLines: any[] = []; // Array of SVG elements for axis groups
	let axisTitles: any[] = []; // Array of SVG elements for axis titles
	let axisFilterBackgrounds: any[] = []; // Array of SVG elements for axis filter backgrounds
	let axisFilterRectangles: any[] = []; // Array of SVG elements for axis filter rectangles
	let axisInvertIcons: any[] = []; // Array of SVG elements for axis invert icons

	let axesFilters: AxesFilter[] = []; // Filter values array for linking

	// Remove all axes elements and drag handlers
	function clearSVG() {
		axisLines = [];
		axisTitles = [];
		axisFilterBackgrounds = [];
		axisFilterRectangles = [];
		axisInvertIcons = [];

		const svg = select('#parcoord-canvas-axes');
		svg.selectAll('.y-axis').remove();
		svg.selectAll('.axis-title').remove();
		svg.selectAll('.axis-filter-background').remove();
		svg.selectAll('.axis-filter').remove();
		svg.selectAll('.axis-invert').remove();
	}

	// Draw axes elements
	function renderAxes() {
		if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;

		const svg = select('#parcoord-canvas-axes');

		// Create SVG elements of axes and axes titles
		dimensions.forEach((dim: string, i: number) => {
			const axis = axisLeft(yScales[dim]).ticks(5);

			// Create axis lines SVG
			axisLines.push(
				svg
					.append('g')
					.attr('class', 'y-axis')
					.attr('transform', `translate(${xScales[i]}, ${margin.top})`)
					.call(axis)
			);

			// Create filter background rectangles SVG
			axisFilterBackgrounds.push(
				svg
					.append('rect')
					.attr('class', 'axis-filter-background')
					.attr('width', 40)
					.attr('height', height - margin.top - margin.bottom)
					.attr('fill', 'rgba(255, 255, 255, 0)')
					.attr('cursor', 'crosshair')
					.attr('transform', `translate(${xScales[i] - 20}, ${margin.top})`)
			);

			// Create filter rectangles SVG
			axisFilterRectangles.push(
				svg
					.append('rect')
					.attr('class', 'axis-filter cursor-move')
					.attr('cursor', 'crosshair')
					.attr('width', 40)
					.attr(
						'height',
						axesFilters[i]?.pixels ? axesFilters[i].pixels.end - axesFilters[i].pixels.start : 0
					)
					.attr('y', axesFilters[i]?.pixels ? margin.top + axesFilters[i].pixels.start : 0)
					.attr('fill', 'rgba(255, 255, 255, 0)')
					.attr('stroke', 'rgba(0, 0, 0, 1)')
					.attr('transform', `translate(${xScales[i] - 20}, 0)`)
			);

			// Create axis titles SVG
			axisTitles.push(
				svg
					.append('text')
					.attr('class', 'axis-title cursor-grab')
					.attr('transform', `translate(${xScales[i]}, ${margin.top - 20})`)
					.style('text-anchor', 'middle')
					.style('font-size', '10px')
					.text(dim)
			);

			// Create axis invert icons SVG
			const triangle = symbol().type(symbolTriangle).size(25);
			axisInvertIcons.push(
				svg
					.append('path')
					.attr('class', 'axis-invert cursor-pointer')
					.attr('transform', `translate(${xScales[i]}, ${margin.top - 10}) rotate(180)`)
					.attr('d', triangle)
					.on('click', () => handleOnInvertAxesClick(dim, i))
			);
		});

		handleAxesDragging();
		handleFilterDrawing();
		handleFilterDragging();
	}

	// Handle dragging and swapping of axes
	function handleAxesDragging() {
		let draggingIndex = -1; // Index of currently dragged axis

		dimensions.forEach((dim: string) => {
			// Add drag behavior to the axis title
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.subject(() => ({ x: xScales[dimensions.indexOf(dim)], y: margin.top - 20 })) // Set initial position
				.on('start', (event) => {
					draggingIndex = dimensions.indexOf(dim);
					event.subject.x = xScales[dimensions.indexOf(dim)];
					axisTitles[dimensions.indexOf(dim)].attr('class', 'axis-title cursor-grabbing');
				})
				.on('drag', (event) => {
					const newX = event.x;

					// Move dragged axis
					axisLines[draggingIndex].attr('transform', `translate(${newX}, ${margin.top})`);
					axisTitles[draggingIndex].attr('transform', `translate(${newX}, ${margin.top - 20})`);
					axisFilterBackgrounds[draggingIndex].attr(
						'transform',
						`translate(${newX - 20}, ${margin.top})`
					);
					axisFilterRectangles[draggingIndex].attr('transform', `translate(${newX - 20}, 0)`);
					axisInvertIcons[draggingIndex].attr(
						'transform',
						`translate(${newX}, ${margin.top - 10}) rotate(180)`
					);

					// Set new index for swapping if needed
					let newIndex = draggingIndex;
					if (newX < xScales[draggingIndex - 1]) newIndex--;
					else if (newX > xScales[draggingIndex + 1]) newIndex++;

					// Handle swapping axes
					if (newIndex !== draggingIndex) {
						handleAxesSwapped(draggingIndex, newIndex);
						axisLines[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex]}, ${margin.top})`
						);
						axisTitles[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex]}, ${margin.top - 20})`
						);
						axisFilterBackgrounds[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 20}, ${margin.top})`
						);
						axisFilterRectangles[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 20}, 0)`
						);
						axisInvertIcons[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex]}, ${margin.top - 10}) rotate(180)`
						);
						dimensions = reorderArray(dimensions, draggingIndex, newIndex);
						axisLines = reorderArray(axisLines, draggingIndex, newIndex);
						axisTitles = reorderArray(axisTitles, draggingIndex, newIndex);
						axisFilterBackgrounds = reorderArray(axisFilterBackgrounds, draggingIndex, newIndex);
						axisFilterRectangles = reorderArray(axisFilterRectangles, draggingIndex, newIndex);
						axisInvertIcons = reorderArray(axisInvertIcons, draggingIndex, newIndex);
						axesFilters = reorderArray(axesFilters, draggingIndex, newIndex);
						draggingIndex = newIndex;
					}
				})
				.on('end', () => {
					// Snap elements into correct place
					axisLines[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex]}, ${margin.top})`
					);
					axisTitles[draggingIndex]
						.attr('transform', `translate(${xScales[draggingIndex]}, ${margin.top - 20})`)
						.attr('class', 'axis-title cursor-grab');
					axisFilterBackgrounds[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] - 20}, ${margin.top})`
					);
					axisFilterRectangles[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] - 20}, 0)`
					);
					axisInvertIcons[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex]}, ${margin.top - 10}) rotate(180)`
					);
					draggingIndex = -1;
				});

			axisTitles[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	// Handle drawing of the filter rectangle
	function handleFilterDrawing() {
		dimensions.forEach((dim: string) => {
			let currentAxis = -1;
			let filterStart = 0; // Starting position of filter
			// Add drag behavior to filter data
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {
					currentAxis = dimensions.indexOf(dim);
					filterStart = event.y;
					handleCurrentlyFiltering(true);
				})
				.on('drag', (event) => {
					if (currentAxis === -1) return;
					const minY = margin.top; // Minimum y position
					const maxY = height - margin.bottom; // Maximum y position
					const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range
					const deltaY = newY - filterStart;
					const filterHeight = Math.abs(deltaY);

					axisFilterRectangles[currentAxis]
						.attr('y', deltaY > 0 ? filterStart : newY)
						.attr('height', filterHeight); // Update or create the filter rectangle

					axesFilters[currentAxis].pixels = {
						start: (deltaY > 0 ? filterStart : newY) - margin.top - 1,
						end: (deltaY > 0 ? filterStart : newY) + filterHeight - margin.bottom + 1
					};
					axesFilters[currentAxis].values = {
						start: yScales[dim].invert(axesFilters[currentAxis].pixels?.start),
						end: yScales[dim].invert(axesFilters[currentAxis].pixels?.end)
					};

					filtersArray.set(axesFilters);
				})
				.on('end', () => {
					currentAxis = -1;
					handleCurrentlyFiltering(false);
				});

			axisFilterBackgrounds[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	// Handle dragging of the filter rectangle
	function handleFilterDragging() {
		dimensions.forEach((dim: string, i: number) => {
			let startY = 0;
			let rectangleStart: number;
			// Add drag behavior to the axis title
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {
					startY = event.y;
					rectangleStart = +axisFilterRectangles[i].attr('y');
					handleCurrentlyFiltering(true);
				})
				.on('drag', (event) => {
					let newY = rectangleStart + (event.y - startY);
					let filterHeight = +axisFilterRectangles[i].attr('height');
					if (newY <= margin.top) newY = margin.top - 1;
					else if (newY + filterHeight >= height - margin.bottom + 1)
						newY = height - filterHeight - margin.bottom + 1;

					axisFilterRectangles[i].attr('y', `${newY}`); // Move filter rectangle

					// Update axesFilters
					axesFilters[i].pixels = {
						start: newY - margin.top,
						end: newY + filterHeight - margin.top
					};
					axesFilters[i].values = {
						start: yScales[dim].invert(axesFilters[i].pixels?.start),
						end: yScales[dim].invert(axesFilters[i].pixels?.end)
					};
					filtersArray.set(axesFilters);
				})
				.on('end', () => {
					startY = 0;
					handleCurrentlyFiltering(false);
				});

			axisFilterRectangles[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	// Handle click on invert
	function handleOnInvertAxesClick(dim: string, i: number) {
		handleInvertAxis(i); // Handle inverting axes in parent component

		// Swap filter rectangle start and end
		const temp = axesFilters[i].values.end;
		axesFilters[i].values.end = axesFilters[i].values.start;
		axesFilters[i].values.start = temp;
		axesFilters[i].pixels.start = yScales[dim](axesFilters[i].values.start);
		axesFilters[i].pixels.end = yScales[dim](axesFilters[i].values.end);

		// Set timeout for correct rendering
		setTimeout(() => {
			axisFilterRectangles[i].attr('y', margin.top + yScales[dim](axesFilters[i].values.start)); // Update or create the filter rectangle
		}, 10);
	}

	// Helper function to reorder an array
	function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
		const result = [...arr];
		const [removed] = result.splice(fromIndex, 1);
		result.splice(toIndex, 0, removed);
		return result;
	}

	onMount(() => {
		axesFilters = dimensions.map(() => ({ pixels: null, values: null }));
	});

	afterUpdate(() => {
		clearSVG();
		renderAxes();

		// Resize axes filter rectangles
		dimensions.forEach((dim: string, i: number) => {
			if (axesFilters[i].pixels === null || axesFilters[i].values === null) return;
			axesFilters[i].pixels = {
				start: yScales[dim](axesFilters[i].values.start),
				end: yScales[dim](axesFilters[i].values.end)
			};
			axisFilterRectangles[i]
				.attr('y', margin.top + axesFilters[i].pixels.start)
				.attr('height', axesFilters[i].pixels.end - axesFilters[i].pixels.start); // Update or create the filter rectangle
		});
	});
</script>

<svg
	id="parcoord-canvas-axes"
	width={width < 100 * dimensions.length ? dimensions.length * 100 : width}
	{height}
	style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 2;"
/>
