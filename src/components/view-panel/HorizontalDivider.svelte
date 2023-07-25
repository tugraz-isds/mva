<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	export let id: number;
	export let handleHorizontalMouseDown: MouseEventHandler<HTMLElement>;
</script>

<div
	id={`dragHandleHorizontal${id}`}
	style="width: 0.25%;"
	class="h-full bg-gray-400 cursor-col-resize"
	on:mousedown={handleHorizontalMouseDown}
/>
