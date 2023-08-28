<script lang="ts">
	import { onDestroy } from 'svelte';
	import { datasetStore } from '../../stores/dataset';
	import { linkingArray } from '../../stores/linking';
	import { brushingArray, hoveredItem } from '../../stores/brushing';
	import type { DSVParsedArray } from 'd3';

	let rowShow: boolean[] = []; // Array of booleans that store info if each table row should be drawn
	let hoveredLineIndex: number | null = null; // Currently hovered line
	let brushedRowsIndices = new Set<number>(); // Currently brushed rows

	let dataset: DSVParsedArray<any>;
	const unsubscribeDataset = datasetStore.subscribe((value: any) => {
		dataset = value;
	});

	const unsubscribeLinking = linkingArray.subscribe((value: any) => {
		if (dataset?.length > 0) {
			rowShow = value;
		}
	});

	const unsubscribeBrushing = brushingArray.subscribe((value: any) => {
		if (dataset?.length > 0) brushedRowsIndices = value;
	});

	const unsubscribeHovered = hoveredItem.subscribe((value: number | null) => {
		hoveredLineIndex = value;
	});

	// Handle click on row
	function handleRowClick() {
		if (hoveredLineIndex === null) return;
		if (brushedRowsIndices.has(hoveredLineIndex))
			brushedRowsIndices.delete(hoveredLineIndex); // Remove the index if it exists
		else brushedRowsIndices.add(hoveredLineIndex); // Add the index if it doesn't exist
		brushingArray.set(brushedRowsIndices);
	}

	onDestroy(() => {
		unsubscribeDataset();
		unsubscribeLinking();
		unsubscribeBrushing();
		unsubscribeHovered();
	});
</script>

<div class="w-full h-full overflow-scroll-x" style="overflow-x: scroll !important;">
	{#if dataset?.length > 0 && rowShow?.length > 0}
		<table id="table-canvas" class="w-full">
			<tr>
				{#each Object.keys(dataset[0]) as key}
					<th>{key}</th>
				{/each}
			</tr>
			{#each dataset as row, index}
				<tr
					class="{hoveredLineIndex === index
						? 'bg-red-500'
						: brushedRowsIndices.has(index)
						? 'bg-orange-400'
						: ''}
						{rowShow[index] ? 'text-black' : 'text-gray-400'}"
					on:mouseenter={() => hoveredItem.set(index)}
					on:mouseleave={() => hoveredItem.set(null)}
					on:mousedown={handleRowClick}
				>
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
