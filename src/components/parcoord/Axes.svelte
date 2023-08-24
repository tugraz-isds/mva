<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { axisLeft, select, drag } from 'd3';

	export let width: number = 0;
	export let height: number = 0;
	export let initialDimensions: string[] = []; // Initial order of dimensions
	export let margin: any;
	export let handleAxesSwapped: Function; // Callback function when axes are swapped
	export let handleFiltering: Function; // Callback function when filter is applied
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	let dimensions: string[]; // Dimensions used for swapping
	let axisLines: any[] = []; // Array of SVG elements for axis groups
	let axisTitles: any[] = []; // Array of SVG elements for axis titles
	let axisFilterBackgrounds: any[] = []; // Array of SVG elements for axis filter backgrounds
	let axisFilterRectangles: any[] = []; // Array of SVG elements for axis filter rectangles

	// Remove all axes elements and drag handlers
	function clearSVG() {
		axisLines = [];
		axisTitles = [];
		axisFilterBackgrounds = [];
		axisFilterRectangles = [];

		const svg = select('#parcoord-canvas-axes');
		svg.selectAll('.y-axis').remove();
		svg.selectAll('.axis-title').remove();
		svg.selectAll('.axis-filter-background').remove();
		svg.selectAll('.axis-filter').remove();
	}

	// Draw axes elements
	function renderAxes() {
		if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;

		const svg = select('#parcoord-canvas-axes');

		// Create SVG elements of axes and axes titles
		dimensions.forEach((dim: string, i: number) => {
			const axis = axisLeft(yScales[dim]).ticks(0);

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
					.attr('class', 'axis-filter')
					.attr('cursor', 'crosshair')
					.attr('width', 40)
					.attr('height', 0)
					.attr('fill', 'rgba(255, 255, 255, 0)')
					.attr('stroke', 'rgba(0, 0, 0, 1)')
					.attr('transform', `translate(${xScales[i] - 20}, 0)`)
			);

			// Create axis titles SVG
			axisTitles.push(
				svg
					.append('text')
					.attr('class', 'axis-title cursor-grab')
					.attr('transform', `translate(${xScales[i]}, ${margin.top - 10})`)
					.style('text-anchor', 'middle')
					.style('font-size', '10px')
					.text(dim)
			);
		});

		handleAxesDragging();
		handleFilterDragging();
	}

	// Handle dragging and swapping of axes
	function handleAxesDragging() {
		let draggingIndex = -1; // Index of currently dragged axis

		dimensions.forEach((dim: string) => {
			// Add drag behavior to the axis title
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.subject(() => ({ x: xScales[dimensions.indexOf(dim)], y: margin.top - 10 })) // Set initial position
				.on('start', (event) => {
					draggingIndex = dimensions.indexOf(dim);
					event.subject.x = xScales[dimensions.indexOf(dim)];
					axisTitles[dimensions.indexOf(dim)].attr('class', 'axis-title cursor-grabbing');
				})
				.on('drag', (event) => {
					const newX = event.x;

					// Move dragged axis
					axisLines[draggingIndex].attr('transform', `translate(${newX}, ${margin.top})`);
					axisTitles[draggingIndex].attr('transform', `translate(${newX}, ${margin.top - 10})`);
					axisFilterBackgrounds[draggingIndex].attr(
						'transform',
						`translate(${newX - 20}, ${margin.top})`
					);
					axisFilterRectangles[draggingIndex].attr('transform', `translate(${newX - 20}, 0)`);

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
							`translate(${xScales[draggingIndex]}, ${margin.top - 10})`
						);
						axisFilterBackgrounds[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 20}, ${margin.top})`
						);
						axisFilterRectangles[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 20}, 0)`
						);
						dimensions = reorderArray(dimensions, draggingIndex, newIndex);
						axisLines = reorderArray(axisLines, draggingIndex, newIndex);
						axisTitles = reorderArray(axisTitles, draggingIndex, newIndex);
						axisFilterBackgrounds = reorderArray(axisFilterBackgrounds, draggingIndex, newIndex);
						axisFilterRectangles = reorderArray(axisFilterRectangles, draggingIndex, newIndex);
						draggingIndex = newIndex;
					}
				})
				.on('end', () => {
					axisLines[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex]}, ${margin.top})`
					);
					axisTitles[draggingIndex]
						.attr('transform', `translate(${xScales[draggingIndex]}, ${margin.top - 10})`)
						.attr('class', 'axis-title cursor-grab');
					axisFilterBackgrounds[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] - 20}, ${margin.top})`
					);
					axisFilterRectangles[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] - 20}, 0)`
					);
					draggingIndex = -1;
				});

			axisTitles[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	function handleFilterDragging() {
		dimensions.forEach((dim: string) => {
			let currentAxis = -1;
			let filterStart = 0; // Starting position of filter
			// Add drag behavior to filter data
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {
					// Start filtering
					currentAxis = dimensions.indexOf(dim);
					filterStart = event.y;
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

					handleFiltering(
						currentAxis,
						(deltaY > 0 ? filterStart : newY) - margin.top - 1,
						(deltaY > 0 ? filterStart : newY) + filterHeight - margin.top + 1
					);
				})
				.on('end', () => {
					currentAxis = -1;
				});

			axisFilterBackgrounds[dimensions.indexOf(dim)].call(dragBehavior);
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
		dimensions = initialDimensions;
	});

	afterUpdate(() => {
		dimensions = initialDimensions;
		clearSVG();
		renderAxes();
	});
</script>

<svg
	id="parcoord-canvas-axes"
	width={width < 100 * initialDimensions.length ? initialDimensions.length * 100 : width}
	{height}
	style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 2;"
/>
