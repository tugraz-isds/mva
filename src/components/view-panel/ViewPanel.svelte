<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { View } from './View';
	import { activeViewsStore } from '../../stores/views';
	import Layout_1 from './Layout-1.svelte';
	import Layout_2 from './Layout-2.svelte';
	import Layout_3 from './Layout-3.svelte';
	import Layout_4 from './Layout-4.svelte';
	import Layout_5 from './Layout-5.svelte';

	// Initialize views from store
	let activeViews: View[];
	const unsubscribeActive = activeViewsStore.subscribe((value: any) => {
		activeViews = value;
	});

	// Variables to handle dragging
	let disableTextSelection: boolean = false;
	let isDraggingVertical: boolean = false;
	let isDraggingHorizontal: boolean = false;
	let activeHorizonalDivider: number | null = null;

	/* --- HANDLE RESIZING --- */
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
			if (activeViews.length === 5) {
				activeViews[0].height =
					activeViews[1].height =
					activeViews[2].height =
						(dragY / windowHeight) * 100 - 5;
				activeViews[3].height = activeViews[4].height =
					((windowHeight - dragY) / windowHeight) * 100 + 4.5;
			} else if (activeViews.length === 3 || activeViews.length === 4) {
				activeViews[0].height = activeViews[1].height = (dragY / windowHeight) * 100 - 5;
				activeViews[2].height = activeViews[3].height =
					((windowHeight - dragY) / windowHeight) * 100 + 4.5;
			}
		}
		// Handle horizontal resize based on divider id
		else if (isDraggingHorizontal && activeHorizonalDivider) {
			const windowWidth = window.innerWidth;
			const dragX = e.clientX;
			if (activeHorizonalDivider === 1) {
				if (activeViews.length === 5) {
					activeViews[0].width = (dragX / windowWidth) * 100;
					activeViews[1].width = 100 - (activeViews[0].width + activeViews[2].width + 0.5);
				} else if (activeViews.length === 3 || activeViews.length === 4) {
					activeViews[0].width = (dragX / windowWidth) * 100;
					activeViews[1].width = ((windowWidth - dragX) / windowWidth) * 100;
				}
			} else if (activeHorizonalDivider === 2) {
				activeViews[1].width = (dragX / windowWidth) * 100 - activeViews[0].width;
				activeViews[2].width = 100 - (activeViews[0].width + activeViews[1].width + 0.5);
			} else if (activeHorizonalDivider === 3) {
				if (activeViews.length === 5) {
					activeViews[3].width = (dragX / windowWidth) * 100 - 0.25;
					activeViews[4].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
				} else if (activeViews.length === 4) {
					activeViews[2].width = (dragX / windowWidth) * 100 - 0.25;
					activeViews[3].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
				} else if (activeViews.length === 2) {
					activeViews[0].width = (dragX / windowWidth) * 100 - 0.25;
					activeViews[1].width = ((windowWidth - dragX) / windowWidth) * 100 + 0.25;
				}
			}
		} else return;
	};

	/* --- HANDLE SWAP --- */
	const handleSwap = (title: string, e: Event) => {
		// Find the indices of the two objects to swap
		const index1 = activeViews.findIndex((view: View) => view.title === title);
		const index2 = activeViews.findIndex(
			(view: View) => view.title === (e.target as HTMLElement).textContent
		);

		if (index1 !== -1 && index2 !== -1) {
			[activeViews[index1], activeViews[index2]] = [activeViews[index2], activeViews[index1]]; // Swap the objects in the array
			[activeViews[index1].width, activeViews[index2].width] = [
				activeViews[index2].width,
				activeViews[index1].width
			]; // Swap widths
		}
	};

	onDestroy(() => {
		unsubscribeActive();
	});
</script>

<div
	style="user-select: {disableTextSelection ? 'none' : 'auto'}; height: 95.5%"
	on:mousemove={handleResize}
	on:mouseup={handleMouseUp}
>
	{#if activeViews.length === 5}
		<Layout_5
			views={activeViews}
			{handleSwap}
			{handleHorizontalMouseDown}
			{handleVerticalMouseDown}
		/>
	{:else if activeViews.length === 4}
		<Layout_4
			views={activeViews}
			{handleSwap}
			{handleHorizontalMouseDown}
			{handleVerticalMouseDown}
		/>
	{:else if activeViews.length === 3}
		<Layout_3
			views={activeViews}
			{handleSwap}
			{handleHorizontalMouseDown}
			{handleVerticalMouseDown}
		/>
	{:else if activeViews.length === 2}
		<Layout_2 views={activeViews} {handleSwap} {handleHorizontalMouseDown} />
	{:else if activeViews.length === 1}
		<Layout_1 views={activeViews} {handleSwap} />
	{/if}
</div>

<style lang="scss">
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
</style>
