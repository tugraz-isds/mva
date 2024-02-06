<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { axisLeft, select, drag, text } from 'd3';
	import { filtersArray, parcoordDimMetadata, parcoordIsInteractable } from '../../stores/parcoord';
	import { dimensionDataStore } from '../../stores/dataset';
	import { calculateMaxLength, getLongestStringLen, getTextWidth } from '../../util/text';
	import { getAllTicks, reorderArray } from '../../util/util';
	import type ContextMenuAxes from './ContextMenuAxes.svelte';
	import type { AxesFilterType, DimensionMetadataType } from './types';
	import type { MarginType } from '../../util/types';

	export let width: number; // Container width
	export let contextMenuAxes: ContextMenuAxes;
	export let height: number; // Container height
	export let dimensions: string[] = []; // Initial order of dimensions
	export let margin: MarginType; // Margin object
	export let handleAxesSwapped: Function; // Callback function when axes are swapped
	export let handleInvertAxis: Function; // Callback function when filter is applied
	export let handleMarginChanged: Function; // Callback function when margin changes
	export let setTooltipAxisTitleData: Function; // Callback function for tooltip
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	// SVG elements
	let axisLines: any[] = []; // Array of SVG elements for axis groups
	let axisTitles: any[] = []; // Array of SVG elements for axis titles
	let axisInvertIcons: any[] = []; // Array of SVG elements for axis invert icons
	let axisUpperFilters: any = []; // Array of SVG elements for axis upper filters
	let axisUpperFiltersValues: any = []; // Array of SVG elements for axis upper filters values
	let axisLowerFilters: any = []; // Array of SVG elements for axis lower filters
	let axisLowerFiltersValues: any = []; // Array of SVG elements for axis lower filters values
	let axisFilterRectangles: any[] = []; // Array of SVG elements for axis filter rectangles
	let filterArrowDown: string,
		filterArrowUp: string,
		invertArrowDown: string,
		invertArrowUp: string;
	let iconsRead: boolean = false;

	let axisHeight: number; // Actual axis height in pixels
	let axesFilters: AxesFilterType[] = []; // Filter values array for linking
	let isCurrentlyFiltering: boolean = false; // Is user currently filtering flag

	$: axisHeight = height - margin.top - margin.bottom;

	let dimensionsMetadata: Map<string, DimensionMetadataType>;
	const unsubscribeDimData = parcoordDimMetadata.subscribe(
		(value: Map<string, DimensionMetadataType>) => {
			if (axesFilters.length > 0) {
				dimensionsMetadata = value;
				clearSVG();
				renderAxes();
				// console.log('1');
				// calculateMarginLeft();
			}
		}
	);

	// Remove all axes elements and drag handlers
	export function clearSVG() {
		axisLines = [];
		axisTitles = [];
		axisInvertIcons = [];
		axisUpperFilters = [];
		axisUpperFiltersValues = [];
		axisLowerFilters = [];
		axisLowerFiltersValues = [];
		axisFilterRectangles = [];

		const svg = select('#parcoord-canvas-axes');
		svg.selectAll('.y-axis').remove();
		svg.selectAll('.axis-title').remove();
		svg.selectAll('.axis-invert').remove();
		svg.selectAll('.axis-filter-upper').remove();
		svg.selectAll('.axis-filter-upper-value').remove();
		svg.selectAll('.axis-filter-lower').remove();
		svg.selectAll('.axis-filter-lower-value').remove();
		svg.selectAll('.axis-filter-rect').remove();
	}

	// Draw axes elements
	export function renderAxes(newWidth: number | undefined = undefined) {
		if (!dimensions || xScales?.length === 0 || yScales?.length === 0 || !iconsRead) return;

		if (newWidth) width = newWidth;

		const svg = select('#parcoord-canvas-axes');

		// Create SVG elements of axes and axes titles
		dimensions.forEach((dim: string, i: number) => {
			const step = xScales[1] - xScales[0];
			// Format ticks so they dont overflow
			const longestString = getLongestStringLen(yScales[dim].domain());
			const maxTickLength = calculateMaxLength(longestString, 12, 'Roboto', i === 0 ? 100 : step);
			const tickFormatter = (d: any) => {
				let formattedTick = d.toString();
				formattedTick =
					formattedTick.substring(0, maxTickLength) +
					(formattedTick.length <= maxTickLength ? '' : '...');
				return formattedTick;
			};

			// Create axis objects
			let axis;
			const domainValues = yScales[dim].domain();
			if ($dimensionDataStore.get(dim)?.type === 'numerical') {
				const ticks = yScales[dim].ticks(5);
				getAllTicks(domainValues, ticks);
				axis = axisLeft(yScales[dim]).tickValues(
					dimensionsMetadata.get(dim)?.showLabels ? ticks : []
				);
			} else {
				axis = axisLeft(yScales[dim]);
				const tickNumber = axisHeight / 10; // Height in pixels divided by font size 10px
				const step = Math.ceil(domainValues.length / tickNumber);
				const tickValues = domainValues.filter((_: any, index: number) => index % step === 0);
				axis
					.tickValues(dimensionsMetadata.get(dim)?.showLabels ? tickValues : [])
					.tickFormat(tickFormatter);
			}

			// Create axis lines SVG
			axisLines.push(
				svg
					.append('g')
					.attr('class', 'y-axis')
					.attr('transform', `translate(${xScales[i]}, ${margin.top})`)
					.call(axis)
			);
		});

		dimensions.forEach((dim: string, i: number) => {
			const step = xScales[1] - xScales[0];
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
					.on('mousedown', hideCustomTooltip)
					.on('contextmenu', (e) => contextMenuAxes.showContextMenu(e, i))
			);

			// Create axis invert icons SVG
			axisInvertIcons.push(
				svg
					.append('g')
					.attr('class', 'axis-invert cursor-pointer')
					.html(dimensionsMetadata.get(dim)?.inverted ? invertArrowDown : invertArrowUp)
					.attr('transform', `translate(${xScales[i] - 8}, ${margin.top - 28})`)
					.style(
						'cursor',
						`url(${
							dimensionsMetadata.get(dim)?.inverted
								? 'arrow-curved-up.svg'
								: 'arrow-curved-down.svg'
						}) 9 9, auto`
					)
					.on('click', () => handleOnInvertAxesClick(i))
			);

			if (dimensionsMetadata.get(dim)?.showFilter) {
				axisUpperFilters.push(
					svg
						.append('g')
						.attr('class', 'axis-filter-upper')
						.html(filterArrowDown)
						.attr(
							'transform',
							`translate(${xScales[i] - 6}, ${axesFilters[i].pixels.start + margin.top - 12})`
						)
						.style('cursor', `url("arrow-filter-down-hover.svg") 9 9, auto`)
				);
				if (
					$dimensionDataStore.get(dim)?.type === 'numerical' &&
					dimensionsMetadata.get(dim)?.showFilterValues
				) {
					const upperFilterValue = getAxisDomainValue(i, axesFilters[i].percentages.start);
					const groupUpper = svg
						.append('g')
						.attr('class', 'axis-filter-upper-value')
						.attr(
							'transform',
							`translate(${xScales[i] + 8}, ${axesFilters[i].pixels.start + margin.top - 10})`
						)
						.attr('display', axesFilters[i].percentages.start <= 0 ? 'none' : 'block');
					groupUpper
						.append('rect')
						.attr('class', 'axis-filter-upper-value')
						.attr('width', getTextWidth(upperFilterValue, 10, 'Roboto') + 8)
						.attr('height', 14)
						.attr('fill', 'lightgrey')
						.attr('stroke', 'black');
					groupUpper
						.append('text')
						.style('font-size', '10')
						.attr('text-anchor', 'start')
						.attr('fill', 'black')
						.attr('x', 4)
						.attr('y', 10)
						.text(upperFilterValue);
					axisUpperFiltersValues.push(groupUpper);

					const groupLower = svg
						.append('g')
						.attr('class', 'axis-filter-lower-value')
						.attr(
							'transform',
							`translate(${xScales[i] + 8}, ${axesFilters[i].pixels.end + margin.top - 4})`
						)
						.attr('display', axesFilters[i].percentages.end >= 1 ? 'none' : 'block');
					groupLower
						.append('rect')
						.attr('class', 'axis-filter-lower-value')
						.attr('width', 30)
						.attr('height', 14)
						.attr('fill', 'lightgrey')
						.attr('stroke', 'black');
					groupLower
						.append('text')
						.style('font-size', '10')
						.attr('text-anchor', 'start')
						.attr('fill', 'black')
						.attr('x', 4)
						.attr('y', 10)
						.text(getAxisDomainValue(i, axesFilters[i].percentages.end));
					axisLowerFiltersValues.push(groupLower);
				} else {
					axisUpperFiltersValues.push(null);
					axisLowerFiltersValues.push(null);
				}

				// Create axis lower filter
				axisLowerFilters.push(
					svg
						.append('g')
						.attr('class', 'axis-filter-lower')
						.html(filterArrowUp)
						.attr(
							'transform',
							`translate(${xScales[i] - 6}, ${axesFilters[i].pixels.end + margin.top})`
						)
						.style('cursor', `url("arrow-filter-up-hover.svg") 9 9, auto`)
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
						.style('cursor', `url("arrow-filter-up-down-v2.svg") 9 9, auto`)
				);
			}
		});

		handleAxesDragging();
		handleFilterRectDragging();
		handleUpperFilterDragging();
		handleLowerFilterDragging();
	}

	function showCustomTooltip(axisTitle: string, axisIndex: number) {
		if (isCurrentlyFiltering) return;
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
					parcoordIsInteractable.set(false);
					draggingIndex = dimensions.indexOf(dim);
					event.subject.x = xScales[dimensions.indexOf(dim)];
					isCurrentlyFiltering = true;
				})
				.on('drag', (event) => {
					const minX = margin.left; // Minimum x position
					const maxX = width - margin.right; // Maximum x position
					const newX = Math.max(minX, Math.min(maxX, event.x)); // Clamp the x position within the valid range

					// Move dragged axis
					axisLines[draggingIndex].attr('transform', `translate(${newX}, ${margin.top})`);
					axisTitles[draggingIndex].attr('transform', `translate(${newX}, ${margin.top - 30})`);
					axisInvertIcons[draggingIndex].attr(
						'transform',
						`translate(${newX - 8}, ${margin.top - 28})`
					);
					if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
						axisUpperFilters[draggingIndex].attr(
							'transform',
							`translate(${newX - 6}, ${axesFilters[draggingIndex].pixels.start + margin.top - 12})`
						);
						axisLowerFilters[draggingIndex].attr(
							'transform',
							`translate(${newX - 6}, ${axesFilters[draggingIndex].pixels.end + margin.top})`
						);
						axisFilterRectangles[draggingIndex].attr('transform', `translate(${newX - 6}, 0)`);
					}
					if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilterValues) {
						axisUpperFiltersValues[draggingIndex]?.attr(
							'transform',
							`translate(${newX + 8}, ${axesFilters[draggingIndex].pixels.start + margin.top - 10})`
						);
						axisLowerFiltersValues[draggingIndex]?.attr(
							'transform',
							`translate(${newX + 8}, ${axesFilters[draggingIndex].pixels.end + margin.top - 4})`
						);
					}

					// Set new index for swapping if needed
					let newIndex = draggingIndex;
					if (newX <= xScales[draggingIndex - 1]) newIndex--;
					else if (newX >= xScales[draggingIndex + 1]) newIndex++;

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
						if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
							axisUpperFilters[newIndex].attr(
								'transform',
								`translate(${xScales[draggingIndex] - 6}, ${
									axesFilters[draggingIndex].pixels.start + margin.top - 12
								})`
							);
							axisLowerFilters[newIndex].attr(
								'transform',
								`translate(${xScales[draggingIndex] - 6}, ${
									axesFilters[draggingIndex].pixels.end + margin.top
								})`
							);
							axisFilterRectangles[newIndex].attr(
								'transform',
								`translate(${xScales[draggingIndex] - 6}, 0)`
							);
						}
						if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilterValues) {
							axisUpperFiltersValues[draggingIndex]?.attr(
								'transform',
								`translate(${newX + 8}, ${
									axesFilters[draggingIndex].pixels.start + margin.top - 10
								})`
							);
							axisLowerFiltersValues[newIndex]?.attr(
								'transform',
								`translate(${xScales[draggingIndex] + 8}, ${
									axesFilters[draggingIndex].pixels.end + margin.top - 4
								})`
							);
						}
						dimensions = reorderArray(dimensions, draggingIndex, newIndex);
						axisLines = reorderArray(axisLines, draggingIndex, newIndex);
						axisTitles = reorderArray(axisTitles, draggingIndex, newIndex);
						axisFilterRectangles = reorderArray(axisFilterRectangles, draggingIndex, newIndex);
						axisInvertIcons = reorderArray(axisInvertIcons, draggingIndex, newIndex);
						axesFilters = reorderArray(axesFilters, draggingIndex, newIndex);

						// Calculate new margin left
						if (
							(newIndex === 0 && draggingIndex === 1) ||
							(newIndex === 1 && draggingIndex === 0)
						) {
							calculateMarginLeft();
						}

						draggingIndex = newIndex;
					}
				})
				.on('end', () => {
					parcoordIsInteractable.set(true);
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
					if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
						axisUpperFilters[draggingIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 6}, ${
								axesFilters[draggingIndex].pixels.start + margin.top - 12
							})`
						);
						axisLowerFilters[draggingIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 6}, ${
								axesFilters[draggingIndex].pixels.end + margin.top
							})`
						);
						axisFilterRectangles[draggingIndex].attr(
							'transform',
							`translate(${xScales[draggingIndex] - 6}, 0)`
						);
					}
					if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilterValues) {
						axisUpperFiltersValues[draggingIndex]?.attr(
							'transform',
							`translate(${xScales[draggingIndex] + 8}, ${
								axesFilters[draggingIndex].pixels.start + margin.top - 10
							})`
						);
						axisLowerFiltersValues[draggingIndex]?.attr(
							'transform',
							`translate(${xScales[draggingIndex] + 8}, ${
								axesFilters[draggingIndex].pixels.end + margin.top - 4
							})`
						);
					}
					draggingIndex = -1;
					isCurrentlyFiltering = false;
				});

			axisTitles[dimensions.indexOf(dim)]?.call(dragBehavior);
		});
	}

	function getAxisDomainValue(i: number, percentage: number) {
		const axisDomain = yScales[dimensions[i]].domain();
		const axisRange = axisDomain[1] - axisDomain[0];
		return (axisDomain[0] + (1 - percentage) * axisRange).toFixed(2);
	}

	function handleUpperFilterDragging() {
		dimensions.forEach((dim: string, idx: number) => {
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {
					parcoordIsInteractable.set(false);
				})
				.on('drag', (event) => {
					const minY = margin.top - 8; // Minimum y position
					const maxY = axesFilters[idx].pixels.end + margin.top - 8; // Maximum y position
					const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

					axisUpperFilters[idx].attr('transform', `translate(${xScales[idx] - 6}, ${newY - 4})`); // Move upper filter
					axisUpperFiltersValues[idx]
						?.attr('transform', `translate(${xScales[idx] + 8}, ${newY - 2})`)
						.style('display', axesFilters[idx].percentages.start <= 0 ? 'none' : 'block');
					axisUpperFiltersValues[idx]
						?.select('text')
						.text(getAxisDomainValue(idx, axesFilters[idx].percentages.start));
					axisFilterRectangles[idx]
						.attr('y', `${newY + 8}`)
						.attr('height', `${axesFilters[idx].pixels.end - newY + margin.top - 8}`); // Move filter rectangle

					axesFilters[idx].pixels.start = newY - margin.top - 1 + 8;
					axesFilters[idx].percentages.start = axesFilters[idx].pixels.start / axisHeight;
					filtersArray.set(axesFilters);
				})
				.on('end', () => {
					parcoordIsInteractable.set(true);
				});

			axisUpperFilters[dimensions.indexOf(dim)]?.call(dragBehavior);
		});
	}

	function handleLowerFilterDragging() {
		dimensions.forEach((dim: string, idx: number) => {
			const dragBehavior = drag<SVGTextElement, unknown, any>()
				.on('start', (event) => {
					parcoordIsInteractable.set(false);
				})
				.on('drag', (event) => {
					const minY = axesFilters[idx].pixels.start + margin.top; // Minimum y position
					const maxY = height - margin.bottom; // Maximum y position
					const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

					axisLowerFilters[idx].attr('transform', `translate(${xScales[idx] - 6}, ${newY})`); // Move lower filter
					axisLowerFiltersValues[idx]
						?.attr('transform', `translate(${xScales[idx] + 8}, ${newY - 4})`)
						.style('display', axesFilters[idx].percentages.end >= 1 ? 'none' : 'block');
					axisLowerFiltersValues[idx]
						?.select('text')
						.text(getAxisDomainValue(idx, axesFilters[idx].percentages.end));
					axisFilterRectangles[idx].attr(
						'height',
						`${newY - axesFilters[idx].pixels.start - margin.top}`
					); // Move filter rectangle

					axesFilters[idx].pixels.end = newY - margin.top;
					axesFilters[idx].percentages.end = axesFilters[idx].pixels.end / axisHeight;
					filtersArray.set(axesFilters);
				})
				.on('end', () => {
					parcoordIsInteractable.set(false);
				});

			axisLowerFilters[dimensions.indexOf(dim)]?.call(dragBehavior);
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
					parcoordIsInteractable.set(false);
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
						`translate(${xScales[i] - 6}, ${axesFilters[i].pixels.start + margin.top - 12})`
					);
					axisUpperFiltersValues[i]
						?.attr(
							'transform',
							`translate(${xScales[i] + 8}, ${axesFilters[i].pixels.start + margin.top - 10})`
						)
						.style('display', axesFilters[i].percentages.start <= 0 ? 'none' : 'block');
					axisUpperFiltersValues[i]
						.select('text')
						.text(getAxisDomainValue(i, axesFilters[i].percentages.start));
					axisLowerFilters[i].attr(
						'transform',
						`translate(${xScales[i] - 6}, ${axesFilters[i].pixels.end + margin.top})`
					);
					axisLowerFiltersValues[i]
						?.attr(
							'transform',
							`translate(${xScales[i] + 8}, ${axesFilters[i].pixels.end + margin.top - 4})`
						)
						.style('display', axesFilters[i].percentages.end >= 1 ? 'none' : 'block');
					axisLowerFiltersValues[i]
						.select('text')
						.text(getAxisDomainValue(i, axesFilters[i].percentages.end));
				})
				.on('end', () => {
					parcoordIsInteractable.set(false);
					startY = 0;
				});

			axisFilterRectangles[dimensions.indexOf(dim)]?.call(dragBehavior);
		});
	}

	// Handle click on invert
	export function handleOnInvertAxesClick(i: number) {
		handleInvertAxis(i);

		const dim = dimensions[i];
		const axisData = dimensionsMetadata.get(dim);
		if (!axisData) return;
		axisData.inverted = !axisData.inverted;
		dimensionsMetadata.set(dim, axisData);

		const temp = axesFilters[i].pixels.end;
		axesFilters[i].pixels.end = axisHeight - axesFilters[i].pixels.start;
		axesFilters[i].pixels.start = axisHeight - temp;
		axesFilters[i].percentages.start = axesFilters[i].pixels.start / axisHeight;
		axesFilters[i].percentages.end = axesFilters[i].pixels.end / axisHeight;

		parcoordDimMetadata.set(dimensionsMetadata);
		filtersArray.set(axesFilters);
	}

	// Function to calculate new margin left
	function calculateMarginLeft() {
		if (dimensionsMetadata.get(dimensions[0])?.showLabels) {
			const longestString = getLongestStringLen(yScales[dimensions[0]].domain());
			const longestStringWidth = getTextWidth(longestString, 12, 'Roboto');
			margin.left =
				longestStringWidth < 100 ? (longestStringWidth < 30 ? 30 : longestStringWidth) : 100;
		} else margin.left = 30;

		handleMarginChanged();
	}

	export function resetAxisFilter(idx: number) {
		axesFilters[idx] = {
			pixels: {
				start: 0,
				end: axisHeight
			},
			percentages: {
				start: 0,
				end: 1
			}
		};

		filtersArray.set(axesFilters);
		clearSVG();
		renderAxes();
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

		dimensionsMetadata = new Map(
			dimensions.map((dim) => [
				dim,
				{
					inverted: false,
					showLabels: true,
					showHistograms: true,
					showFilter: true,
					showFilterValues: true,
					binNo: null
				}
			])
		);
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

		filtersArray.set(axesFilters);
	}

	async function readIcons() {
		filterArrowDown = await text('arrow-filter-down.svg');
		filterArrowUp = await text('arrow-filter-up.svg');
		invertArrowDown = await text('arrow-invert-down.svg');
		invertArrowUp = await text('arrow-invert-up.svg');
		iconsRead = true;
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
		calculateMarginLeft();
	});

	afterUpdate(async () => {
		if (!iconsRead) await readIcons();

		if (axesFilters.length !== dimensions.length) {
			initAxesFilters();
			calculateMarginLeft();
		}
		resizeFilters();
		clearSVG();
		renderAxes();
	});

	onDestroy(() => {
		unsubscribeDimData();
	});
</script>

<svg
	id="parcoord-canvas-axes"
	{width}
	{height}
	style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none;"
	on:contextmenu={(e) => {
		e.preventDefault();
	}}
/>
