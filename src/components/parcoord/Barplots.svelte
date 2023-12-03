<script lang="ts">
	import { onMount } from 'svelte';
	import { select, scaleLinear, bin, max } from 'd3';
	import type { DSVParsedArray } from 'd3';

	export let dataset: DSVParsedArray<any>;
	export let width: number; // Container width
	export let height: number; // Container height
	export let dimensions: string[] = []; // Initial order of dimensions
	export let margin: any; // Margin object
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	// Draw axes elements
	export function renderBarplots() {
		if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;
		console.log('Rendering barplots');

		const svg = select('#parcoord-canvas-barplots');
		const step = xScales[1] - xScales[0];
		const bins = bin().domain(yScales[dimensions[0]].domain()).thresholds(10)(
			dataset.map((row) => row[dimensions[0]])
		);
		const x = scaleLinear()
			.domain(yScales[dimensions[0]].domain())
			.range([0, height - margin.top - margin.bottom]);
		const y = scaleLinear()
			.domain([0, max(bins, (d: any) => d.length)])
			.range([step, step / 2]);
		svg
			.selectAll('rect')
			.data(bins)
			.enter()
			.append('rect')
			.attr('x', (d: any) => x(d.x0))
			.attr('y', (d: any) => y(d.length))
			.attr('width', (d: any) => x(d.x1) - x(d.x0) - 1)
			.attr('height', (d: any) => step - y(d.length))
			.attr('transform', `translate(${xScales[1]}, ${margin.top}) rotate(90)`)
			.attr('fill', 'grey')
			.attr('stroke', 'black')
			.attr('fill-opacity', '0.1')
			.attr('stroke-opacity', '0.5');
	}

	onMount(() => {
		renderBarplots();
	});
</script>

<svg
	id="parcoord-canvas-barplots"
	{width}
	{height}
	style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 2; user-select: none;"
/>
