<script lang="ts">
	import { Button, Modal, Label, Input, Helper } from 'flowbite-svelte';
	import {
		parcoordCustomAxisRanges,
		parcoordDimMetadata,
		parcoordIsInteractable,
		filtersArray
	} from '../../stores/parcoord';
	import { dimensionDataStore } from '../../stores/dataset';
	import { scaleLinear, type DSVParsedArray } from 'd3';

	export let isOpen: boolean;
	export let dimension: string;
	export let yScales: any;
	export let dimIndex: number;

	let rangeStart: number, rangeEnd: number;
	let validUpload: boolean = true; // If false show error message
	let errorMessage: string = '';

	function loadData() {
		const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
		rangeStart = isAxisInverted ? yScales[dimension].domain()[1] : yScales[dimension].domain()[0];
		rangeEnd = isAxisInverted ? yScales[dimension].domain()[0] : yScales[dimension].domain()[1];
	}

	function setAxisRange() {
		const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
		const min: number = $dimensionDataStore.get(dimension)?.min as number;
		const max: number = $dimensionDataStore.get(dimension)?.max as number;
		if (rangeEnd < max) {
			validUpload = false;
			errorMessage = `Highest value of dimension is ${max}. You cannot set the range lower than that.`;
			return;
		}
		if (rangeStart > min) {
			validUpload = false;
			errorMessage = `Lowest value of dimension is ${min}. You cannot set the range higher than that.`;
			return;
		}

		validUpload = true;
		const customRanges = $parcoordCustomAxisRanges;
		customRanges.set(dimension, {
			start: isAxisInverted ? rangeEnd : rangeStart,
			end: isAxisInverted ? rangeStart : rangeEnd
		});
		closeSetRangeModal();

		// Calculate new filter values
		const filtersTemp = $filtersArray[dimIndex].percentages;
		const originalScale = scaleLinear().domain(yScales[dimension].domain()).range([0, 1]);
		const newScale = scaleLinear()
			.domain(isAxisInverted ? [rangeEnd, rangeStart] : [rangeStart, rangeEnd])
			.range([0, 1]);
		const originalStart = originalScale.invert(1 - (filtersTemp.start as number));
		const originalEnd = originalScale.invert(1 - (filtersTemp.end as number));
		$filtersArray[dimIndex].percentages = {
			start: 1 - newScale(originalStart),
			end: 1 - newScale(originalEnd)
		};

		$parcoordCustomAxisRanges = customRanges;
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
		<h3 class="mb-4 text-xl font-medium text-gray-900">Set Axis Range</h3>
		<div class="mb-6 flex items-center">
			<div class="flex flex-row items-center">
				<Label for="range-min" class="mr-2">Start:</Label>
				<Input
					bind:value={rangeStart}
					on:change={() => (validUpload = true)}
					id="range-min"
					defaultClass="block w-1/2"
					size="sm"
				/>
			</div>
			<div class="flex flex-row items-center">
				<Label for="range-max" class="mr-2">End:</Label>
				<Input
					bind:value={rangeEnd}
					on:change={() => (validUpload = true)}
					id="range-max"
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
