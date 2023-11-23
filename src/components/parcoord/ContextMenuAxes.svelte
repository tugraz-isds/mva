<script lang="ts">
	import { DropdownItem } from 'flowbite-svelte';
	import type Axes from './Axes.svelte';

	// export let handleInvertAxes: Function;
	export let axesComponent: Axes;

	let showMenu = false; // Flag if context is visible
	let menuStyle = ''; // Menu style string
	let dimIndex: number; // Dataset dimension index
	const activeClass = 'font-medium py-1 px-1 text-sm hover:bg-gray-100';

	export function showContextMenu(event: MouseEvent, index: number) {
		event.preventDefault();
		showMenu = true;
		dimIndex = index;

		const { clientX, clientY } = event;
		const clientXNew = clientX + 150 < window.innerWidth ? clientX : clientX - 150;
		menuStyle = `left: ${clientXNew}px; top: ${clientY}px;`;
	}

	export function hideContextMenu() {
		showMenu = false;
	}
</script>

{#if showMenu}
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
	</div>
{/if}

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
