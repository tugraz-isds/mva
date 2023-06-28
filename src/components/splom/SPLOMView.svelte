<script lang="ts">
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="view-container">
	<div class="view-header">
		<span>Scatterplot Matrix View</span>
		<div id="splom-expand-container">
			<ArrowsPointingOut id="splom-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content">
		<img
			id="splom-canvas"
			style="width: 100%; height: 90%"
			src="scatterplot_matrix.svg"
			alt="Scatterplot Matrix"
		/>
	</div>
</div>
