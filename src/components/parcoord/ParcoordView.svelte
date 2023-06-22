<script lang="ts">
	import ParcoordComponent from './ParcoordComponent.svelte';
	import { mdiArrowExpand } from '@mdi/js';
	import IconButton, { Icon } from '@smui/icon-button';
	import { Svg } from '@smui/common';

	let clicked = 0;
</script>

<div class="view-container">
	<div class="view-header">
		<span>Parallel Coordinates View</span>
		<div id="parcoord-expand-container">
			<IconButton
				id="parcoord-expand"
				class="material-icons"
				on:click={() => clicked++}
				size="button"
			>
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiArrowExpand} />
				</Icon>
			</IconButton>
		</div>
	</div>
	<div class="view-content"><ParcoordComponent /></div>
</div>

<style>
</style>
