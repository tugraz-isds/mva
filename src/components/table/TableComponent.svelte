<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { DSVParsedArray } from 'd3';
	import { datasetStore } from '../../stores/dataset';

	let dataset: DSVParsedArray<any>;
	const unsubscribe = datasetStore.subscribe((value: any) => {
		dataset = value;
	});

	onDestroy(() => {
		unsubscribe();
	});
</script>

<div class="w-full h-full overflow-scroll-x" style="overflow-x: scroll !important;">
	{#if dataset && dataset.length > 0}
		<table id="table-canvas" class="w-full">
			<tr>
				{#each Object.keys(dataset[0]) as key}
					<th>{key}</th>
				{/each}
			</tr>
			{#each dataset as row}
				<tr>
					{#each Object.keys(row) as key}
						<td>{row[key]}</td>
					{/each}
				</tr>
			{/each}
		</table>
	{:else}
		<span>No data available.</span>
	{/if}
</div>

<style>
	table,
	th,
	td {
		border: 1px solid black;
		font-size: 0.9em;
	}
</style>
