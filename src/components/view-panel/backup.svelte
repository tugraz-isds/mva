<script lang="ts">
	import { View, ViewPanel } from './ViewPanel';
	import SplomView from '../splom/SPLOMView.svelte';
	import ScatterplotView from '../scatterplot/ScatterplotView.svelte';
	import SimmapView from '../simmap/SimmapView.svelte';
	import TableView from '../table/TableView.svelte';
	import ParcoordView from '../parcoord/ParcoordView.svelte';

	// Initial row heights (percentages)
	let upperRowHeight = 40;
	let lowerRowHeight = 55;

	// Initial col widths (percentages)
	let tableWidth = 33.33;
	let parcoordWidth = 66.66;

	let isDraggingVertical = false;
	let isDraggingHorizontal = false;
	let disableTextSelection = false;

	function handleVerticalMouseDown() {
		isDraggingVertical = true;
	}

	function handleHorizontalMouseDown() {
		isDraggingHorizontal = true;
	}

	function handleVerticalMouseUp() {
		disableTextSelection = false;
		isDraggingVertical = false;
		isDraggingHorizontal = false;
	}

	function handleVerticalResize(e: MouseEvent) {
		if (isDraggingVertical) {
			const windowHeight = window.innerHeight;
			const dragY = e.clientY;
			upperRowHeight = (dragY / windowHeight) * 100 - 5;
			lowerRowHeight = ((windowHeight - dragY) / windowHeight) * 100 + 5;
		} else if (isDraggingHorizontal) {
			const windowWidth = window.innerWidth;
			const dragX = e.clientX;
			tableWidth = (dragX / windowWidth) * 100 - 0.25;
			parcoordWidth = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
		} else return;
		disableTextSelection = true;
	}
</script>

<div
	style="user-select: {disableTextSelection ? 'none' : 'auto'};"
	class="w-full h-full overflow-hidden"
	on:mousemove={handleVerticalResize}
	on:mouseup={handleVerticalMouseUp}
>
	<!-- Upper Row -->
	<div class="flex flex-row" style="height: {upperRowHeight}%;">
		<div class="splom-container"><SplomView /></div>
		<div class="scatterplot-container"><ScatterplotView /></div>
		<div class="simmap-container"><SimmapView /></div>
	</div>
	<!-- Draggable Vertical Divider -->
	<div
		id="dragHandleVertical"
		style="height: 0.5%;"
		class="bg-gray-400 cursor-row-resize"
		on:mousedown={handleVerticalMouseDown}
	/>
	<!-- Lower Row -->
	<div class="flex flex-row w-full" style="height: {lowerRowHeight}%;">
		<div class="table-container" style="width: {tableWidth}%;"><TableView /></div>
		<!-- Draggable Horizontal Divider -->
		<div
			id="dragHandleHorizontal3"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
			on:mousedown={handleHorizontalMouseDown}
		/>
		<div class="parcoord-container" style="width: {parcoordWidth}%;"><ParcoordView /></div>
	</div>
</div>

<style lang="scss">
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}

	.splom-container,
	.scatterplot-container,
	.simmap-container {
		height: 100%;
		width: 33.33%;
		border-right: 1px solid black;
	}
</style>
