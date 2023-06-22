<script lang="ts">
	import { mdiArrowExpand } from '@mdi/js';
	import IconButton, { Icon } from '@smui/icon-button';
	import { Svg } from '@smui/common';

	let clicked = 0;
</script>

<div class="view-container">
	<div class="view-header">
		<span>Scatterplot View</span>
		<div id="scatterplot-expand-container">
			<IconButton
				id="scatterplot-expand"
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
	<div class="view-content">
		<img
			id="scatterplot-canvas"
			style="width: 100%; height: 85%"
			src="scatterplot_iris_petal.svg"
			alt="Scatterplot"
		/>
	</div>
</div>
