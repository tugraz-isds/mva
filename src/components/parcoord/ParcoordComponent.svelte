<script lang="ts">
	import { onDestroy } from 'svelte';
	import { datasetStore } from '../../stores/dataset';
	import { scaleLinear, extent } from 'd3';
	import type { DSVParsedArray } from 'd3';
	import Axes from './Axes.svelte';
	import Lines from './Lines.svelte';

	let width: number = 0;
	let height: number = 0;
	let dimensions: string[] = []; // Dataset dimensions
	let dimensionsInitial: string[] = []; // Dataset initial dimensions

	let xScales: any[] = []; // Scales for all of the X-axes
	let yScales: any = {}; // Scales for all of the Y-axes

	let linesComponent: Lines; // Svelte Lines component

	const margin = { top: 35, right: 50, bottom: 10, left: 50 }; // Parallel coordinates margin

	let dataset: DSVParsedArray<any>;
	const unsubscribe = datasetStore.subscribe((value: any) => {
		dataset = value;
		if (dataset?.length > 0) {
			dimensions = Object.keys(dataset[0]);
			dimensions = filterDimensions(dimensions);
			dimensionsInitial = dimensions;
		}
	});

	// Update yScales when dataset changes
	$: {
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

	// Handle axis filtering
	function handleFiltering(axisIndex: number, filterStart: number, filterEnd: number) {
		linesComponent.applyFilters(axisIndex, filterStart, filterEnd);
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

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div
	id="parcoord-canvas"
	class="w-full h-full overflow-scroll-x"
	style="overflow-x: scroll !important;"
	bind:clientWidth={width}
	bind:clientHeight={height}
>
	{#if dataset?.length === 0}
		<span>No data available.</span>
	{:else}
		<Axes
			{width}
			{height}
			{dimensions}
			{margin}
			{handleAxesSwapped}
			{handleFiltering}
			{handleInvertAxis}
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
		/>
	{/if}
</div>
