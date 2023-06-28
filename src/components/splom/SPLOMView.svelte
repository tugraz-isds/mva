<script lang="ts">
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="w-full h-full p-1">
	<div class="flex flex-row justify-between">
		<span>Scatterplot Matrix View</span>
		<div id="splom-expand-container">
			<ArrowsPointingOut id="splom-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content" style="height: 90%;">
		<img
			id="splom-canvas"
			class="w-full h-full"
			src="scatterplot_matrix.svg"
			alt="Scatterplot Matrix"
		/>
	</div>
</div>
