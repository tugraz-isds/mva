<script lang="ts">
	import ParcoordComponent from './ParcoordComponent.svelte';
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="w-full h-full p-1">
	<div class="flex flex-row justify-between">
		<span>Parallel Coordinates View</span>
		<div id="parcoord-expand-container">
			<ArrowsPointingOut id="parcoord-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content" style="height: 90%;"><ParcoordComponent /></div>
</div>

<style>
</style>
