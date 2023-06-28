<script lang="ts">
	import { ArrowsPointingOut } from 'svelte-heros-v2';
</script>

<div class="w-full h-full p-1">
	<div class="flex flex-row justify-between">
		<span>Scatterplot View</span>
		<div id="scatterplot-expand-container">
			<ArrowsPointingOut id="scatterplot-expand" size="24" class="text-grey-900 cursor-pointer" />
		</div>
	</div>
	<div class="view-content" style="height: 90%;">
		<img
			id="scatterplot-canvas"
			class="w-full h-full"
			src="scatterplot_iris_petal.svg"
			alt="Scatterplot"
		/>
	</div>
</div>
