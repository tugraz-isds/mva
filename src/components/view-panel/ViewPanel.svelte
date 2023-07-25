<script lang="ts">
	import { views as initialViews } from './Views';
	import type { View } from './View';
	import ViewComponent from './View.svelte';
	import { browser } from '$app/environment';
	import HorizontalDivider from './HorizontalDivider.svelte';
	import VerticalDivider from './VerticalDivider.svelte';

	// Initialize views
	let views: View[] = initialViews;

	// Variables to handle dragging
	let disableTextSelection: boolean = false;
	let isDraggingVertical: boolean = false;
	let isDraggingHorizontal: boolean = false;
	let activeHorizonalDivider: number | null = null;

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
			views[0].height = views[1].height = views[2].height = (dragY / windowHeight) * 100 - 5;
			views[3].height = views[4].height = ((windowHeight - dragY) / windowHeight) * 100 + 5;
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
	<div class="upper-row flex flex-row min-h-fit" style="height: {views[0].height}%;">
		<div class="view-{views[0].id}" style="width: {views[0].width}%;">
			<ViewComponent {views} {handleSwap} currView={views[0]} />
		</div>

		<HorizontalDivider id={1} {handleHorizontalMouseDown} />

		<div class="view-{views[1].id}" style="width: {views[1].width}%;">
			<ViewComponent {views} {handleSwap} currView={views[1]} />
		</div>

		<HorizontalDivider id={2} {handleHorizontalMouseDown} />

		<div class="view-{views[2].id}" style="width: {views[2].width}%;">
			<ViewComponent {views} {handleSwap} currView={views[2]} />
		</div>
	</div>

	<!-- Draggable Vertical Divider -->
	<VerticalDivider {handleVerticalMouseDown} />

	<!-- Lower Row -->
	<div class="lower-row flex flex-row" style="height: {views[3].height}%;">
		<div class="view-{views[3].id}" style="width: {views[3].width}%;">
			<ViewComponent {views} {handleSwap} currView={views[3]} />
		</div>

		<HorizontalDivider id={3} {handleHorizontalMouseDown} />

		<div class="view-{views[4].id}" style="width: {views[4].width}%;">
			<ViewComponent {views} {handleSwap} currView={views[4]} />
		</div>
	</div>
</div>

<style lang="scss">
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
</style>
