<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { select } from 'd3';
	import { getTextWidth } from '../../util/text';
	import type { TooltipAxisTitleType } from './types';

	export let data: TooltipAxisTitleType;

	let tooltip: any; // Tooltip SVG element
	let tooltipBackground: any; // Background rect element

	afterUpdate(() => {
		const svg = select('#parcoord-canvas-axes');

		svg.select('#tooltip-axis-title').remove();
		svg.select('#tooltip-axis-title-background').remove();

		if (data.text.length === 0) return;

		const tooltipWidth = getTextWidth(data.text, 10, 'Roboto');

		// Create a white background rect
		tooltipBackground = svg
			.append('rect')
			.attr('id', 'tooltip-axis-title-background')
			.style('fill', 'whitesmoke')
			.style('stroke', '#ccc')
			.style('stroke-width', 1)
			.style('rx', 5)
			.style('ry', 5)
			.style('display', data.visible ? 'block' : 'none')
			.attr('x', data.xPos - 5)
			.attr('y', data.yPos - 5)
			.attr('width', tooltipWidth + 10)
			.attr('height', 15);

		// Create the text element
		tooltip = svg
			.append('text')
			.attr('id', 'tooltip-axis-title')
			.attr('x', data.xPos)
			.attr('y', data.yPos + 5)
			.style('display', data.visible ? 'block' : 'none')
			.style('text-anchor', 'start')
			.style('font-size', '10px')
			.text(data.text);
	});
</script>
