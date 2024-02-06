<script lang="ts">
	import { ChevronRight, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
	import { Check } from 'svelte-heros-v2';
	import { dimensionDataStore } from '../../stores/dataset';
	import { filtersArray, parcoordDimMetadata } from '../../stores/parcoord';
	import { parcoordCustomAxisRanges, parcoordIsInteractable } from '../../stores/parcoord';
	import SetRangeModal from './SetRangeModal.svelte';
	import SetBinNoModal from './SetBinNoModal.svelte';
	import SetFilterModal from './SetFilterModal.svelte';
	import type Axes from './Axes.svelte';
	import type { DSVParsedArray } from 'd3';
	import type { MarginType } from '../../util/types';

	export let axesComponent: Axes;
	export let dimensions: string[] = [];
	export let xScales: any;
	export let yScales: any;
	export let margin: MarginType;

	let debounceTimeout: number;
	let isSetRangeModalOpen: boolean = false,
		isSetBinNoModalOpen: boolean = false,
		isSetFilterModalOpen: boolean = false;
	let isContextMenuShown = false; // Flag if context menu is visible
	let menuStyle = ''; // Menu style string
	let dimIndex: number; // Dataset dimension index
	const activeClass = 'font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100';

	export function showContextMenu(event: MouseEvent, index: number) {
		event.preventDefault();
		$parcoordIsInteractable = false;
		isContextMenuShown = true;
		dimIndex = index;
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
		isSetRangeModalOpen = false;
		isSetRangeModalOpen = true;
		$parcoordIsInteractable = false;
	}

	function openSetBinNoModal() {
		hideContextMenu();
		isSetBinNoModalOpen = false;
		isSetBinNoModalOpen = true;
		$parcoordIsInteractable = false;
	}

	function openSetFilterModal() {
		hideContextMenu();
		isSetFilterModalOpen = false;
		isSetFilterModalOpen = true;
		$parcoordIsInteractable = false;
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
		hideContextMenu();
	}

	function handleShow(field: 'labels' | 'histograms' | 'filter' | 'filterValues') {
		const dimData = $parcoordDimMetadata;
		const currDimData = dimData.get(dimensions[dimIndex]);
		if (!currDimData) return;

		if (field === 'labels') currDimData.showLabels = !currDimData.showLabels;
		else if (field === 'histograms') {
			currDimData.showHistograms = !currDimData.showHistograms;
			const step = xScales[1] - xScales[0];
			if (dimIndex === dimensions.length - 1)
				margin.right = currDimData.showHistograms ? 10 + step / 2 : 40;
		} else if (field === 'filter') currDimData.showFilter = !currDimData.showFilter;
		else if (field === 'filterValues') currDimData.showFilterValues = !currDimData.showFilterValues;

		dimData.set(dimensions[dimIndex], currDimData);
		parcoordDimMetadata.set(dimData);
		hideContextMenu();
	}

	function handleMouseLeave() {
		debounceTimeout = setTimeout(() => {
			hideContextMenu();
		}, 100);
	}

	function handleMouseEnter() {
		clearTimeout(debounceTimeout);
	}
</script>

{#if isContextMenuShown}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		class="context-menu"
		style={menuStyle}
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
	>
		<DropdownItem defaultClass={activeClass} on:click={() => handleHideDImension()}
			>Hide Axis</DropdownItem
		>
		<DropdownItem
			defaultClass={activeClass}
			on:click={() => axesComponent.handleOnInvertAxesClick(dimIndex)}>Invert Axis</DropdownItem
		>
		{#if $dimensionDataStore.get(dimensions[dimIndex])?.type === 'numerical'}
			<DropdownDivider />
			<DropdownItem defaultClass={activeClass} on:click={() => openSetRangeModal()}
				>Set Range...</DropdownItem
			>
		{/if}
		{#if $dimensionDataStore.get(dimensions[dimIndex])?.type === 'numerical' && $parcoordCustomAxisRanges.get(dimensions[dimIndex]) !== null}
			<DropdownDivider />
			<DropdownItem defaultClass={activeClass} on:click={() => resetAxisRange()}
				>Reset Range</DropdownItem
			>
		{/if}
		{#if $dimensionDataStore.get(dimensions[dimIndex])?.type === 'numerical'}
			<DropdownDivider />
			<DropdownItem defaultClass={activeClass} on:click={() => openSetBinNoModal()}
				>Set Bin Num...</DropdownItem
			>
		{/if}
		<DropdownDivider />
		<DropdownItem defaultClass="{activeClass} flex items-center justify-between">
			Show<ChevronRight class="w-3 h-3 ms-2" />
		</DropdownItem>
		<Dropdown placement="right-start" style="padding: 5px; width: 120px;">
			<DropdownItem
				defaultClass="{activeClass} flex items-center"
				style="width: 110px;"
				on:click={() => handleShow('labels')}
				><Check
					class="w-3 h-3 ms-2 mr-2"
					style="visibility: {$parcoordDimMetadata.get(dimensions[dimIndex])?.showLabels
						? 'visible'
						: 'hidden'}"
				/>Labels</DropdownItem
			>
			<DropdownItem
				defaultClass="{activeClass} flex items-center"
				style="width: 110px;"
				on:click={() => handleShow('histograms')}
				><Check
					class="w-3 h-3 ms-2 mr-2"
					style="visibility: {$parcoordDimMetadata.get(dimensions[dimIndex])?.showHistograms
						? 'visible'
						: 'hidden'}"
				/>Histogram</DropdownItem
			>
			<DropdownItem
				defaultClass="{activeClass} flex items-center"
				style="width: 110px;"
				on:click={() => handleShow('filter')}
				><Check
					class="w-3 h-3 ms-2 mr-2"
					style="visibility: {$parcoordDimMetadata.get(dimensions[dimIndex])?.showFilter
						? 'visible'
						: 'hidden'}"
				/>Filter</DropdownItem
			>
			{#if $dimensionDataStore.get(dimensions[dimIndex])?.type === 'numerical'}
				<DropdownItem
					defaultClass="{activeClass} flex items-center"
					style="width: 110px;"
					on:click={() => handleShow('filterValues')}
					><Check
						class="w-3 h-3 ms-2 mr-2"
						style="visibility: {$parcoordDimMetadata.get(dimensions[dimIndex])?.showFilterValues
							? 'visible'
							: 'hidden'}"
					/>Filter Values</DropdownItem
				>{/if}
		</Dropdown>
		<DropdownDivider />
		{#if $dimensionDataStore.get(dimensions[dimIndex])?.type === 'numerical'}
			<DropdownDivider />
			<DropdownItem defaultClass={activeClass} on:click={() => openSetFilterModal()}
				>Set Filter...</DropdownItem
			>
		{/if}
		<DropdownItem
			defaultClass={activeClass}
			on:click={() => axesComponent.resetAxisFilter(dimIndex)}>Reset Filter</DropdownItem
		>
	</div>
{/if}

<SetRangeModal isOpen={isSetRangeModalOpen} dimension={dimensions[dimIndex]} {yScales} {dimIndex} />

<SetBinNoModal isOpen={isSetBinNoModalOpen} dimension={dimensions[dimIndex]} />

<SetFilterModal
	isOpen={isSetFilterModalOpen}
	dimension={dimensions[dimIndex]}
	{yScales}
	{dimIndex}
/>

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
