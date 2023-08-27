<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { datasetStore } from '../../stores/dataset';
	import { scaleLinear, extent } from 'd3';
	import type { DSVParsedArray } from 'd3';
	import Axes from './Axes.svelte';
	import Lines from './Lines.svelte';
	import { brushingArray } from '../../stores/brushing';

	let width: number = 0;
	let height: number = 0;
	let dimensions: string[] = []; // Dataset dimensions
	let dimensionsInitial: string[] = []; // Dataset initial dimensions

	let xScales: any[] = []; // Scales for all of the X-axes
	let yScales: any = {}; // Scales for all of the Y-axes

	let linesComponent: Lines; // Svelte Lines component

	let hoveredLineIndex: number | null = null; // Currently hovered line
	let brushedLinesIndices = new Set<number>(); // Currently brushed lines

	const margin = { top: 35, right: 50, bottom: 10, left: 50 }; // Parallel coordinates margin

	// Set dataset and handle new dataset upload
	let dataset: DSVParsedArray<any>;
	const unsubscribe = datasetStore.subscribe((value: any) => {
		dataset = value;
		if (dataset?.length > 0) {
			dimensions = Object.keys(dataset[0]);
			dimensions = filterDimensions(dimensions);
			dimensionsInitial = dimensions;
			calculateYScales();
			brushingArray.set(new Set<number>());
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
				const dimExtent: any = extent(dataset, (d: any) => +d[dim]);
				acc[dim] = scaleLinear()
					.domain(dimExtent)
					.range([height - margin.top - margin.bottom, 0])
					.nice();
				return acc;
			}, {});
		}
	}

	function filterDimensions(dimensions: string[]) {
		const newDimensions: string[] = [];
		dimensions.forEach((dim: string) => {
			if (isNumber(dataset[0][dim])) newDimensions.push(dim);
		});
		return newDimensions;
	}

	function isNumber(item: any) {
		if (typeof item === 'number') return true;
		if (typeof item === 'string') return !isNaN(+item);
		return false;
	}

	// Handle swapped axis from Axes component
	function handleAxesSwapped(fromIndex: number, toIndex: number) {
		linesComponent.swapPoints(fromIndex, toIndex);
		dimensions = reorderArray(dimensions, fromIndex, toIndex);
	}

	// Handle start/stop of filtering
	function handleCurrentlyFiltering(isFiltering: boolean) {
		linesComponent.handleCurrentlyFiltering(isFiltering);
	}

	// Handle inverting axes
	function handleInvertAxis(axisIndex: number) {
		yScales[dimensions[axisIndex]] = yScales[dimensions[axisIndex]].domain(
			yScales[dimensions[axisIndex]].domain().reverse()
		);
	}

	// Helper function to reorder an array
	function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
		const result = [...arr];
		const [removed] = result.splice(fromIndex, 1);
		result.splice(toIndex, 0, removed);
		return result;
	}

	/* --- Handle line clicks --- */
	// Set currently hovered line
	function setHoveredLine(lineIndex: number | null) {
		hoveredLineIndex = lineIndex;
	}
	// Handle click on line
	function handleLineClick() {
		if (!hoveredLineIndex) return;

		if (brushedLinesIndices.has(hoveredLineIndex))
			brushedLinesIndices.delete(hoveredLineIndex); // Remove the index if it exists
		else brushedLinesIndices.add(hoveredLineIndex); // Add the index if it doesn't exist
		brushingArray.set(brushedLinesIndices);
	}

	onMount(() => {
		calculateYScales();
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
	id="parcoord-canvas"
	class="w-full h-full overflow-scroll-x"
	style="overflow-x: scroll !important;"
	bind:clientWidth={width}
	bind:clientHeight={height}
	on:click={() => handleLineClick()}
>
	{#if dataset?.length === 0}
		<span>No data available.</span>
	{:else if yScales && Object.keys(yScales).length !== 0}
		<Axes
			{width}
			{height}
			{dimensions}
			{margin}
			{handleAxesSwapped}
			{handleInvertAxis}
			{handleCurrentlyFiltering}
			{xScales}
			{yScales}
		/>
		<Lines
			bind:this={linesComponent}
			{width}
			{height}
			{dataset}
			initialDimensions={dimensions}
			{margin}
			{xScales}
			{yScales}
			{setHoveredLine}
		/>
	{/if}
</div>
