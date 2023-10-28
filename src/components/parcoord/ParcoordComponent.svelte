<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { datasetStore } from '../../stores/dataset';
	import { brushedArray } from '../../stores/brushing';
	import { scaleLinear, scaleBand, extent } from 'd3';
	import Axes from './Axes.svelte';
	import LinesThree from './LinesThree.svelte';
	import Tooltip from './Tooltip.svelte';
	import type { DSVParsedArray } from 'd3';
	import type { TooltipType } from './types';

	let isBrowser = false; // Flag to see if we are in browser

	let width: number; // Container width
	let height: number; // Container height
	let dimensions: string[] = []; // Dataset dimensions
	let dimensionsInitial: string[] = []; // Dataset initial dimensions
	let initialHeight: number; // Initial height (needed after resizing)

	let xScales: any[] = []; // Scales for all of the X-axes
	let yScales: any = {}; // Scales for all of the Y-axes

	let linesComponent: LinesThree; // Svelte Lines component
	let axesComponent: Axes; // Svelte Axes component

	const margin = { top: 40, right: 50, bottom: 10, left: 50 }; // Parallel coordinates margin

	// Tooltip data
	let tooltip: TooltipType = {
		visible: false,
		xPos: 0,
		yPos: 0,
		text: []
	};

	// Set dataset and handle new dataset upload
	let dataset: DSVParsedArray<any>;
	const unsubscribeDataset = datasetStore.subscribe((value: any) => {
		dataset = value;
		if (dataset?.length > 0) {
			// Get correct dimensions
			dimensions = Object.keys(dataset[0]);
			dimensionsInitial = dimensions;

			calculateYScales(); // Calculate new yScales

			brushedArray.set(new Set<number>()); // Reset brusing
		}
	});

	$: {
		if (height > 0 && dataset?.length > 0 && dimensions === dimensionsInitial) {
			calculateYScales();
		}
	}

	// Update xScale when dimensions change
	$: {
		if (width > 0 && dimensions) {
			xScales = dimensions.map((_, i) =>
				scaleLinear()
					.domain([0, dimensions.length - 1])
					.range([
						margin.left,
						width < 100 * dimensions.length
							? dimensions.length * 100 - margin.right
							: width - margin.right
					])(i)
			);
		}
	}

	// Update yScales
	function calculateYScales() {
		if (height > 0 && dataset?.length > 0 && dimensions === dimensionsInitial) {
			yScales = dimensions.reduce((acc: any, dim: string) => {
				if (isNumber(dataset[0][dim])) {
					const dimExtent: any = extent(dataset, (d: any) => +d[dim]);
					acc[dim] = scaleLinear()
						.domain(dimExtent)
						.range([height - margin.top - margin.bottom, 0])
						.nice();
				} else {
					const categoricalValues = [...new Set(dataset.map((d: any) => d[dim]))];
					acc[dim] = scaleBand()
						.domain(categoricalValues)
						.range([height - margin.top - margin.bottom, 0]);
				}
				return acc;
			}, {});
		}
	}

	// Get dimensions that have data as numbers
	function filterDimensions(dimensions: string[]) {
		const newDimensions: string[] = [];
		dimensions.forEach((dim: string) => {
			if (isNumber(dataset[0][dim])) newDimensions.push(dim);
		});
		return newDimensions;
	}

	// Handle swapped axis from Axes component
	function handleAxesSwapped(fromIndex: number, toIndex: number) {
		linesComponent.swapPoints(fromIndex, toIndex);
		dimensions = reorderArray(dimensions, fromIndex, toIndex);
	}

	// Handle inverting axes
	function handleInvertAxis(axisIndex: number) {
		yScales[dimensions[axisIndex]] = yScales[dimensions[axisIndex]].domain(
			yScales[dimensions[axisIndex]].domain().reverse()
		);
		linesComponent.handleInvertAxis();
	}

	function setTooltipData(data: TooltipType) {
		tooltip = data;
	}

	// Helper function to reorder an array
	function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
		const result = [...arr];
		const [removed] = result.splice(fromIndex, 1);
		result.splice(toIndex, 0, removed);
		return result;
	}

	// Helper function that returns whether item is a number
	function isNumber(item: any) {
		if (typeof item === 'number') return true;
		if (typeof item === 'string') return !isNaN(+item);
		return false;
	}

	export function saveSVG() {
		let axesStringSvg = axesComponent.saveSVG();
		let linesStringSvg = linesComponent.saveSVG();

		if (!axesStringSvg || !linesStringSvg) return;

		// Add new lines before and after tags
		axesStringSvg = axesStringSvg.replaceAll(/<[^\/].*?>/g, (match) => `${match}\n`);
		linesStringSvg = linesStringSvg.replaceAll(/<[^\/].*?>/g, (match) => `${match}\n`);
		axesStringSvg = axesStringSvg.replaceAll(/<\/.*?>/g, (match) => `\n${match}\n`);
		linesStringSvg = linesStringSvg.replaceAll(/<\/.*?>/g, (match) => `\n${match}`);
		// Remove empty spaces at start of line
		axesStringSvg = axesStringSvg.replace(/^\s+/gm, '');
		linesStringSvg = linesStringSvg.replace(/^\s+/gm, '');
		// Trim decimal points to 6 decimals
		axesStringSvg = axesStringSvg.replace(/\d+\.\d{7,}/g, (match) => `${Number(match).toFixed(6)}`);
		linesStringSvg = linesStringSvg.replace(
			/\d+\.\d{7,}/g,
			(match) => `${Number(match).toFixed(6)}`
		);
		// Replace width and height with viewBox for axes
		axesStringSvg = axesStringSvg.replace(/width="(\d+)" height="(\d+)"/, 'viewBox="0 0 $1 $2"');

		const stringSvg =
			`<svg viewBox="0 0 ${width} ${height}">` +
			'\n<!-- Axes -->\n' +
			axesStringSvg +
			'\n\n<!-- Lines -->\n' +
			linesStringSvg +
			'\n</svg>';
		const svgBlob = new Blob([stringSvg], {
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
	});

	onDestroy(() => {
		unsubscribeDataset();
		isBrowser && window.removeEventListener('call-save-svg-parcoord', saveSVG);
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	id="parcoord-canvas"
	class="w-full h-full overflow-scroll-x"
	style="overflow-x: scroll !important;"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	{#if dataset?.length === 0}
		<span>No data available.</span>
	{:else if yScales && Object.keys(yScales).length !== 0}
		<Axes
			bind:this={axesComponent}
			{width}
			{height}
			{dimensions}
			{margin}
			{handleAxesSwapped}
			{handleInvertAxis}
			{xScales}
			{yScales}
		/>

		<Tooltip data={tooltip} />

		<LinesThree
			bind:this={linesComponent}
			{width}
			{height}
			{dataset}
			initialDimensions={dimensions}
			{margin}
			{xScales}
			{yScales}
			{setTooltipData}
		/>
	{/if}
</div>
