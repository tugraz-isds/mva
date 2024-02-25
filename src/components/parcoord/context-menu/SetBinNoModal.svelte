<script lang="ts">
	import { Button, Modal, Label, NumberInput } from 'flowbite-svelte';
	import { parcoordDimMetadata, parcoordIsInteractable } from '../../../stores/parcoord';
	import type { DimensionMetadataType } from '../types';

	export let isOpen: boolean;
	export let dimension: string;

	let dimData: Map<string, DimensionMetadataType>;
	let currDimData: DimensionMetadataType;
	let binNo: number = 0;

	$: if (!isOpen) {
		$parcoordIsInteractable = true;
	}

	function loadData() {
		dimData = $parcoordDimMetadata;
		currDimData = dimData.get(dimension) as DimensionMetadataType;
		binNo = currDimData.binNo ?? 0;
	}

	function saveData() {
		currDimData.binNo = binNo;
		dimData.set(dimension, currDimData);
		parcoordDimMetadata.set(dimData);
		isOpen = false;
	}
</script>

<Modal bind:open={isOpen} on:open={loadData} size="xs" class="w-full">
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900">Set Number of Bins</h3>
		<div class="mb-6 flex items-center">
			<div class="flex flex-row items-center">
				<Label for="bin-no" class="mr-2">Bin no.:</Label>
				<NumberInput bind:value={binNo} id="bin-no" defaultClass="block w-1/2" size="sm" min={0} />
			</div>
		</div>
		<Button type="submit" class="w-full" on:click={saveData}>Save</Button>
	</form>
</Modal>
