<script lang="ts">
	import { onDestroy } from 'svelte';
	import { datasetStore } from '../../stores/dataset';
	import { linkingArray } from '../../stores/linking';
	import {
		brushedArray,
		hoveredArray,
		previouslyHoveredArray,
		previouslyBrushedArray
	} from '../../stores/brushing';
	import ContextMenu from './ContextMenu.svelte';
	import type { DSVParsedArray } from 'd3';

	let contextMenu: ContextMenu;

	let rowShow: boolean[] = []; // Array of booleans that store info if each table row should be drawn
	let hoveredLineIndex: number | null = null; // Currently hovered line
	let hoveredRowsIndices: Set<number> = new Set(); // Currently hovered rows
	let brushedRowsIndices: Set<number> = new Set(); // Currently brushed rows

	// Selection range
	let rangeStart: number | null = null; // Start of range of rows
	let rangeEnd: number | null = null; // End of range of rows

	let dataset: DSVParsedArray<any>;
	const unsubscribeDataset = datasetStore.subscribe((value: any) => {
		dataset = value;
	});

	const unsubscribeLinking = linkingArray.subscribe((value: any) => {
		if (dataset?.length > 0) {
			rowShow = value;
		}
	});

	const unsubscribeBrushing = brushedArray.subscribe((value: any) => {
		if (dataset?.length > 0) brushedRowsIndices = value;
	});

	const unsubscribeHovered = hoveredArray.subscribe((value: Set<number>) => {
		previouslyHoveredArray.set(hoveredRowsIndices);
		hoveredRowsIndices = value;
	});

	// Handle click on row
	function handleRowClick(event: MouseEvent) {
		previouslyBrushedArray.set(brushedRowsIndices);
		if (hoveredLineIndex === null) return;

		if (event.ctrlKey) {
			// Toggle the selection of individual items with Ctrl key
			if (brushedRowsIndices.has(hoveredLineIndex)) {
				brushedRowsIndices.delete(hoveredLineIndex);
			} else {
				brushedRowsIndices.add(hoveredLineIndex);
			}
		} else if (event.shiftKey) {
			// Select a range of items with Shift key
			if (rangeStart !== null) {
				const tempStart = Math.min(rangeStart, hoveredLineIndex);
				const tempEnd = Math.max(rangeStart, hoveredLineIndex);
				brushedRowsIndices.clear();
				for (let i = tempStart; i <= tempEnd; i++) {
					brushedRowsIndices.add(i);
				}
			} else {
				brushedRowsIndices.clear();
				brushedRowsIndices.add(hoveredLineIndex);
				rangeStart = rangeEnd = hoveredLineIndex;
			}
		} else {
			// Select a single item without Ctrl or Shift
			if (brushedRowsIndices.size === 1 && brushedRowsIndices.has(hoveredLineIndex))
				brushedRowsIndices.clear();
			else {
				brushedRowsIndices.clear();
				brushedRowsIndices.add(hoveredLineIndex);
				rangeStart = rangeEnd = hoveredLineIndex;
			}
		}

		brushedArray.set(brushedRowsIndices);
		window.getSelection()?.removeAllRanges(); // Remove selection from text
	}

	function handleMouseEnter(index: number) {
		hoveredLineIndex = index;
		hoveredArray.set(new Set([hoveredLineIndex]));
	}

	function handleMouseLeave() {
		previouslyHoveredArray.set(new Set([hoveredLineIndex as number]));
		hoveredLineIndex = null;
		hoveredRowsIndices.clear();
	}

	onDestroy(() => {
		unsubscribeDataset();
		unsubscribeLinking();
		unsubscribeBrushing();
		unsubscribeHovered();
	});
</script>

<ContextMenu bind:this={contextMenu} />
<div class="w-full h-full overflow-scroll-x" style="overflow-x: scroll !important;">
	{#if dataset?.length > 0 && rowShow?.length > 0}
		<table id="table-canvas" class="w-full">
			<tr>
				{#each Object.keys(dataset[0]) as key}
					<th on:contextmenu={(e) => contextMenu.showContextMenu(e, key)}>{key}</th>
				{/each}
			</tr>
			{#each dataset as row, index}
				<tr
					class="{hoveredLineIndex === index || hoveredRowsIndices.has(index)
						? 'bg-red-500'
						: brushedRowsIndices.has(index)
						? 'bg-orange-400'
						: ''}
						{rowShow[index] ? 'text-black' : 'text-gray-400'}"
					on:mouseenter={() => handleMouseEnter(index)}
					on:mouseleave={handleMouseLeave}
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
