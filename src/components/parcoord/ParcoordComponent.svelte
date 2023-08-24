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
	let initialDimensions: string[] = []; // Dataset initial dimensions

	let xScales: any[] = []; // Scales for all of the X-axes
	let yScales: any = {}; // Scales for all of the Y-axes

	let linesComponent: Lines; // Svelte Lines component

	const margin = { top: 30, right: 50, bottom: 10, left: 50 }; // Parallel coordinates margin

	let dataset: DSVParsedArray<any>;
	const unsubscribe = datasetStore.subscribe((value: any) => {
		dataset = value;
		if (dataset?.length > 0) {
			initialDimensions = Object.keys(dataset[0]);
			dimensions = initialDimensions;
		}
	});

	// Update yScales when dataset changes
	$: {
		if (dataset) {
			dimensions = initialDimensions;
			yScales = initialDimensions.reduce((acc: any, dim: string) => {
				const dimExtent: any = extent(dataset, (d: any) => +d[dim]);
				acc[dim] = scaleLinear()
					.domain(dimExtent)
					.range([height - margin.top - margin.bottom, 0]);
				return acc;
			}, {});
		}
	}

	// Update xScale when dimensions change
	$: {
		if (width > 0 && initialDimensions) {
			xScales = initialDimensions.map((_, i) =>
				scaleLinear()
					.domain([0, initialDimensions.length - 1])
					.range([
						margin.left,
						width < 100 * initialDimensions.length
							? initialDimensions.length * 100 - margin.right
							: width - margin.right
					])(i)
			);
		}
	}

	// Handle swapped axis from Axes component
	function handleAxesSwapped(fromIndex: number, toIndex: number) {
		linesComponent.swapPoints(fromIndex, toIndex);
	}

	function handleFiltering(axisIndex: number, filterStart: number, filterEnd: number) {
		linesComponent.applyFilters(axisIndex, filterStart, filterEnd);
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
			initialDimensions={dimensions}
			{margin}
			{handleAxesSwapped}
			{handleFiltering}
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
