<script lang="ts">
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="w-full h-full p-1">
	<div class="flex flex-row justify-between">
		<span>Similarity Map View</span>
		<div id="simmap-expand-container">
			<ArrowsPointingOut id="simmap-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content" style="height: 90%;">
		<img
			id="simmap-canvas"
			style="width: 100%; height: 85%"
			src="similarity_map.svg"
			alt="Similarity Map"
		/>
	</div>
</div>
