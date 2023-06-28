<script lang="ts">
	import ParcoordComponent from './ParcoordComponent.svelte';
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="view-container">
	<div class="view-header">
		<span>Parallel Coordinates View</span>
		<div id="parcoord-expand-container">
			<ArrowsPointingOut id="parcoord-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content"><ParcoordComponent /></div>
</div>

<style>
</style>
