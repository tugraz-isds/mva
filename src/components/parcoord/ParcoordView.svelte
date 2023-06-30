<script lang="ts">
	import type { View } from '../view-panel/View';
	import { ArrowsRightLeft, ArrowsPointingOut } from 'svelte-heros-v2';
	import { Dropdown, DropdownItem } from 'flowbite-svelte';
	import ParcoordComponent from './ParcoordComponent.svelte';

	export let title: string;
	export let views: View[];
	export let handleSwap: Function;

	views = views?.filter((view: View) => view.title !== title);
</script>

<div class="w-full h-full p-1">
	<div class="flex flex-row justify-between">
		<span>{title}</span>
		<div id="parcoord-expand-container">
			<div class="flex flex-row gap-1">
				<ArrowsRightLeft
					id="parcoord-swap"
					size="24"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
				/>
				<Dropdown triggeredBy="#parcoord-swap">
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
					id="parcoord-expand"
					size="24"
					class="text-grey-900 cursor-pointer hover:bg-sky-100"
				/>
			</div>
		</div>
	</div>
	<div class="view-content overflow-hidden" style="height: 90%;"><ParcoordComponent /></div>
</div>
