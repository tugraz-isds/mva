<script lang="ts">
	import { onMount } from 'svelte';
	import type { View } from '../view-panel/View';
	import { ArrowsRightLeft, ArrowsPointingOut } from 'svelte-heros-v2';
	import { Dropdown, DropdownItem } from 'flowbite-svelte';

	export let views: View[];
	export let handleSwap: Function;
	export let currView: View;

	let showView: boolean = true;

	$: views = views?.filter((view: View) => view.title !== currView.title);

	function openWinbox() {
		showView = false;
		window.dispatchEvent(
			new CustomEvent('openWinbox', { detail: { title: currView.title, id: currView.id } })
		);
	}

	onMount(() => {
		window.addEventListener('closeWinbox', (event: any) => {
			if (currView.id === event.detail.id) showView = true;
		});
	});
</script>

<div class="w-full h-full p-1 {showView ? 'block' : 'hidden'}">
	<div class="flex flex-row justify-between" style="height: 5%;">
		<span>{currView.title}</span>
		<div id="{currView.id}-expand-container">
			<div class="flex flex-row gap-1">
				<ArrowsRightLeft
					id="{currView.id}-swap"
					size="24"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
				/>
				<Dropdown triggeredBy="#{currView.id}-swap" style="z-index: 3;">
					<div slot="header" class="py-1 px-2">
						<span class="font-medium block text-sm text-gray-900">Swap view with</span>
					</div>
					{#each views as view (view.id)}
						<DropdownItem
							on:click={(e) => handleSwap(currView.title, e)}
							defaultClass="py-1 px-2 text-sm hover:bg-gray-100">{view.title}</DropdownItem
						>
					{/each}
				</Dropdown>
				<ArrowsPointingOut
					id="{currView.id}-expand"
					size="24"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
					on:click={openWinbox}
				/>
			</div>
		</div>
	</div>
	<div class="view-content" style="height: 95%;">
		<svelte:component this={currView.component} />
	</div>
</div>
