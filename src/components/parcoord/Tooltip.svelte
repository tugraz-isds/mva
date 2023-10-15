<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { select } from 'd3';
	import type { TooltipType } from './types';

	export let data: TooltipType;

	let tooltip: any; // Tooltip SVG element
	let tooltipBackground: any; // Background rect element
	let clipPath: any; // SVG clip path element

	afterUpdate(() => {
		const svg = select('#parcoord-canvas-axes');

		svg.select('#tooltip').remove();
		svg.select('#tooltip-background').remove();
		svg.select('#tooltip-clip').remove();

		if (data.text.length === 0) return;

		// Create a white background rect
		tooltipBackground = svg
			.append('rect')
			.attr('id', 'tooltip-background')
			.style('fill', 'lightgrey') // Set the background color
			.style('rx', 5) // Rounded corner
			.style('ry', 5)
			.style('display', data.visible ? 'block' : 'none')
			.attr('x', data.xPos - 5) // Adjust for padding
			.attr('y', data.yPos - 5) // Adjust for padding
			.attr('width', 120) // Adjust the width as needed
			.attr('height', (data.text.length + 1) * 10); // Adjust the height as needed

		clipPath = svg.append('clipPath').attr('id', 'tooltip-clip');
		clipPath
			.append('rect')
			.attr('x', data.xPos - 5)
			.attr('y', data.yPos - 5)
			.attr('width', 120)
			.attr('height', (data.text.length + 1) * 10);

		// Create the text element
		tooltip = svg
			.append('text')
			.attr('id', 'tooltip')
			.attr('x', data.xPos)
			.attr('y', data.yPos + 5)
			.style('display', data.visible ? 'block' : 'none')
			.style('text-anchor', 'start')
			.style('font-size', '10px')
			.attr('clip-path', 'url(#tooltip-clip)')
			.text(data.text[0]);

		for (let i = 1; i < data.text.length; i++) {
			tooltip.append('tspan').attr('x', data.xPos).attr('dy', '1em').text(data.text[i]);
		}
	});
</script>
