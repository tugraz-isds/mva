<script lang="ts">
	import {
		DropdownItem,
		DropdownDivider,
		Button,
		Modal,
		Label,
		Input,
		Helper
	} from 'flowbite-svelte';
	import { dimensionTypeStore } from '../../stores/dataset';
	import { filtersArray, parcoordDimData } from '../../stores/parcoord';
	import { parcoordCustomAxisRanges, parcoordIsInteractable } from '../../stores/parcoord';
	import { scaleLinear, extent } from 'd3';
	import type Axes from './Axes.svelte';
	import type { DSVParsedArray } from 'd3';

	export let axesComponent: Axes;
	export let dimensions: string[] = [];
	export let yScales: any;
	export let dataset: DSVParsedArray<any>;

	let rangeStart: number;
	let rangeEnd: number;

	let isSetRangeModalOpen: boolean = false;
	let validUpload: boolean = true; // If false show error message
	let errorMessage: string = '';
	let isContextMenuShown = false; // Flag if context menu is visible
	let menuStyle = ''; // Menu style string
	let dimIndex: number; // Dataset dimension index
	const activeClass = 'font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100';

	export function showContextMenu(event: MouseEvent, index: number) {
		event.preventDefault();
		$parcoordIsInteractable = false;
		isContextMenuShown = true;
		dimIndex = index;
		const isAxisInverted = $parcoordDimData.get(dimensions[dimIndex])?.inverted;
		rangeStart = isAxisInverted
			? yScales[dimensions[dimIndex]].domain()[1]
			: yScales[dimensions[dimIndex]].domain()[0];
		rangeEnd = isAxisInverted
			? yScales[dimensions[dimIndex]].domain()[0]
			: yScales[dimensions[dimIndex]].domain()[1];

		const { clientX, clientY } = event;
		const clientXNew = clientX + 150 < window.innerWidth ? clientX : clientX - 150;
		menuStyle = `left: ${clientXNew}px; top: ${clientY}px;`;
	}

	export function hideContextMenu() {
		isContextMenuShown = false;
		$parcoordIsInteractable = true;
	}

	function openSetRangeModal() {
		hideContextMenu();
		isSetRangeModalOpen = true;
		$parcoordIsInteractable = false;
	}

	function closeSetRangeModal() {
		isSetRangeModalOpen = false;
		$parcoordIsInteractable = true;
	}

	function setAxisRange() {
		const isAxisInverted = $parcoordDimData.get(dimensions[dimIndex])?.inverted;
		const domain = extent(dataset, (d: any) => +d[dimensions[dimIndex]]) as [number, number];
		if (rangeEnd < domain[1]) {
			validUpload = false;
			errorMessage = `Highest value of dimension is ${domain[1]}. You cannot set the range lower than that.`;
			return;
		}
		if (rangeStart > domain[0]) {
			validUpload = false;
			errorMessage = `Lowest value of dimension is ${domain[0]}. You cannot set the range higher than that.`;
			return;
		}

		validUpload = true;
		const customRanges = $parcoordCustomAxisRanges;
		customRanges.set(dimensions[dimIndex], {
			start: isAxisInverted ? rangeEnd : rangeStart,
			end: isAxisInverted ? rangeStart : rangeEnd
		});
		closeSetRangeModal();

		// Calculate new filter values
		const filtersTemp = $filtersArray[dimIndex].percentages;
		const originalScale = scaleLinear()
			.domain(yScales[dimensions[dimIndex]].domain())
			.range([0, 1]);
		const newScale = scaleLinear()
			.domain(isAxisInverted ? [rangeEnd, rangeStart] : [rangeStart, rangeEnd])
			.range([0, 1]);
		const originalStart = originalScale.invert(1 - filtersTemp.start);
		const originalEnd = originalScale.invert(1 - filtersTemp.end);
		$filtersArray[dimIndex].percentages = {
			start: 1 - newScale(originalStart),
			end: 1 - newScale(originalEnd)
		};

		$parcoordCustomAxisRanges = customRanges;
	}

	function resetAxisRange() {
		const customRanges = $parcoordCustomAxisRanges;
		customRanges.set(dimensions[dimIndex], null);
		$parcoordCustomAxisRanges = customRanges;

		$filtersArray[dimIndex].percentages = {
			start: 0,
			end: 1
		};
	}

	function handleHideDImension() {
		dimensions = [...dimensions.slice(0, dimIndex), ...dimensions.slice(dimIndex + 1)];
	}

	function handleShowLabels() {
		const dimData = $parcoordDimData;
		const currDimData = dimData.get(dimensions[dimIndex]);
		if (!currDimData) return;
		currDimData.showLabels = !currDimData.showLabels;
		dimData.set(dimensions[dimIndex], currDimData);
		parcoordDimData.set(dimData);
	}

	function handleShowFilter() {
		const dimData = $parcoordDimData;
		const currDimData = dimData.get(dimensions[dimIndex]);
		if (!currDimData) return;
		currDimData.showFilter = !currDimData.showFilter;
		dimData.set(dimensions[dimIndex], currDimData);
		parcoordDimData.set(dimData);
	}
</script>

{#if isContextMenuShown}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="context-menu"
		style={menuStyle}
		on:click={hideContextMenu}
		on:mouseleave={hideContextMenu}
	>
		<DropdownItem defaultClass={activeClass} on:click={() => handleHideDImension()}
			>Hide Axis</DropdownItem
		>
		<DropdownItem
			defaultClass={activeClass}
			on:click={() => axesComponent.handleOnInvertAxesClick(dimIndex)}>Invert Axis</DropdownItem
		>
		{#if $dimensionTypeStore.get(dimensions[dimIndex]) === 'numerical'}
			<DropdownDivider />
			<DropdownItem defaultClass={activeClass} on:click={() => openSetRangeModal()}
				>Set Range...</DropdownItem
			>
		{/if}
		{#if $dimensionTypeStore.get(dimensions[dimIndex]) === 'numerical' && $parcoordCustomAxisRanges.get(dimensions[dimIndex]) !== null}
			<DropdownDivider />
			<DropdownItem defaultClass={activeClass} on:click={() => resetAxisRange()}
				>Reset Range</DropdownItem
			>
		{/if}
		<DropdownDivider />
		<DropdownItem defaultClass={activeClass} on:click={handleShowLabels}
			>{$parcoordDimData.get(dimensions[dimIndex])?.showLabels ? 'Hide' : 'Show'} Labels</DropdownItem
		>
		<DropdownDivider />
		<DropdownItem defaultClass={activeClass} on:click={handleShowFilter}
			>{$parcoordDimData.get(dimensions[dimIndex])?.showFilter ? 'Hide' : 'Show'} Filter</DropdownItem
		>
		<DropdownItem
			defaultClass={activeClass}
			on:click={() => axesComponent.resetAxisFilter(dimIndex)}>Reset Filter</DropdownItem
		>
	</div>
{/if}

<Modal bind:open={isSetRangeModalOpen} on:closed={closeSetRangeModal} size="xs" class="w-full">
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900">Set Axis Range</h3>
		<div class="mb-6 flex items-center">
			<div class="flex flex-row items-center">
				<Label for="range-min" class="mr-2">Start:</Label>
				<Input bind:value={rangeStart} id="range-min" defaultClass="block w-1/2" size="sm" />
			</div>
			<div class="flex flex-row items-center">
				<Label for="range-max" class="mr-2">End:</Label>
				<Input bind:value={rangeEnd} id="range-max" defaultClass="block w-1/2" size="sm" />
			</div>
		</div>
		{#if !validUpload}
			<Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
		{/if}
		<Button type="submit" class="w-full" on:click={() => setAxisRange()}>Set Range</Button>
	</form>
</Modal>

<style>
	.context-menu {
		position: fixed;
		background: white;
		border: 1px solid #ccc;
		padding: 5px;
		z-index: 1000;
		width: 100px;
	}
</style>
