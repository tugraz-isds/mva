<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { axisBottom, axisLeft, select } from 'd3';
	import type { MarginType } from '../../util/types';

	export let width: number;
	export let height: number;
	export let xScale: any;
	export let yScale: any;
	export let margin: MarginType;

	function clearSVG() {
		const svg = select('#scatterplot-canvas-axes');
		svg.selectAll('g').remove();
	}

	function renderAxes() {
		if (!xScale || !yScale) return;

		const svg = select('#scatterplot-canvas-axes');

		svg
			.append('g')
			.attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
			.call(axisBottom(xScale));

		svg
			.append('g')
			.attr('transform', `translate(${margin.left}, ${margin.top})`)
			.call(axisLeft(yScale));
	}

	onMount(() => {
		renderAxes();
	});

	afterUpdate(() => {
		clearSVG();
		renderAxes();
	});
</script>

{#if width > 0 && height > 0}
	<svg
		id="scatterplot-canvas-axes"
		{width}
		{height}
		style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none;"
		on:contextmenu={(e) => {
			e.preventDefault();
		}}
	/>
{/if}
