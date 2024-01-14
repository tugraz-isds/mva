<script lang="ts">
	import { Checkbox } from 'flowbite-svelte';
	import { Cog8Tooth } from 'svelte-heros-v2';
	import { parcoordHistogramData } from '../../stores/parcoord';
	import HistogramSettingsModal from '../parcoord/HistogramSettingsModal.svelte';

	let isHistogramSettingsModalOpen: boolean = false;

	function toggleModal() {
		isHistogramSettingsModalOpen = false;
		isHistogramSettingsModalOpen = true;
	}
</script>

<div class="flex items-center">
	<span class="text-xs mr-1">Show histograms: </span>
	<Checkbox
		bind:checked={$parcoordHistogramData.visible}
		style="height: 10px; width: 10px; margin-right: 8px;"
	/>
	<Cog8Tooth
		size="16"
		class="text-grey-900 cursor-pointer hover:bg-sky-100"
		on:click={toggleModal}
	/>
</div>

<HistogramSettingsModal isOpen={isHistogramSettingsModalOpen} />
