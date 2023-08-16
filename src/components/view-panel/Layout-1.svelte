<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';
	import ViewComponent from './View.svelte';
	import HorizontalDivider from './HorizontalDivider.svelte';
	import type { View } from './View';

	export let views: View[];
	export let handleSwap: Function;
</script>

<!-- Lower Row -->
<div class="lower-row flex flex-row" style="height: 90%;">
	<div class="view-{views[0].id}" style="width: 100%;">
		<ViewComponent otherViews={views} {handleSwap} currView={views[0]} />
	</div>
</div>
