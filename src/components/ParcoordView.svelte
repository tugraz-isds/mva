<script lang="ts">
	import { mdiArrowExpand } from '@mdi/js';
	import IconButton, { Icon } from '@smui/icon-button';
	import { Svg } from '@smui/common';

	let clicked = 0;
</script>

<div class="view-container">
	<div class="view-header">
		<span>Parallel Coordinates View</span>
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

<style>
	.view-container {
		width: 100%;
		height: 100%;
	}

	.view-header {
		padding-left: 1%;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
</style>
