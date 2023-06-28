<script lang="ts">
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="view-container">
	<div class="view-header">
		<span>Similarity Map View</span>
		<div id="simmap-expand-container">
			<ArrowsPointingOut id="simmap-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content">
		<img
			id="simmap-canvas"
			style="width: 100%; height: 85%"
			src="similarity_map.svg"
			alt="Similarity Map"
		/>
	</div>
</div>
