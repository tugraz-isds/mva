<script lang="ts">
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="view-container">
	<div class="view-header">
		<span>Scatterplot View</span>
		<div id="scatterplot-expand-container">
			<ArrowsPointingOut id="scatterplot-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content">
		<img
			id="scatterplot-canvas"
			style="width: 100%; height: 85%"
			src="scatterplot_iris_petal.svg"
			alt="Scatterplot"
		/>
	</div>
</div>
