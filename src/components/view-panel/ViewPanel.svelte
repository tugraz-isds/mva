<script lang="ts">
	import View from './View';
	import SplomView from '../splom/SPLOMView.svelte';
	import ScatterplotView from '../scatterplot/ScatterplotView.svelte';
	import SimmapView from '../simmap/SimmapView.svelte';
	import TableView from '../table/TableView.svelte';
	import ParcoordView from '../parcoord/ParcoordView.svelte';

	// Initialize views
	const views: View[] = [
		new View(0, 33, 0, SplomView),
		new View(1, 33, 1, ScatterplotView),
		new View(2, 33, 2, SimmapView),
		new View(3, 33, 3, TableView),
		new View(4, 66.66, 4, ParcoordView)
	];

	const orderedViews: View[] = views;

	// Variables to handle dragging
	let disableTextSelection: boolean = false;
	let isDraggingVertical: boolean = false;
	let isDraggingHorizontal: boolean = false;
	let activeHorizonalDivider: number | null = null;

	// Upper and lower row height (percentages)
	let upperRowHeight: number = 40;
	let lowerRowHeight: number = 55;

	// Functions that handle dragging
	const handleVerticalMouseDown = () => {
		isDraggingVertical = true;
		disableTextSelection = true;
	};

	const handleHorizontalMouseDown = (e: MouseEvent) => {
		if (!(e.target instanceof Element)) return;
		const match = e.target.id.match(/\d+$/);
		activeHorizonalDivider = match ? parseInt(match[0]) : null;
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
		if (isDraggingVertical) {
			const windowHeight = window.innerHeight;
			const dragY = e.clientY;
			upperRowHeight = (dragY / windowHeight) * 100 - 5;
			lowerRowHeight = ((windowHeight - dragY) / windowHeight) * 100 + 5;
		} else if (isDraggingHorizontal && activeHorizonalDivider) {
			const windowWidth = window.innerWidth;
			const dragX = e.clientX;
			if (activeHorizonalDivider === 1) {
				orderedViews[0].width = (dragX / windowWidth) * 100;
				orderedViews[1].width = 100 - (orderedViews[0].width + orderedViews[2].width + 0.5);
				console.log(
					orderedViews[0].width,
					orderedViews[1].width,
					orderedViews[2].width,
					orderedViews[0].width + orderedViews[1].width + orderedViews[2].width
				);
			} else if (activeHorizonalDivider === 2) {
				orderedViews[1].width = (dragX / windowWidth) * 100 - orderedViews[0].width;
				orderedViews[2].width = 100 - (orderedViews[0].width + orderedViews[1].width + 0.5);
			} else if (activeHorizonalDivider === 3) {
				orderedViews[3].width = (dragX / windowWidth) * 100 - 0.25;
				orderedViews[4].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
			}
		} else return;
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
		<div class="view-{orderedViews[0].id}" style="width: {orderedViews[0].width}%;">
			<svelte:component this={orderedViews[0].component} />
		</div>

		<!-- Draggable Horizontal Divider -->
		<div
			id="dragHandleHorizontal1"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
			on:mousedown={handleHorizontalMouseDown}
		/>

		<div class="view-{orderedViews[1].id}" style="width: {orderedViews[1].width}%;">
			<svelte:component this={orderedViews[1].component} />
		</div>

		<!-- Draggable Horizontal Divider -->
		<div
			id="dragHandleHorizontal2"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
			on:mousedown={handleHorizontalMouseDown}
		/>

		<div class="view-{orderedViews[2].id}" style="width: {orderedViews[2].width}%;">
			<svelte:component this={orderedViews[2].component} />
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
		<div class="view-{orderedViews[3].id}" style="width: {orderedViews[3].width}%;">
			<svelte:component this={orderedViews[3].component} />
		</div>

		<!-- Draggable Horizontal Divider -->
		<div
			id="dragHandleHorizontal3"
			style="width: 0.25%;"
			class="h-full bg-gray-400 cursor-col-resize"
			on:mousedown={handleHorizontalMouseDown}
		/>

		<div class="view-{orderedViews[4].id}" style="width: {orderedViews[4].width}%;">
			<svelte:component this={orderedViews[4].component} />
		</div>
	</div>
</div>

<style lang="scss">
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
</style>
