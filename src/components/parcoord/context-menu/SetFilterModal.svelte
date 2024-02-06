<script lang="ts">
	import { Button, Modal, Label, Input, Helper } from 'flowbite-svelte';
	import {
		parcoordDimMetadata,
		parcoordIsInteractable,
		filtersArray
	} from '../../../stores/parcoord';
	import { dimensionDataStore } from '../../../stores/dataset';

	export let isOpen: boolean;
	export let dimension: string;
	export let yScales: any;
	export let dimIndex: number;

	let filterStart: number, filterEnd: number;
	let validUpload: boolean = true;
	let errorMessage: string = '';

	function loadData() {
		const numberOfDecimals = $dimensionDataStore.get(dimension)?.numberOfDecimals;
		const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
		filterStart = isAxisInverted
			? yScales[dimension].invert($filtersArray[dimIndex].pixels.start).toFixed(numberOfDecimals)
			: yScales[dimension].invert($filtersArray[dimIndex].pixels.end).toFixed(numberOfDecimals);
		filterEnd = isAxisInverted
			? yScales[dimension].invert($filtersArray[dimIndex].pixels.end).toFixed(numberOfDecimals)
			: yScales[dimension].invert($filtersArray[dimIndex].pixels.start).toFixed(numberOfDecimals);
	}

	function setAxisRange() {
		const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
		const min: number = $dimensionDataStore.get(dimension)?.min as number;
		const max: number = $dimensionDataStore.get(dimension)?.max as number;
		if (filterEnd > max) {
			validUpload = false;
			errorMessage = `Highest value of dimension is ${max}. You cannot set the filter value higher than that.`;
			return;
		}
		if (filterStart < min) {
			validUpload = false;
			errorMessage = `Lowest value of dimension is ${min}. You cannot set the filter value lower than that.`;
			return;
		}

		validUpload = true;
		closeSetRangeModal();

		// Calculate new filter values
		const filtersTemp = $filtersArray;
		filtersTemp[dimIndex] = {
			pixels: {
				start: isAxisInverted ? yScales[dimension](filterStart) : yScales[dimension](filterEnd),
				end: isAxisInverted ? yScales[dimension](filterEnd) : yScales[dimension](filterStart)
			},
			percentages: {
				start: null,
				end: null
			}
		};

		$filtersArray = filtersTemp;
	}

	function closeSetRangeModal() {
		isOpen = false;
		$parcoordIsInteractable = true;
	}
</script>

<Modal
	bind:open={isOpen}
	on:open={loadData}
	on:closed={closeSetRangeModal}
	size="xs"
	class="w-full"
>
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900">Set Filter Values</h3>
		<div class="mb-6 flex items-center">
			<div class="flex flex-row items-center">
				<Label for="filter-min" class="mr-2">Start:</Label>
				<Input
					bind:value={filterStart}
					on:change={() => (validUpload = true)}
					id="filter-min"
					defaultClass="block w-1/2"
					size="sm"
				/>
			</div>
			<div class="flex flex-row items-center">
				<Label for="filter-max" class="mr-2">End:</Label>
				<Input
					bind:value={filterEnd}
					on:change={() => (validUpload = true)}
					id="filter-max"
					defaultClass="block w-1/2"
					size="sm"
				/>
			</div>
		</div>
		{#if !validUpload}
			<Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
		{/if}
		<Button type="submit" class="w-full" on:click={() => setAxisRange()}>Save</Button>
	</form>
</Modal>
