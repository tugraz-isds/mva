<script lang="ts">
	import type { View } from '../view-panel/View';
	import { ArrowsRightLeft, ArrowsPointingOut } from 'svelte-heros-v2';
	import { Dropdown, DropdownItem } from 'flowbite-svelte';

	export let id: string;
	export let title: string;
	export let views: View[];
	export let handleSwap: Function;
	export let component: any;

	$: views = views?.filter((view: View) => view.title !== title);

	function openWinbox() {
		window.dispatchEvent(new CustomEvent('openWinbox', { detail: { title: title, id: id } }));
	}
</script>

<div class="w-full h-full p-1">
	<div class="flex flex-row justify-between">
		<span>{title}</span>
		<div id="{id}-expand-container">
			<div class="flex flex-row gap-1">
				<ArrowsRightLeft
					id="{id}-swap"
					size="24"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
				/>
				<Dropdown triggeredBy="#{id}-swap">
					<div slot="header" class="py-1 px-2">
						<span class="font-medium block text-sm text-gray-900">Swap view with</span>
					</div>
					{#each views as view (view.id)}
						<DropdownItem
							on:click={(e) => handleSwap(title, e)}
							defaultClass="py-1 px-2 text-sm hover:bg-gray-100">{view.title}</DropdownItem
						>
					{/each}
				</Dropdown>
				<ArrowsPointingOut
					id="{id}-expand"
					size="24"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
					on:click={openWinbox}
				/>
			</div>
		</div>
	</div>
	<div class="view-content overflow-hidden" style="height: 90%;">
		<svelte:component this={component} />
	</div>
</div>
