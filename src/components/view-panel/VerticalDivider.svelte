<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	export let handleVerticalMouseDown: MouseEventHandler<HTMLElement>;
</script>

<div
	id="dragHandleVertical"
	style="height: 0.5%;"
	class="bg-gray-400 cursor-row-resize"
	on:mousedown={handleVerticalMouseDown}
/>
