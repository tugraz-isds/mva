<script lang="ts">
	import { onDestroy } from 'svelte';
	import { ArrowsRightLeft, ArrowsPointingOut, BookmarkSquare } from 'svelte-heros-v2';
	import { openWindow } from 'svelte-window-system';
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import { activeViewsStore } from '../../stores/views';
	import type { View } from './ViewType';

	export let otherViews: View[];
	export let handleSwap: Function;
	export let currView: View;

	// Get active views from store
	let activeViews: View[];
	const unsubscribeActive = activeViewsStore.subscribe((value: any) => {
		activeViews = value;
	});

	let showView: boolean = true;

	$: otherViews = otherViews?.filter((view: View) => view.title !== currView.title);

	function openWinbox() {
		showView = false;
		activeViewsStore.set(activeViews.filter((view: View) => view.title !== currView.title));
		openWindow(currView.component, {
			width: window.innerWidth * 0.8,
			height: window.innerHeight * 0.8,
			title: currView.title,
			customTitlebarClass: 'bg-sky-900 font-sans'
			//customTitlebarButtons: [{ value: 'X', callback: () => {} }]
		});
	}

	// onMount(() => {
	// 	window.addEventListener('closeWinbox', (event: any) => {
	// 		if (currView.id === event.detail.id) {
	// 			showView = true;
	// 			activeViewsStore.set([...activeViews, currView]);
	// 		}
	// 	});
	// });

	function saveSVG() {
		const event = new Event(`call-save-svg-${currView.id}`);
		window.dispatchEvent(event);
	}

	onDestroy(() => {
		unsubscribeActive();
	});
</script>

<div class="w-full h-full p-1 {showView ? 'block' : 'hidden'}">
	<div class="flex flex-row justify-between" style="height: 18px; font-size: 14px;">
		<span>{currView.title}</span>
		<div id="{currView.id}-expand-container">
			<div class="flex flex-row gap-1">
				<ArrowsRightLeft
					id="{currView.id}-swap"
					size="16"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
				/>
				<Dropdown triggeredBy="#{currView.id}-swap" style="z-index: 3;">
					<div slot="header" class="py-1 px-2">
						<span class="font-medium block text-sm text-gray-900">Swap view with</span>
					</div>
					{#each otherViews as view (view.id)}
						<DropdownItem
							on:click={(e) => handleSwap(currView.title, e)}
							defaultClass="py-1 px-2 text-sm hover:bg-gray-100">{view.title}</DropdownItem
						>
					{/each}
				</Dropdown>
				<ArrowsPointingOut
					id="{currView.id}-expand"
					size="16"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
					on:click={openWinbox}
				/>
				{#if currView.id === 'parcoord'}
					<BookmarkSquare
						id="{currView.id}-save"
						size="16"
						class="text-grey-900 cursor-pointer hover:bg-sky-100"
						on:click={saveSVG}
					/>
				{/if}
			</div>
		</div>
	</div>
	<div class="view-content" style="height: 95%;">
		{#if currView.id === 'parcoord'}
			<svelte:component this={currView.component} />
		{:else}
			<svelte:component this={currView.component} />
		{/if}
	</div>
</div>
