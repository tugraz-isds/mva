<script lang="ts">
	import { Button, Modal, Label, NumberInput, Helper } from 'flowbite-svelte';
	import { parcoordHistogramData } from '../../stores/parcoord';
	import type { HistogramsType } from './types';

	export let isOpen: boolean;

	let histogramSettings: HistogramsType;

	function checkData() {
		histogramSettings.fillOpacity = Math.max(0, Math.min(1, histogramSettings.fillOpacity));
		histogramSettings.strokeOpacity = Math.max(0, Math.min(1, histogramSettings.strokeOpacity));
		histogramSettings.scale = Math.max(0, Math.min(1, histogramSettings.scale));
	}

	function loadData() {
		histogramSettings = $parcoordHistogramData;
	}

	function saveData() {
		parcoordHistogramData.set(histogramSettings);
		isOpen = false;
	}
</script>

<Modal bind:open={isOpen} on:open={loadData} size="xs" class="w-full">
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="text-xl font-medium text-gray-900">Histogram Settings</h3>
		<div>
			<div class="flex items-center">
				<Label for="fill-opacity-input" class="w-1/4">Fill opacity:</Label>
				<NumberInput
					id="fill-opacity-input"
					bind:value={histogramSettings.fillOpacity}
					on:change={checkData}
					defaultClass="block w-1/5"
					size="sm"
					step={0.1}
					min={0}
					max={1}
				/>
			</div>
			<div class="mb-6 flex items-center">
				<span class="w-1/4 bg-red-300" />
				<Helper class="text-xs w-3/4">Fill opacity of bins. Select a number from 0 to 1.</Helper>
			</div>

			<div class="flex items-center">
				<Label for="stroke-opacity-input" class="w-1/4">Stroke opacity:</Label>
				<NumberInput
					id="stroke-opacity-input"
					bind:value={histogramSettings.strokeOpacity}
					on:change={checkData}
					defaultClass="block w-1/5"
					size="sm"
					step={0.1}
					min={0}
					max={1}
				/>
			</div>
			<div class="mb-6 flex items-center">
				<span class="w-1/4 bg-red-300" />
				<Helper class="text-xs w-3/4">Stroke opacity of bins. Select a number from 0 to 1.</Helper>
			</div>

			<div class="flex items-center">
				<Label for="scale-input" class="w-1/4">Bins scale:</Label>
				<NumberInput
					id="scale-input"
					bind:value={histogramSettings.scale}
					on:change={checkData}
					defaultClass="block w-1/5"
					size="sm"
					step={0.1}
					min={0}
					max={1}
				/>
			</div>
			<div class="mb-6 flex items-center">
				<span class="w-1/4 bg-red-300" />
				<Helper class="text-xs w-3/4"
					>Bins scale as percentage of distance between two axes. Select a number from 0 to 1.</Helper
				>
			</div>

			<Button type="submit" class="w-full" on:click={saveData}>Save</Button>
		</div>
	</form>
</Modal>
