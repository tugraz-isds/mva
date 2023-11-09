<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { axisLeft, select, drag } from 'd3';
	import { filtersArray } from '../../stores/parcoord';
	import { arrowDown, arrowUp } from './ArrowIcons';
	import { calculateMaxLength, getLongestStringLen, getTextWidth } from '../../util/text';
	import type { AxesFilterType } from './types';

	export let width: number; // Container width
	export let height: number; // Container height
	export let dimensions: string[] = []; // Initial order of dimensions
	export let margin: any; // Margin object
	export let handleAxesSwapped: Function; // Callback function when axes are swapped
	export let handleInvertAxis: Function; // Callback function when filter is applied
	export let setTooltipAxisTitleData: Function; // Callback function for tooltip
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	// SVG elements arrays
	let axisLines: any[] = []; // Array of SVG elements for axis groups
	let axisTitles: any[] = []; // Array of SVG elements for axis titles
	let axisInvertIcons: any[] = []; // Array of SVG elements for axis invert icons
	let axisUpperFilters: any = []; // Array of SVG elements for axis upper filters
	let axisLowerFilters: any = []; // Array of SVG elements for axis lower filters
	let axisFilterRectangles: any[] = []; // Array of SVG elements for axis filter rectangles
	let axisHeight: number; // Actual axis height in pixels

	let axesFilters: AxesFilterType[] = []; // Filter values array for linking
	let invertedAxes: boolean[] = []; // Filter of inverted axes, needed to display correct icons

	$: axisHeight = height - margin.top - margin.bottom;

	// Remove all axes elements and drag handlers
	function clearSVG() {
		axisLines = [];
		axisTitles = [];
		axisInvertIcons = [];
		axisUpperFilters = [];
		axisLowerFilters = [];
		axisFilterRectangles = [];

		const svg = select('#parcoord-canvas-axes');
		svg.selectAll('.y-axis').remove();
		svg.selectAll('.axis-title').remove();
		svg.selectAll('.axis-invert').remove();
		svg.selectAll('.axis-filter-upper').remove();
		svg.selectAll('.axis-filter-lower').remove();
		svg.selectAll('.axis-filter-rect').remove();
	}

	// Draw axes elements
	function renderAxes() {
		if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;

		const svg = select('#parcoord-canvas-axes');

		// Create SVG elements of axes and axes titles
		dimensions.forEach((dim: string, i: number) => {
			const step = xScales[1] - xScales[0];

			// Format ticks so they dont overflow
			const longestString = getLongestStringLen(yScales[dim].domain());
			const maxTickLength = calculateMaxLength(longestString, 12, 'Roboto', step);
			const tickFormatter = (d: any) => {
				let formattedTick = d.toString();
				formattedTick =
					formattedTick.substring(0, maxTickLength) +
					(formattedTick.length === maxTickLength ? '' : '...');
				return formattedTick;
			};

			// Create axis objects
			let axis;
			if (yScales[dim].invert) axis = axisLeft(yScales[dim]).ticks(5);
			else {
				axis = axisLeft(yScales[dim]);
				const domainValues = yScales[dim].domain();
				const tickNumber = axisHeight / 10; // Height in pixels divided by font size 10px
				const step = Math.ceil(domainValues.length / tickNumber);
				const tickValues = domainValues.filter((_: any, index: number) => index % step === 0);
				axis.tickValues(tickValues).tickFormat(tickFormatter);
			}

			// Create axis lines SVG
			axisLines.push(
				svg
					.append('g')
					.attr('class', 'y-axis')
					.attr('transform', `translate(${xScales[i]}, ${margin.top})`)
					.call(axis)
			);

			// Create axis titles SVG
			const maxTitleLength = calculateMaxLength(dim, 10, 'Roboto', step);
			axisTitles.push(
				svg
					.append('text')
					.attr('class', `axis-title`)
					.attr('transform', `translate(${xScales[i]}, ${margin.top - 30})`)
					.style('text-anchor', 'middle')
					.style('font-size', '10px')
					.style('cursor', `url("arrows-right-left.svg") 9 9, auto`)
					.text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'))
					.on('mouseenter', () => showCustomTooltip(dim, i))
					.on('mouseleave', hideCustomTooltip)
			);

			// Create axis invert icons SVG
			axisInvertIcons.push(
				svg
					.append('g')
					.attr('class', 'axis-invert cursor-pointer')
					.html(
						yScales[dim].invert
							? invertedAxes[i]
								? arrowDown
								: arrowUp
							: invertedAxes[i]
							? arrowUp
							: arrowDown
					)
					.attr('transform', `translate(${xScales[i] - 8}, ${margin.top - 28})`)
					.style('cursor', `url("arrows-invert.svg") 9 9, auto`)
					.on('click', () => handleOnInvertAxesClick(dim, i))
			);

			// Create axis upper filter
			const trianglePoints = [
				{ x: 0, y: 0 },
				{ x: 8, y: 8 },
				{ x: 16, y: 0 }
			];
			axisUpperFilters.push(
				svg
					.append('path')
					.attr('class', 'axis-filter-upper')
					.attr(
						'd',
						`M${trianglePoints[0].x},${trianglePoints[0].y} L${trianglePoints[1].x},${trianglePoints[1].y} L${trianglePoints[2].x},${trianglePoints[2].y} Z`
					)
					.attr(
						'transform',
						`translate(${xScales[i] - 8}, ${axesFilters[i].pixels.start + margin.top - 8})`
					)
					.attr('fill', 'black')
					.style('cursor', `url("arrow-filter-down.svg") 9 9, auto`)
			);

			// Create axis lower filter
			axisLowerFilters.push(
				svg
					.append('path')
					.attr('class', 'axis-filter-lower')
					.attr(
						'd',
						`M${trianglePoints[0].x},${trianglePoints[0].y} L${trianglePoints[1].x},${trianglePoints[1].y} L${trianglePoints[2].x},${trianglePoints[2].y} Z`
					)
					.attr(
						'transform',
						`translate(${xScales[i] + 8}, ${
							axesFilters[i].pixels.end + margin.top + 8
						}) rotate(180)`
					)
					.attr('fill', 'black')
					.style('cursor', `url("arrow-filter-up.svg") 9 9, auto`)
			);

			// Create filter rectangles SVG
			axisFilterRectangles.push(
				svg
					.append('rect')
					.attr('class', 'axis-filter-rect')
					.attr('cursor', 'crosshair')
					.attr('width', 12)
					.attr('height', axesFilters[i].pixels.end - axesFilters[i].pixels.start)
					.attr('y', margin.top + axesFilters[i].pixels.start)
					.attr('fill', 'rgba(255, 255, 100, 0.2)')
					.attr('stroke', 'rgba(0, 0, 0, 0.25)')
					.attr('transform', `translate(${xScales[i] - 6}, 0)`)
					.style('cursor', `url("arrow-filter-up-down.svg") 9 9, auto`)
			);
		});

		handleAxesDragging();
		handleFilterRectDragging();
		handleUpperFilterDragging();
		handleLowerFilterDragging();
	}

	function showCustomTooltip(axisTitle: string, axisIndex: number) {
		setTooltipAxisTitleData({
			visible: true,
			xPos: xScales[axisIndex],
			yPos: margin.top - 20,
			text: axisTitle
		});
	}

	function hideCustomTooltip() {
		setTooltipAxisTitleData({
			visible: false,
			xPos: 0,
			yPos: 0,
			text: ''
		});
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
				})
				.on('drag', (event) => {
					const newX = event.x;

					// Move dragged axis
					axisLines[draggingIndex].attr('transform', `translate(${newX}, ${margin.top})`);
					axisTitles[draggingIndex].attr('transform', `translate(${newX}, ${margin.top - 30})`);
					axisInvertIcons[draggingIndex].attr(
						'transform',
						`translate(${newX - 8}, ${margin.top - 28})`
					);
					axisUpperFilters[draggingIndex].attr(
						'transform',
						`translate(${newX - 8}, ${axesFilters[draggingIndex].pixels.start + margin.top - 8})`
					);
					axisLowerFilters[draggingIndex].attr(
						'transform',
						`translate(${newX + 8}, ${
							axesFilters[draggingIndex].pixels.end + margin.top + 8
						}) rotate(180)`
					);
					axisFilterRectangles[draggingIndex].attr('transform', `translate(${newX - 6}, 0)`);

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
							`translate(${xScales[draggingIndex]}, ${margin.top - 30})`
						);
						axisInvertIcons[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 8}, ${margin.top - 28})`
						);
						axisUpperFilters[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 8}, ${
								axesFilters[draggingIndex].pixels.start + margin.top - 8
							})`
						);
						axisLowerFilters[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] + 8}, ${
								axesFilters[draggingIndex].pixels.end + margin.top + 8
							}) rotate(180)`
						);
						axisFilterRectangles[newIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 6}, 0)`
						);
						dimensions = reorderArray(dimensions, draggingIndex, newIndex);
						axisLines = reorderArray(axisLines, draggingIndex, newIndex);
						axisTitles = reorderArray(axisTitles, draggingIndex, newIndex);
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
					axisTitles[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex]}, ${margin.top - 30})`
					);
					axisInvertIcons[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] - 8}, ${margin.top - 28})`
					);
					axisUpperFilters[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] - 8}, ${
							axesFilters[draggingIndex].pixels.start + margin.top - 8
						})`
					);
					axisLowerFilters[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] + 8}, ${
							axesFilters[draggingIndex].pixels.end + margin.top + 8
						}) rotate(180)`
					);
					axisFilterRectangles[draggingIndex].attr(
						'transform',
						`translate(${xScales[draggingIndex] - 6}, 0)`
					);
					draggingIndex = -1;
				});

			axisTitles[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	function handleUpperFilterDragging() {
		dimensions.forEach((dim: string, idx: number) => {
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {})
				.on('drag', (event) => {
					const minY = margin.top - 8; // Minimum y position
					const maxY = axesFilters[idx].pixels.end + margin.top - 8; // Maximum y position
					const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

					axisUpperFilters[idx].attr('transform', `translate(${xScales[idx] - 8}, ${newY})`); // Move upper filter
					axisFilterRectangles[idx]
						.attr('y', `${newY + 8}`)
						.attr('height', `${axesFilters[idx].pixels.end - newY + margin.top - 8}`); // Move filter rectangle

					axesFilters[idx].pixels.start = newY - margin.top - 1 + 8;
					axesFilters[idx].percentages.start = axesFilters[idx].pixels.start / axisHeight;
					filtersArray.set(axesFilters);
				})
				.on('end', () => {});

			axisUpperFilters[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	function handleLowerFilterDragging() {
		dimensions.forEach((dim: string, idx: number) => {
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {})
				.on('drag', (event) => {
					const minY = axesFilters[idx].pixels.start + margin.top; // Minimum y position
					const maxY = height - margin.bottom; // Maximum y position
					const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

					axisLowerFilters[idx].attr(
						'transform',
						`translate(${xScales[idx] + 8}, ${newY + 8}) rotate(180)`
					); // Move upper filter
					axisFilterRectangles[idx].attr(
						'height',
						`${newY - axesFilters[idx].pixels.start - margin.top}`
					); // Move filter rectangle

					axesFilters[idx].pixels.end = newY - margin.top;
					axesFilters[idx].percentages.end = axesFilters[idx].pixels.end / axisHeight;
					filtersArray.set(axesFilters);
				})
				.on('end', () => {});

			axisLowerFilters[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	// Handle dragging of the filter rectangle
	function handleFilterRectDragging() {
		dimensions.forEach((dim: string, i: number) => {
			let startY = 0;
			let rectangleStart: number;
			// Add drag behavior to the axis title
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {
					startY = event.y;
					rectangleStart = +axisFilterRectangles[i].attr('y');
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
					axesFilters[i].percentages = {
						start: axesFilters[i].pixels.start / axisHeight,
						end: axesFilters[i].pixels.end / axisHeight
					};
					filtersArray.set(axesFilters);

					// Update axis upper and lower filters
					axisUpperFilters[i].attr(
						'transform',
						`translate(${xScales[i] - 8}, ${axesFilters[i].pixels.start + margin.top - 8})`
					);
					axisLowerFilters[i].attr(
						'transform',
						`translate(${xScales[i] + 8}, ${
							axesFilters[i].pixels.end + margin.top + 8
						}) rotate(180)`
					);
				})
				.on('end', () => {
					startY = 0;
				});

			axisFilterRectangles[dimensions.indexOf(dim)].call(dragBehavior);
		});
	}

	// Handle click on invert
	function handleOnInvertAxesClick(dim: string, i: number) {
		handleInvertAxis(i); // Handle inverting axes in parent component

		// Swap filter rectangle start and end
		const temp = axesFilters[i].pixels.end;
		axesFilters[i].pixels.end = axisHeight - axesFilters[i].pixels.start;
		axesFilters[i].pixels.start = axisHeight - temp;
		axesFilters[i].percentages.start = axesFilters[i].pixels.start / axisHeight;
		axesFilters[i].percentages.end = axesFilters[i].pixels.end / axisHeight;

		// Set timeout for correct rendering
		setTimeout(() => {
			axisFilterRectangles[i].attr('y', margin.top + axesFilters[i].pixels.start); // Update the filter rectangle

			// Rotate arrow
			invertedAxes[i] = !invertedAxes[i];
			axisInvertIcons[i].html(
				yScales[dim].invert
					? invertedAxes[i]
						? arrowDown
						: arrowUp
					: invertedAxes[i]
					? arrowUp
					: arrowDown
			);
		}, 10);
	}

	// Helper function to reorder an array
	function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
		const result = [...arr];
		const [removed] = result.splice(fromIndex, 1);
		result.splice(toIndex, 0, removed);
		return result;
	}

	// Function to initialize axis filter values
	function initAxesFilters() {
		axesFilters = dimensions.map((dim: string, i: number) => ({
			pixels: {
				start: 0,
				end: axisHeight
			},
			percentages: {
				start: 0,
				end: 1
			}
		}));

		filtersArray.set(axesFilters);

		invertedAxes = Array(dimensions.length).fill(false);
	}

	// Function to resize axes filters
	function resizeFilters() {
		dimensions.forEach((dim: string, i: number) => {
			// Calculate new pixel values
			axesFilters[i].pixels = {
				start: axesFilters[i].percentages.start * axisHeight,
				end: axesFilters[i].percentages.end * axisHeight
			};
		});
	}

	// Save axes to SVG
	export const saveSVG = () => {
		const svgElement = document.getElementById('parcoord-canvas-axes');
		const serializer = new XMLSerializer();
		if (!svgElement) return;
		return serializer.serializeToString(svgElement);
	};

	onMount(() => {
		initAxesFilters();
		setTimeout(() => {
			dimensions.forEach((dim: string, i: number) => {
				if (!yScales[dim].invert) handleOnInvertAxesClick(dim, i);
			});
		}, 5);
	});

	afterUpdate(() => {
		if (axesFilters.length !== dimensions.length) {
			initAxesFilters();
			setTimeout(() => {
				dimensions.forEach((dim: string, i: number) => {
					if (!yScales[dim].invert) handleOnInvertAxesClick(dim, i);
				});
			}, 5);
		}
		clearSVG();
		renderAxes();
		resizeFilters();
	});
</script>

<svg
	id="parcoord-canvas-axes"
	width={width < 100 * dimensions.length ? dimensions.length * 100 : width}
	{height}
	style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 2;"
/>
