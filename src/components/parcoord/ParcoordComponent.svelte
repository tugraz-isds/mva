<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import { datasetStore, dimensionDataStore } from '../../stores/dataset';
	import { brushedArray } from '../../stores/brushing';
	import {
		filtersArray,
		parcoordCustomAxisRanges,
		parcoordDimMetadata,
		parcoordHistogramData
	} from '../../stores/parcoord';
	import { scaleLinear, scaleBand } from 'd3';
	import { reorderArray, isOffscreenCanvasSupported } from '../../util/util';
	import Axes from './axes/Axes.svelte';
	import Histograms from './histograms/Histograms.svelte';
	import Lines from './lines/Lines.svelte';
	import Tooltip from '../tooltip/Tooltip.svelte';
	import TooltipAxisTitle from './axes/TooltipAxisTitle.svelte';
	import ContextMenuAxes from './context-menu/ContextMenuAxes.svelte';
	import type { DSVParsedArray } from 'd3';
	import type { TooltipAxisTitleType, CustomRangeType, HistogramsType } from './types';
	import type { MarginType, TooltipType } from '../../util/types';
	import SvgExportModal from '../svg-exporter/SvgExportModal.svelte';

	let isBrowser = false; // Flag to see if we are in browser

	let isSvgExportModalOpen: boolean = false;
	let width: number; // Container width
	let originalWidth: number; // Container original width
	let height: number; // Container height
	let dimensions: string[] = []; // Dataset dimensions
	let dimensionsInitial: string[] = []; // Dataset initial dimensions
	let initialHeight: number; // Initial height (needed after resizing)

	let xScales: any[] = [];
	let yScales: any = {};

	let canvasEl: HTMLCanvasElement;
	let parcoordDiv: HTMLElement;
	let linesComponent: Lines;
	let axesComponent: Axes;
	let contextMenuAxes: ContextMenuAxes;
	let svgExportModal: SvgExportModal;
	let isOffscreenCanvasSupport: boolean;

	let margin: MarginType = { top: 40, right: 40, bottom: 10, left: 50 }; // Parallel coordinates margin

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
	const unsubscribeCustomRanges = parcoordCustomAxisRanges.subscribe(
		(value: Map<string, CustomRangeType>) => {
			customRanges = value;
			calculateYScales();
			setTimeout(() => {
				linesComponent?.drawLines();
			}, 0);
		}
	);

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
				$parcoordDimMetadata.set(dim, {
					inverted: false,
					showLabels: true,
					showHistograms: true,
					showFilter: true,
					showFilterValues: true,
					binNo: null
				});
			});

			brushedArray.set(new Set<number>());

			setMarginRight($parcoordHistogramData.visible);

			if (parcoordDiv) parcoordDiv.scrollLeft = 0;
		}
	});

	let histogramsVisible: boolean;
	const unsubscribeHistograms = parcoordHistogramData.subscribe((value: HistogramsType) => {
		histogramsVisible = value.visible;
		setMarginRight(histogramsVisible);
	});

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

	function calculateYScales() {
		if (height > 0 && dataset?.length > 0) {
			yScales = dimensions.reduce((acc: any, dim: string, i: number) => {
				if ($dimensionDataStore.get(dim)?.type === 'numerical') {
					if (customRanges.get(dim) === null) {
						acc[dim] = scaleLinear()
							.domain([$dimensionDataStore.get(dim)?.min, $dimensionDataStore.get(dim)?.max] as [
								number,
								number
							])
							.range([height - margin.top - margin.bottom, 0]);
						if ($parcoordDimMetadata.get(dim)?.inverted)
							acc[dim].domain(acc[dim].domain().reverse());
					} else {
						acc[dim] = scaleLinear()
							.domain([
								customRanges.get(dim)?.start as number,
								customRanges.get(dim)?.end as number
							])
							.range([height - margin.top - margin.bottom, 0]);
					}
				} else {
					const categoricalValues = [...new Set(dataset.map((d: any) => d[dim]))];
					acc[dim] = scaleBand()
						.domain(categoricalValues.reverse())
						.range([height - margin.top - margin.bottom, 0]);
				}
				return acc;
			}, {});
		}
	}

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
		width =
			originalWidth < 100 * dimensions.length + margin.left + margin.right
				? 100 * dimensions.length + margin.left + margin.right
				: originalWidth;
		setTimeout(() => {
			axesComponent.clearSVG();
			axesComponent.renderAxes(width);
			linesComponent.drawLines();
		}, 0);
	}

	function handleAutoscroll(direction: 'left' | 'right') {
		if (!parcoordDiv) return;
		if (direction === 'right') parcoordDiv.scrollLeft += 10;
		else if (direction === 'left') parcoordDiv.scrollLeft -= 10;
	}

	// Handle inverting axes
	function handleInvertAxis(axisIndex: number) {
		yScales[dimensions[axisIndex]] = yScales[dimensions[axisIndex]].domain(
			yScales[dimensions[axisIndex]].domain().reverse()
		);
		linesComponent.handleInvertAxis(axisIndex);
	}

	function handleHideDimension(idx: number) {
		dimensions = [...dimensions.slice(0, idx), ...dimensions.slice(idx + 1)];
		idx === 0 && calculateMarginLeft();
		setTimeout(() => {
			filtersArray.set([...$filtersArray.slice(0, idx), ...$filtersArray.slice(idx + 1)]);
			linesComponent.drawLines();
		}, 0);
	}

	function calculateMarginLeft() {
		setTimeout(() => {
			axesComponent.calculateMarginLeft();
		}, 0);
	}

	function setTooltipData(data: TooltipType) {
		tooltip = data;
	}

	function setTooltipAxisTitleData(data: TooltipAxisTitleType) {
		tooltipAxisTitle = data;
	}

	function setMarginRight(histogramsVisible: boolean) {
		const step = xScales[1] - xScales[0];
		if (!step) return;
		margin.right =
			histogramsVisible &&
			$parcoordDimMetadata.get(dimensions[dimensions.length - 1])?.showHistograms
				? 10 + (step - 16) * $parcoordHistogramData.width
				: 40;
	}

	function setMarginBottom(bottom: number) {
		const isFirefox = navigator.userAgent.includes('Firefox');
		const isSafari =
			navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
		if (!isFirefox && !isSafari) return;
		margin.bottom = bottom;
		calculateYScales();
		handleMarginChanged();
	}

	export function saveSVG() {
		let linesStringSvg = linesComponent.saveSVG();
		let axesStringSvg = axesComponent.saveSVG();
		if (!axesStringSvg || !linesStringSvg) return;

		isSvgExportModalOpen = false;
		isSvgExportModalOpen = true;

		linesStringSvg = linesStringSvg.replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>/, '</g>');
		axesStringSvg = axesStringSvg.replace(/<svg([^>]*)>/, '<g>').replace(/<\/svg>/, '</g>');

		const svgString =
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
			'\n<!-- Lines -->\n' +
			linesStringSvg +
			'\n<!-- Axes -->\n' +
			axesStringSvg +
			'\n</svg>';

		svgExportModal.setSvgString(svgString);
	}

	onMount(() => {
		isOffscreenCanvasSupport = isOffscreenCanvasSupported(canvasEl);
		if (!isOffscreenCanvasSupport)
			console.warn(
				'Your browser does not support OffscreenCanvas with a WebGL Context.' +
					' Check the browser support on https://caniuse.com/#feat=offscreencanvas.' +
					' You will likely experience slower performance on larger datasets.'
			);
		initialHeight = height;
		calculateYScales();
		isBrowser = true;
		window.addEventListener('call-save-svg-parcoord', saveSVG);

		dimensions.forEach((dim) => {
			customRanges.set(dim, null);
			$parcoordDimMetadata.set(dim, {
				inverted: false,
				showLabels: true,
				showHistograms: true,
				showFilter: true,
				showFilterValues: true,
				binNo: null
			});
		});

		parcoordHistogramData.set({
			visible: true,
			fillOpacity: 0.2,
			strokeOpacity: 0.3,
			width: 0.2,
			widthLimits: {
				min: 0,
				max: xScales[1] - xScales[0]
			}
		});

		setTimeout(() => {
			setMarginRight(true);
		}, 0);
	});

	afterUpdate(() => {
		if (parcoordDiv.scrollWidth > parcoordDiv.clientWidth && margin.bottom !== 20) {
			setMarginBottom(20);
		} else if (parcoordDiv.scrollWidth <= parcoordDiv.clientWidth && margin.bottom !== 10) {
			setMarginBottom(10);
		}
	});

	onDestroy(() => {
		unsubscribeDataset();
		unsubscribeCustomRanges();
		unsubscribeHistograms();
		isBrowser && window.removeEventListener('call-save-svg-parcoord', saveSVG);
	});
</script>

<div
	id="parcoord-canvas"
	class="w-full h-full overflow-scroll-x scrollable-div"
	style="overflow-x: auto !important; box-sizing: border-box;"
	bind:this={parcoordDiv}
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
			{handleAutoscroll}
			{setTooltipAxisTitleData}
			{setTooltipData}
			{xScales}
			bind:yScales
		/>

		{#if histogramsVisible}
			<Histograms {dataset} {width} {height} {dimensions} {margin} {xScales} {yScales} />
		{/if}

		<Tooltip data={tooltip} viewTitle="parcoord" />
		<TooltipAxisTitle {width} data={tooltipAxisTitle} />
		<ContextMenuAxes
			bind:this={contextMenuAxes}
			bind:axesComponent
			{xScales}
			bind:yScales
			bind:dimensions
			bind:margin
			{handleHideDimension}
			{calculateMarginLeft}
		/>

		<Lines
			bind:this={linesComponent}
			{width}
			{height}
			{dimensions}
			bind:margin
			{xScales}
			{yScales}
			{setTooltipData}
		/>
	{/if}
</div>

<SvgExportModal bind:this={svgExportModal} isOpen={isSvgExportModalOpen} />
<canvas bind:this={canvasEl} height="0" width="0" />

<style>
	.scrollable-div {
		scrollbar-width: thin;
	}

	.scrollable-div::-webkit-scrollbar {
		height: 12px;
	}
</style>
