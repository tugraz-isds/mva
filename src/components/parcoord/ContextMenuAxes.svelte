<script lang="ts">
	import { DropdownItem, Button, Modal, Label, Input } from 'flowbite-svelte';
	import type Axes from './Axes.svelte';

	export let axesComponent: Axes;
	export let dimensions: string[] = [];
	export let yScales: any;

	let isSetRangeModalOpen: boolean = false;

	let isContextMenuShown = false; // Flag if context menu is visible
	let menuStyle = ''; // Menu style string
	let dimIndex: number; // Dataset dimension index
	const activeClass = 'font-medium py-1 px-1 text-sm hover:bg-gray-100';

	export function showContextMenu(event: MouseEvent, index: number) {
		event.preventDefault();
		isContextMenuShown = true;
		dimIndex = index;

		const { clientX, clientY } = event;
		const clientXNew = clientX + 150 < window.innerWidth ? clientX : clientX - 150;
		menuStyle = `left: ${clientXNew}px; top: ${clientY}px;`;
	}

	export function hideContextMenu() {
		isContextMenuShown = false;
	}

	function openSetRangeModal() {
		console.log(yScales[dimensions[dimIndex]].domain());
		isSetRangeModalOpen = true;
	}

	function closeSetRangeModal() {
		isSetRangeModalOpen = false;
	}
</script>

{#if isContextMenuShown}
	<div
		class="context-menu"
		style={menuStyle}
		on:click={hideContextMenu}
		on:mouseleave={hideContextMenu}
	>
		<DropdownItem
			defaultClass={activeClass}
			on:click={() => axesComponent.handleOnInvertAxesClick(dimIndex)}>Invert axis</DropdownItem
		>
		<DropdownItem defaultClass={activeClass} on:click={() => openSetRangeModal()}
			>Set range</DropdownItem
		>
	</div>
{/if}

<Modal bind:open={isSetRangeModalOpen} on:closed={closeSetRangeModal} size="xs" class="w-full">
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900">Set Axis Range</h3>
		<div class="mb-6 flex items-center">
			<div class="flex flex-row items-center">
				<Label for="range-min" class="mr-2">Lower:</Label>
				<Input
					id="range-min"
					defaultClass="block w-1/2"
					size="sm"
					value={yScales[dimensions[dimIndex]].domain()[0]}
				/>
			</div>
			<div class="flex flex-row items-center">
				<Label for="range-max" class="mr-2">Upper:</Label>
				<Input
					id="range-max"
					defaultClass="block w-1/2"
					size="sm"
					value={yScales[dimensions[dimIndex]].domain()[1]}
				/>
			</div>
		</div>
		<Button type="submit" class="w-full">Set Range</Button>
	</form>
</Modal>

<style>
	.context-menu {
		position: fixed;
		background: white;
		border: 1px solid #ccc;
		padding: 5px;
		z-index: 1000;
		width: 150px;
	}
</style>
