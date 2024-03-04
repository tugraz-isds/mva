<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { select } from 'd3-selection';
  import { getTextWidth } from '../../../util/text';
  import type { TooltipAxisTitleType } from '../types';

  export let width: number; // Container width
  export let data: TooltipAxisTitleType;

  afterUpdate(() => {
    const svg = select('#parcoord-canvas-axes');

    svg.select('#tooltip-axis-title').remove();
    svg.select('#tooltip-axis-title-background').remove();

    if (data.text.length === 0) return;

    const tooltipWidth = getTextWidth(data.text, 10, 'sans-serif');

    // Create a white background rect
    svg
      .append('rect')
      .attr('id', 'tooltip-axis-title-background')
      .style('fill', 'whitesmoke')
      .style('stroke', '#ccc')
      .style('stroke-width', 1)
      .style('display', data.visible ? 'block' : 'none')
      .attr('x', data.xPos + tooltipWidth < width ? data.xPos - 5 : width - tooltipWidth - 28)
      .attr('y', data.yPos - 5)
      .attr('width', tooltipWidth + 10)
      .attr('height', 15);

    // Create the text element
    svg
      .append('text')
      .attr('id', 'tooltip-axis-title')
      .attr('x', data.xPos + tooltipWidth < width ? data.xPos : width - tooltipWidth - 23)
      .attr('y', data.yPos + 5)
      .style('display', data.visible ? 'block' : 'none')
      .style('text-anchor', 'start')
      .style('font-size', '10px')
      .text(data.text);
  });
</script>
