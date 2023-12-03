<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { datasetStore, dimensionTypeStore } from '../../stores/dataset';
	import { brushedArray } from '../../stores/brushing';
	import { parcoordCustomAxisRanges, parcoordDimData } from '../../stores/parcoord';
	import { scaleLinear, scaleBand, extent } from 'd3';
	import { reorderArray } from '../../util/util';
	import xmlFormat from 'xml-formatter';
	import Axes from './Axes.svelte';
	import Barplots from './Barplots.svelte';
	import LinesThree from './LinesThree.svelte';
	import Tooltip from './Tooltip.svelte';
	import TooltipAxisTitle from './TooltipAxisTitle.svelte';
	import ContextMenuAxes from './ContextMenuAxes.svelte';
	import type { DSVParsedArray } from 'd3';
	import type { TooltipType, TooltipAxisTitleType, CustomRangeType } from './types';

	let isBrowser = false; // Flag to see if we are in browser

	let width: number; // Container width
	let originalWidth: number; // Container original width
	let height: number; // Container height
	let dimensions: string[] = []; // Dataset dimensions
	let dimensionsInitial: string[] = []; // Dataset initial dimensions
	let initialHeight: number; // Initial height (needed after resizing)

	let xScales: any[] = []; // Scales for all of the X-axes
	let yScales: any = {}; // Scales for all of the Y-axes

	let linesComponent: LinesThree; // Svelte Lines component
	let axesComponent: Axes; // Svelte Axes component
	let contextMenuAxes: ContextMenuAxes;

	let margin = { top: 40, right: 20, bottom: 10, left: 50 }; // Parallel coordinates margin

	// Tooltip data
	let tooltip: TooltipType = {
		visible: false,
		xPos: 0,
		yPos: 0,
		text: []
	};
	let tooltipAxisTitle: TooltipAxisTitleType = {
		visible: false,
		xPos: 0,
		yPos: 0,
		text: ''
	};

	let customRanges: Map<string, CustomRangeType>;

	// Set dataset and handle new dataset upload
	let dataset: DSVParsedArray<any>;
	const unsubscribeDataset = datasetStore.subscribe((value: any) => {
		dataset = value;
		if (dataset?.length > 0) {
			// Get correct dimensions
			dimensions = Object.keys(dataset[0]);
			dimensionsInitial = dimensions;

			calculateYScales();
			calculateXScales();

			dimensions.forEach((dim) => {
				customRanges && customRanges.set(dim, null);
				$parcoordDimData.set(dim, {
					inverted: false,
					showLabels: true,
					showFilter: true
				});
			});

			brushedArray.set(new Set<number>());
		}
	});

	let dimensionTypes: Map<string, string>;
	const unsubscribeDimTypes = dimensionTypeStore.subscribe((value: Map<string, string>) => {
		dimensionTypes = value;
	});

	const unsubscribeCustomRanges = parcoordCustomAxisRanges.subscribe(
		(value: Map<string, CustomRangeType>) => {
			customRanges = value;
			calculateYScales();
		}
	);

	$: width =
		originalWidth < 100 * dimensions.length + margin.left + margin.right
			? 100 * dimensions.length + margin.left + margin.right
			: originalWidth;

	$: {
		if (height > 0 && dataset?.length > 0 && dimensions === dimensionsInitial) {
			calculateYScales();
		}
	}

	// Update xScale when dimensions change
	$: {
		if (margin && width > 0 && dataset?.length > 0 && dimensions) {
			calculateXScales();
		}
	}

	// Update yScales
	function calculateYScales(init: boolean = false) {
		if (height > 0 && dataset?.length > 0) {
			yScales = dimensions.reduce((acc: any, dim: string, i: number) => {
				if (dimensionTypes.get(dim) === 'numerical') {
					if (customRanges.get(dim) === null) {
						const dimExtent: any = extent(dataset, (d: any) => +d[dim]);
						acc[dim] = scaleLinear()
							.domain(dimExtent)
							.range([height - margin.top - margin.bottom, 0])
							.nice();
						if ($parcoordDimData.get(dim)?.inverted) acc[dim].domain(acc[dim].domain().reverse());
					} else {
						acc[dim] = scaleLinear()
							.domain([
								customRanges.get(dim)?.start as number,
								customRanges.get(dim)?.end as number
							])
							.range([height - margin.top - margin.bottom, 0])
							.nice();
					}
				} else {
					const categoricalValues = [...new Set(dataset.map((d: any) => d[dim]))];
					acc[dim] = scaleBand()
						.domain(init ? categoricalValues : categoricalValues.reverse())
						.range([height - margin.top - margin.bottom, 0]);
				}
				return acc;
			}, {});
		}
	}

	// Update yScales
	function calculateXScales() {
		xScales = dimensions.map((_, i) =>
			scaleLinear()
				.domain([0, dimensions.length - 1])
				.range([margin.left, width - margin.right])(i)
		);
	}

	function handleAxesSwapped(fromIndex: number, toIndex: number) {
		linesComponent.swapPoints(fromIndex, toIndex);
		dimensions = reorderArray(dimensions, fromIndex, toIndex);
	}

	function handleMarginChanged() {
		setTimeout(() => {
			axesComponent.clearSVG();
			axesComponent.renderAxes();

			linesComponent.initScene();
			linesComponent.drawLines();
		}, 10);
	}

	// Handle inverting axes
	function handleInvertAxis(axisIndex: number) {
		yScales[dimensions[axisIndex]] = yScales[dimensions[axisIndex]].domain(
			yScales[dimensions[axisIndex]].domain().reverse()
		);
		linesComponent.handleInvertAxis();
	}

	function handleHideDImension(idx: number) {
		dimensions = [...dimensions.slice(0, idx), ...dimensions.slice(idx + 1)];
	}

	function setTooltipData(data: TooltipType) {
		tooltip = data;
	}

	function setTooltipAxisTitleData(data: TooltipAxisTitleType) {
		tooltipAxisTitle = data;
	}

	export function saveSVG() {
		let linesStringSvg = linesComponent.saveSVG();
		let axesStringSvg = axesComponent.saveSVG();
		if (!axesStringSvg || !linesStringSvg) return;

		linesStringSvg = linesStringSvg.replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>/, '</g>');
		axesStringSvg = axesStringSvg.replace(/<svg([^>]*)>/, '<g>').replace(/<\/svg>/, '</g>');

		// Trim decimal points to 6 decimals
		axesStringSvg = axesStringSvg.replace(/\d+\.\d{7,}/g, (match) => `${Number(match).toFixed(6)}`);
		linesStringSvg = linesStringSvg.replace(
			/\d+\.\d{7,}/g,
			(match) => `${Number(match).toFixed(6)}`
		);

		const stringSvg =
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
			'\n<!-- Lines -->\n' +
			linesStringSvg +
			'\n<!-- Axes -->\n' +
			axesStringSvg +
			'\n</svg>';

		const stringSvgFormatted = xmlFormat(stringSvg, {
			indentation: '  ',
			collapseContent: true,
			lineSeparator: '\n'
		});

		const svgBlob = new Blob([stringSvgFormatted], {
			type: 'image/svg+xml;charset=utf-8'
		});
		const svgUrl = URL.createObjectURL(svgBlob);
		const downloadLink = document.createElement('a');

		downloadLink.href = svgUrl;
		downloadLink.download = 'parcoord.svg';
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);
	}

	onMount(() => {
		initialHeight = height;
		calculateYScales();
		isBrowser = true;
		window.addEventListener('call-save-svg-parcoord', saveSVG);

		dimensions.forEach((dim) => {
			customRanges.set(dim, null);
			$parcoordDimData.set(dim, {
				inverted: false,
				showLabels: true,
				showFilter: true
			});
		});
	});

	onDestroy(() => {
		unsubscribeDataset();
		unsubscribeDimTypes();
		unsubscribeCustomRanges();
		isBrowser && window.removeEventListener('call-save-svg-parcoord', saveSVG);
	});
</script>

<div
	id="parcoord-canvas"
	class="w-full h-full overflow-scroll-x"
	style="overflow-x: scroll !important;"
	bind:clientWidth={originalWidth}
	bind:clientHeight={height}
>
	{#if dataset?.length === 0}
		<span>No data available.</span>
	{:else if yScales && Object.keys(yScales).length !== 0 && xScales && Object.keys(xScales).length !== 0}
		<Axes
			bind:this={axesComponent}
			bind:contextMenuAxes
			bind:width
			{height}
			{dimensions}
			bind:margin
			{handleAxesSwapped}
			{handleInvertAxis}
			{handleMarginChanged}
			{setTooltipAxisTitleData}
			{xScales}
			bind:yScales
		/>

		<Barplots {dataset} {width} {height} {dimensions} {margin} {xScales} {yScales} />

		<Tooltip data={tooltip} />
		<TooltipAxisTitle {width} data={tooltipAxisTitle} />
		<ContextMenuAxes
			bind:this={contextMenuAxes}
			bind:axesComponent
			bind:yScales
			bind:dimensions
			{dataset}
		/>

		<LinesThree
			bind:this={linesComponent}
			bind:width
			{height}
			{dataset}
			initialDimensions={dimensions}
			bind:margin
			{xScales}
			{yScales}
			{setTooltipData}
		/>
	{/if}
</div>
