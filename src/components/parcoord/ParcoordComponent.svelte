<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { DSVParsedArray } from 'd3';
	import { datasetStore } from '../../stores/dataset';
	import Axes from './Axes.svelte';

	let width: number = 0;
	let height: number = 0;

	let dataset: DSVParsedArray<any>;
	const unsubscribe = datasetStore.subscribe((value: any) => {
		dataset = value;
	});

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
	{:else}<Axes {width} {height} {dataset} />{/if}
</div>
