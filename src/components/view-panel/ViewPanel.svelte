<script lang="ts">
	import { onMount } from 'svelte';
	import type { View } from './View';
	import SplomView from '../splom/SPLOMView.svelte';
	import ScatterplotView from '../scatterplot/ScatterplotView.svelte';
	import SimmapView from '../simmap/SimmapView.svelte';
	import TableView from '../table/TableView.svelte';
	import ParcoordView from '../parcoord/ParcoordView.svelte';

	// Initialize views
	let views: View[] = [
		{
			id: 'splom',
			title: 'Scatterplot Matrix View',
			width: 33,
			component: SplomView
		},
		{
			id: 'scatterplot',
			title: 'Scatterplot View',
			width: 33,
			component: ScatterplotView
		},
		{
			id: 'simmap',
			title: 'Similarity Map View',
			width: 33,
			component: SimmapView
		},
		{
			id: 'table',
			title: 'Table View',
			width: 33,
			component: TableView
		},
		{
			id: 'parcoord',
			title: 'Parallel Coordinates View',
			width: 66.66,
			component: ParcoordView
		}
	];

	// Variables to handle dragging
	let disableTextSelection: boolean = false;
	let isDraggingVertical: boolean = false;
	let isDraggingHorizontal: boolean = false;
	let activeHorizonalDivider: number | null = null;

	// Upper and lower row height (percentages)
	let upperRowHeight: number = 40;
	let lowerRowHeight: number = 55;

	const handleVerticalMouseDown = () => {
		isDraggingVertical = true;
		disableTextSelection = true;
	};

	const handleHorizontalMouseDown = (e: MouseEvent) => {
		if (!(e.target instanceof Element)) return;
		const dividerId = e.target.id.match(/\d+$/);
		activeHorizonalDivider = dividerId ? parseInt(dividerId[0]) : null;
		isDraggingHorizontal = true;
		disableTextSelection = true;
	};

	const handleMouseUp = () => {
		disableTextSelection = false;
		isDraggingVertical = false;
		isDraggingHorizontal = false;
		activeHorizonalDivider = null;
	};

	const handleResize = (e: MouseEvent) => {
		// Handle vertical resize
		if (isDraggingVertical) {
			const windowHeight = window.innerHeight;
			const dragY = e.clientY;
			upperRowHeight = (dragY / windowHeight) * 100 - 5;
			lowerRowHeight = ((windowHeight - dragY) / windowHeight) * 100 + 5;
		}
		// Handle horizontal resize based on divider id
		else if (isDraggingHorizontal && activeHorizonalDivider) {
			const windowWidth = window.innerWidth;
			const dragX = e.clientX;
			if (activeHorizonalDivider === 1) {
				views[0].width = (dragX / windowWidth) * 100;
				views[1].width = 100 - (views[0].width + views[2].width + 0.5);
			} else if (activeHorizonalDivider === 2) {
				views[1].width = (dragX / windowWidth) * 100 - views[0].width;
				views[2].width = 100 - (views[0].width + views[1].width + 0.5);
			} else if (activeHorizonalDivider === 3) {
				views[3].width = (dragX / windowWidth) * 100 - 0.25;
				views[4].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
			}
		} else return;
	};

	const handleSwap = (title: string, e: Event) => {
		// Find the indices of the two objects to swap
		const index1 = views.findIndex((view: View) => view.title === title);
		const index2 = views.findIndex(
			(view: View) => view.title === (e.target as HTMLElement).textContent
		);

		if (index1 !== -1 && index2 !== -1) {
			[views[index1], views[index2]] = [views[index2], views[index1]]; // Swap the objects in the array
			[views[index1].width, views[index2].width] = [views[index2].width, views[index1].width]; // Swap widths
		}
	};
</script>

<div
	style="user-select: {disableTextSelection ? 'none' : 'auto'};"
	class="h-full overflow-hidden"
	on:mousemove={handleResize}
	on:mouseup={handleMouseUp}
>
	<!-- Upper Row -->
	<div class="upper-row flex flex-row min-h-fit" style="height: {upperRowHeight}%;">
		<div class="view-{views[0].id}" style="width: {views[0].width}%;">
			<svelte:component
				this={views[0].component}
				id={views[0].id}
				title={views[0].title}
				{views}
				{handleSwap}
			/>
		</div>

		<!-- Draggable Horizontal Divider 1 -->
		<div
			id="dragHandleHorizontal1"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
			on:mousedown={handleHorizontalMouseDown}
		/>

		<div class="view-{views[1].id}" style="width: {views[1].width}%;">
			<svelte:component
				this={views[1].component}
				id={views[1].id}
				title={views[1].title}
				{views}
				{handleSwap}
			/>
		</div>

		<!-- Draggable Horizontal Divider 2 -->
		<div
			id="dragHandleHorizontal2"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
			on:mousedown={handleHorizontalMouseDown}
		/>

		<div class="view-{views[2].id}" style="width: {views[2].width}%;">
			<svelte:component
				this={views[2].component}
				id={views[2].id}
				title={views[2].title}
				{views}
				{handleSwap}
			/>
		</div>
	</div>

	<!-- Draggable Vertical Divider -->
	<div
		id="dragHandleVertical"
		style="height: 0.5%;"
		class="bg-gray-400 cursor-row-resize"
		on:mousedown={handleVerticalMouseDown}
	/>

	<!-- Lower Row -->
	<div class="lower-row flex flex-row" style="height: {lowerRowHeight}%;">
		<div class="view-{views[3].id}" style="width: {views[3].width}%;">
			<svelte:component
				this={views[3].component}
				id={views[3].id}
				title={views[3].title}
				{views}
				{handleSwap}
			/>
		</div>

		<!-- Draggable Horizontal Divider 3 -->
		<div
			id="dragHandleHorizontal3"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
			on:mousedown={handleHorizontalMouseDown}
		/>

		<div class="view-{views[4].id}" style="width: {views[4].width}%;">
			<svelte:component
				this={views[4].component}
				id={views[4].id}
				title={views[4].title}
				{views}
				{handleSwap}
			/>
		</div>
	</div>
</div>

<style lang="scss">
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
</style>
