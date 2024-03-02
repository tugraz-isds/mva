<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { axisLeft } from 'd3-axis';
	import { select } from 'd3-selection';
	import { drag } from 'd3-drag';
	import {
		filtersArray,
		parcoordDimMetadata,
		parcoordIsInteractable
	} from '../../../stores/parcoord';
	import { datasetStore, dimensionDataStore } from '../../../stores/dataset';
	import { calculateMaxLength, getLongestStringLen, getTextWidth } from '../../../util/text';
	import {
		arrow_invert_down_icon,
		arrow_invert_up_icon,
		arrow_filter_up_icon,
		arrow_filter_down_icon,
		arrow_right_icon,
		arrow_left_icon,
		arrows_right_left_icon,
		arrow_filter_down_hover_icon,
		arrow_filter_up_hover_icon,
		arrow_filter_up_down_icon,
		arrow_curved_up_icon,
		arrow_curved_down_icon
	} from '../../../util/icon-definitions';
	import { getAllTicks, reorderArray } from '../../../util/util';
	import type ContextMenuAxes from '../context-menu/ContextMenuAxes.svelte';
	import type { AxesFilterType, DimensionMetadataType } from '../types';
	import type { MarginType } from '../../../util/types';

	export let width: number; // Container width
	export let contextMenuAxes: ContextMenuAxes;
	export let height: number; // Container height
	export let dimensions: string[] = []; // Initial order of dimensions
	export let margin: MarginType; // Margin object
	export let handleAxesSwapped: Function; // Callback function when axes are swapped
	export let handleInvertAxis: Function; // Callback function when filter is applied
	export let handleMarginChanged: Function; // Callback function when margin changes
	export let handleAutoscroll: Function; // Callback function for autoscroll
	export let setTooltipAxisTitleData: Function; // Callback function for tooltip
	export let setTooltipData: Function; // Callback function for tooltip
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

	let axisHeight: number; // Actual axis height in pixels
	let axesFilters: AxesFilterType[] = []; // Filter values array for linking
	let isCurrentlyFiltering: boolean = false; // Is user currently filtering flag
	let datasetUploaded = false;
	let autoscrollInterval: number | null = null;

	$: axisHeight = height - margin.top - margin.bottom;

	let dimensionsMetadata: Map<string, DimensionMetadataType>;
	const unsubscribeDimData = parcoordDimMetadata.subscribe(
		(value: Map<string, DimensionMetadataType>) => {
			if (axesFilters.length > 0) {
				dimensionsMetadata = value;
				clearSVG();
				renderAxes();
			}
		}
	);

	// If filters are set throught context menu, redraw axes
	const unsubscribeFilters = filtersArray.subscribe((value: AxesFilterType[]) => {
		if (
			!axesFilters ||
			!axisUpperFilters ||
			axesFilters.length === 0 ||
			axisUpperFilters.length === 0
		)
			return;

		let redrawAxes = false;
		if (axesFilters.length !== value.length) {
			redrawAxes = true;
			axesFilters = value;
		}
		dimensions.forEach((dim: string, i: number) => {
			if (value[i].percentages.start === null) {
				axesFilters[i].percentages.start = axesFilters[i].pixels.start / axisHeight;
				redrawAxes = true;
			}
			if (value[i].percentages.end === null) {
				axesFilters[i].percentages.end = axesFilters[i].pixels.end / axisHeight;
				redrawAxes = true;
			}
		});

		if (redrawAxes) {
			clearSVG();
			renderAxes();
		}
	});

	const unsubscribeDataset = datasetStore.subscribe((value: any) => {
		if (!dimensionsMetadata) return;
		datasetUploaded = true;
	});

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
		if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;

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
			const cursorString =
				i === 0
					? `${btoa(setSvgStyle(arrow_right_icon, 14, 10, '#000', '#f9f9f9'))}") 7 5`
					: i === dimensions.length - 1
					? `${btoa(setSvgStyle(arrow_left_icon, 14, 10, '#000', '#f9f9f9'))}") 7 5`
					: `${btoa(setSvgStyle(arrows_right_left_icon, 16, 16, '#000', '#f9f9f9'))}") 8 8`;
			axisTitles.push(
				svg
					.append('text')
					.attr('class', `axis-title`)
					.attr('transform', `translate(${xScales[i]}, ${margin.top - 30})`)
					.attr('font-size', '10px')
					.style('text-anchor', 'middle')
					.style('cursor', `url("data:image/svg+xml;base64,${cursorString}, pointer`)
					.text(dim.substring(0, maxTitleLength) + (dim.length === maxTitleLength ? '' : '...'))
					.on('mouseenter', () => showCustomTooltip(dim, i))
					.on('mouseleave', hideCustomTooltip)
					.on('mousedown', hideCustomTooltip)
					.on('contextmenu', (e) => contextMenuAxes.showContextMenu(e, i))
			);

			// Create axis invert icons SVG
			axisInvertIcons.push(
				svg
					.append('svg')
					.attr('class', 'axis-invert cursor-pointer')
					.html(
						dimensionsMetadata.get(dim)?.inverted ? arrow_invert_down_icon : arrow_invert_up_icon
					)
					.attr('x', xScales[i] - 8)
					.attr('y', margin.top - 28)
					.attr('width', '16px')
					.attr('height', '16px')
					.attr('stroke', '#000')
					.attr('fill', '#000')
					.style(
						'cursor',
						`url("data:image/svg+xml;base64,${btoa(
							setSvgStyle(
								dimensionsMetadata.get(dim)?.inverted
									? arrow_curved_up_icon
									: arrow_curved_down_icon,
								15,
								15,
								'#000',
								'#f9f9f9'
							)
						)}") 7 5, pointer`
					)
					.on('click', () => handleOnInvertAxesClick(i))
			);

			axisUpperFilters.push(
				svg
					.append('svg')
					.attr('class', 'axis-filter-upper')
					.html(arrow_filter_down_icon)
					.attr('x', xScales[i] - 8)
					.attr('y', axesFilters[i].pixels.start + margin.top - 16)
					.attr('width', '16px')
					.attr('height', '16px')
					.attr('stroke', '#000')
					.attr('fill', '#000')
					.style('display', dimensionsMetadata.get(dim)?.showFilter ? 'block' : 'none')
					.style(
						'cursor',
						`url("data:image/svg+xml;base64,${btoa(
							setSvgStyle(arrow_filter_down_hover_icon, 12, 12, '#000', '#f9f9f9')
						)}") 7 5, pointer`
					)
			);
			if (
				$dimensionDataStore.get(dim)?.type === 'numerical' &&
				dimensionsMetadata.get(dim)?.showFilterValues
			) {
				const upperFilterValue = getAxisDomainValue(i, axesFilters[i].percentages.start as number);
				const groupUpper = svg
					.append('g')
					.attr('class', 'axis-filter-upper-value')
					.attr(
						'transform',
						`translate(${xScales[i] + 8}, ${axesFilters[i].pixels.start + margin.top - 10})`
					)
					.style(
						'display',
						!dimensionsMetadata.get(dim)?.showFilter ||
							(axesFilters[i].percentages.start as number) <= 0
							? 'none'
							: 'block'
					);
				groupUpper
					.append('rect')
					.attr('class', 'axis-filter-upper-value')
					.attr('width', getTextWidth(upperFilterValue, 10, 'Roboto') + 8)
					.attr('height', 14)
					.attr('fill', 'lightgrey')
					.attr('stroke', 'black');
				groupUpper
					.append('text')
					.attr('font-size', '10')
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
					.style(
						'display',
						!dimensionsMetadata.get(dim)?.showFilter ||
							(axesFilters[i].percentages.end as number) >= 1
							? 'none'
							: 'block'
					);
				groupLower
					.append('rect')
					.attr('class', 'axis-filter-lower-value')
					.attr('width', 30)
					.attr('height', 14)
					.attr('fill', 'lightgrey')
					.attr('stroke', 'black');
				groupLower
					.append('text')
					.attr('font-size', '10')
					.attr('text-anchor', 'start')
					.attr('fill', 'black')
					.attr('x', 4)
					.attr('y', 10)
					.text(getAxisDomainValue(i, axesFilters[i].percentages.end as number));
				axisLowerFiltersValues.push(groupLower);
			} else {
				axisUpperFiltersValues.push(null);
				axisLowerFiltersValues.push(null);
			}

			// Create axis lower filter
			axisLowerFilters.push(
				svg
					.append('svg')
					.attr('class', 'axis-filter-lower')
					.html(arrow_filter_up_icon)
					.attr('x', xScales[i] - 8)
					.attr('y', axesFilters[i].pixels.end + margin.top)
					.attr('width', '16px')
					.attr('height', '16px')
					.attr('stroke', '#000')
					.attr('fill', '#000')
					.style('display', dimensionsMetadata.get(dim)?.showFilter ? 'block' : 'none')
					.style(
						'cursor',
						`url("data:image/svg+xml;base64,${btoa(
							setSvgStyle(arrow_filter_up_hover_icon, 12, 12, '#000', '#f9f9f9')
						)}") 7 5, pointer`
					)
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
					.style('display', dimensionsMetadata.get(dim)?.showFilter ? 'block' : 'none')
					.style(
						'cursor',
						`url("data:image/svg+xml;base64,${btoa(
							setSvgStyle(arrow_filter_up_down_icon, 12, 16, '#000', '#f9f9f9')
						)}") 7 5, pointer`
					)
					.on('mouseenter', () => {
						parcoordIsInteractable.set(false);
						setTooltipData({ visible: false, xPos: 0, yPos: 0, text: [] });
					})
					.on('mouseleave', () => {
						parcoordIsInteractable.set(true);
					})
			);
		});

		handleAxesDragging();
		handleFilterRectDragging();
		handleUpperFilterDragging();
		handleLowerFilterDragging();
	}

	function setSvgStyle(svg: string, width: number, height: number, stroke: string, fill: string) {
		return svg.replace(
			'<svg',
			`<svg width="${width}" height="${height}" stroke="${stroke}" fill="${fill}"`
		);
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
					axisInvertIcons[draggingIndex].attr('x', newX - 8);
					if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
						axisUpperFilters[draggingIndex].attr('x', newX - 8);
						axisLowerFilters[draggingIndex].attr('x', newX - 8);
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

					checkAutoscroll(event.sourceEvent.clientX, draggingIndex);

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
						axisInvertIcons[draggingIndex].attr('x', xScales[draggingIndex] - 8);
						if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
							axisUpperFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
							axisLowerFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
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
						filtersArray.set(axesFilters);

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
					axisInvertIcons[draggingIndex].attr('x', xScales[draggingIndex] - 8);
					if (dimensionsMetadata.get(dimensions[draggingIndex])?.showFilter) {
						axisUpperFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
						axisLowerFilters[draggingIndex].attr('x', xScales[draggingIndex] - 8);
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

					if (autoscrollInterval !== null) {
						clearInterval(autoscrollInterval);
						autoscrollInterval = null;
					}
				});

			axisTitles[dimensions.indexOf(dim)]?.call(dragBehavior);
		});
	}

	function checkAutoscroll(x: number, draggingIndex: number) {
		const parcoordDiv = select('.view-parcoord');
		const rect = (parcoordDiv.node() as any).getBoundingClientRect();

		if (autoscrollInterval !== null) {
			clearInterval(autoscrollInterval);
			autoscrollInterval = null;
		}

		if (x > rect.right) autoscrollInterval = setInterval(() => handleAutoscroll('right'), 100);
		else if (x <= rect.left) autoscrollInterval = setInterval(() => handleAutoscroll('left'), 100);
	}

	function getAxisDomainValue(i: number, percentage: number) {
		const axisDomain = yScales[dimensions[i]].domain();
		const axisRange = axisDomain[1] - axisDomain[0];
		return (axisDomain[0] + (1 - percentage) * axisRange).toFixed(
			$dimensionDataStore.get(dimensions[i])?.numberOfDecimals
		);
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

					axisUpperFilters[idx].attr('y', newY - 8); // Move upper filter
					axisUpperFiltersValues[idx]
						?.attr('transform', `translate(${xScales[idx] + 8}, ${newY - 2})`)
						.style(
							'display',
							(axesFilters[idx].percentages.start as number) <= 0 ? 'none' : 'block'
						);
					axisUpperFiltersValues[idx]
						?.select('text')
						.text(getAxisDomainValue(idx, axesFilters[idx].percentages.start as number));
					axisFilterRectangles[idx]
						.attr('y', `${newY + 8}`)
						.attr('height', `${axesFilters[idx].pixels.end - newY + margin.top - 8}`); // Move filter rectangle

					axesFilters[idx].pixels.start = newY - margin.top + 8;
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
					const minY = axesFilters[idx].pixels.start + margin.top + 8; // Minimum y position
					const maxY = height - margin.bottom + 8; // Maximum y position
					const newY = Math.max(minY, Math.min(maxY, event.y)); // Clamp the y position within the valid range

					axisLowerFilters[idx].attr('y', newY - 8); // Move lower filter
					axisLowerFiltersValues[idx]
						?.attr('transform', `translate(${xScales[idx] + 8}, ${newY - 8})`)
						.style('display', (axesFilters[idx].percentages.end as number) >= 1 ? 'none' : 'block');
					axisLowerFiltersValues[idx]
						?.select('text')
						.text(getAxisDomainValue(idx, axesFilters[idx].percentages.end as number));
					axisFilterRectangles[idx].attr(
						'height',
						`${newY - axesFilters[idx].pixels.start - margin.top - 8}`
					); // Move filter rectangle

					axesFilters[idx].pixels.end = newY - margin.top - 8;
					axesFilters[idx].percentages.end = axesFilters[idx].pixels.end / axisHeight;
					filtersArray.set(axesFilters);
				})
				.on('end', () => {
					parcoordIsInteractable.set(true);
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
					axisUpperFilters[i].attr('y', axesFilters[i].pixels.start + margin.top - 16);
					axisUpperFiltersValues[i]
						?.attr(
							'transform',
							`translate(${xScales[i] + 8}, ${axesFilters[i].pixels.start + margin.top - 10})`
						)
						.style('display', (axesFilters[i].percentages.start as number) <= 0 ? 'none' : 'block');
					axisUpperFiltersValues[i]
						?.select('text')
						.text(getAxisDomainValue(i, axesFilters[i].percentages.start as number));
					axisLowerFilters[i].attr('y', axesFilters[i].pixels.end + margin.top);
					axisLowerFiltersValues[i]
						?.attr(
							'transform',
							`translate(${xScales[i] + 8}, ${axesFilters[i].pixels.end + margin.top - 4})`
						)
						.style('display', (axesFilters[i].percentages.end as number) >= 1 ? 'none' : 'block');
					axisLowerFiltersValues[i]
						?.select('text')
						.text(getAxisDomainValue(i, axesFilters[i].percentages.end as number));
				})
				.on('end', () => {
					parcoordIsInteractable.set(true);
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
	export function calculateMarginLeft() {
		if (dimensionsMetadata.get(dimensions[0])?.showLabels) {
			const longestString = getLongestStringLen(yScales[dimensions[0]].domain());
			const longestStringWidth = getTextWidth(longestString, 12, 'Roboto') + 8;
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
	export function resizeFilters() {
		axisHeight = height - margin.top - margin.bottom;
		dimensions.forEach((dim: string, i: number) => {
			// Calculate new pixel values
			axesFilters[i].pixels = {
				start: (axesFilters[i].percentages.start as number) * axisHeight,
				end: (axesFilters[i].percentages.end as number) * axisHeight
			};
		});

		filtersArray.set(axesFilters);
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
		if (datasetUploaded) {
			initAxesFilters();
			calculateMarginLeft();
			datasetUploaded = false;
		}

		resizeFilters();
		clearSVG();
		renderAxes();
	});

	onDestroy(() => {
		unsubscribeDimData();
		unsubscribeFilters();
		unsubscribeDataset();
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
