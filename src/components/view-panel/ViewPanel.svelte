<script lang="ts">
	import { onMount } from 'svelte';
	import { View, ViewPanel } from './ViewPanel';
	import SplomView from '../splom/SPLOMView.svelte';
	import ScatterplotView from '../scatterplot/ScatterplotView.svelte';
	import SimmapView from '../simmap/SimmapView.svelte';
	import TableView from '../table/TableView.svelte';
	import ParcoordView from '../parcoord/ParcoordView.svelte';

	// Initialize views
	const initialViews: View[] = [
		new View('splom-container', 33.33, 100, 0, SplomView),
		new View('scatterplot-container', 33.33, 100, 1, ScatterplotView),
		new View('simmap-container', 33.33, 100, 2, SimmapView),
		new View('table-container', 33.33, 100, 3, TableView),
		new View('parcoord-container', 66.66, 100, 4, ParcoordView)
	];

	const viewPanel: ViewPanel = new ViewPanel(initialViews);
</script>

<div
	style="user-select: {viewPanel.disableTextSelection ? 'none' : 'auto'};"
	class="w-full h-full overflow-hidden"
	on:mousemove={viewPanel.handleVerticalResize}
	on:mouseup={viewPanel.handleMouseUp}
>
	<!-- Upper Row -->
	<div class="flex flex-row" style="height: {viewPanel.upperRowHeight}%;">
		{#each viewPanel.views.slice(0, 3) as view (view.className)}
			<div class={view.className} style="width: {view.width}%;">
				<svelte:component this={view.component} />
			</div>
		{/each}
	</div>

	<!-- Draggable Vertical Divider -->
	<div
		id="dragHandleVertical"
		style="height: 0.5%;"
		class="bg-gray-400 cursor-row-resize"
		on:mousedown={viewPanel.handleVerticalMouseDown}
	/>

	<!-- Lower Row -->
	<div class="flex flex-row" style="height: {viewPanel.lowerRowHeight}%;">
		<div class={viewPanel.views[3].className} style="width: {viewPanel.views[3].width}%;">
			<svelte:component this={viewPanel.views[3].component} />
		</div>
		<!-- Draggable Horizontal Divider -->
		<div
			id="dragHandleHorizontal3"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
		/>
		<div class={viewPanel.views[4].className} style="width: {viewPanel.views[4].width}%;">
			<svelte:component this={viewPanel.views[4].component} />
		</div>
	</div>
</div>

<style lang="scss">
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
	.splom-container,
	.scatterplot-container,
	.simmap-container {
		border-right: 1px solid black;
	}
</style>
