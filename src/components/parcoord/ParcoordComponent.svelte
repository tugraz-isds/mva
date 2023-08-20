<script lang="ts">
	import { onDestroy } from 'svelte';
	import { datasetStore } from '../../stores/dataset';
	import type { DSVParsedArray } from 'd3';
	import Axes from './Axes.svelte';
	import Lines from './Lines.svelte';

	let width: number = 0;
	let height: number = 0;
	let dimensions: string[] = []; // Dataset dimensions

	let linesComponent: Lines; // Svelte Lines component

	const margin = { top: 30, right: 50, bottom: 10, left: 50 }; // Parallel coordinates margin

	let dataset: DSVParsedArray<any>;
	const unsubscribe = datasetStore.subscribe((value: any) => {
		dataset = value;
		if (dataset?.length > 0) dimensions = Object.keys(dataset[0]);
	});

	// Handle swapped axis from Axes component
	function handleAxesSwapped(fromIndex: number, toIndex: number) {
		linesComponent.swapPoints(fromIndex, toIndex);
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
		<Axes {width} {height} {dataset} initialDimensions={dimensions} {margin} {handleAxesSwapped} />
		<Lines
			bind:this={linesComponent}
			{width}
			{height}
			{dataset}
			initialDimensions={dimensions}
			{margin}
		/>
	{/if}
</div>
