<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { axisBottom, axisLeft } from 'd3-axis';
  import { select } from 'd3-selection';
  import { line } from 'd3-shape';
  import type { CoordinateType, MarginType } from '../../../util/types';

  export let width: number;
  export let height: number;
  export let margin: MarginType;
  export let xScale: any;
  export let yScale: any;
  export let xTitle: string | null = null;
  export let yTitle: string | null = null;
  export let isDragging: boolean;
  export let viewTitle: string;

  function clearSVG() {
    const svg = select(`#${viewTitle}-canvas-axes`);
    svg.selectChildren().remove();
  }

  function renderAxes() {
    if (!xScale || !yScale) return;

    const svg = select(`#${viewTitle}-canvas-axes`);

    const xAxis = viewTitle === 'simmap' ? axisBottom(xScale).tickValues([]) : axisBottom(xScale);
    const yAxis = viewTitle === 'simmap' ? axisLeft(yScale).tickValues([]) : axisLeft(yScale);

    svg
      .append('g')
      .attr('class', `${viewTitle}-x-axis`)
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`)
      .call(xAxis);

    if (xTitle)
      svg
        .append('text')
        .attr('class', `${viewTitle}-axis-title`)
        .attr('transform', `translate(${width / 2}, ${height - margin.bottom + 35})`)
        .attr('font-size', '0.75rem')
        .style('text-anchor', 'middle')
        .text(xTitle);

    svg
      .append('g')
      .attr('class', `${viewTitle}-y-axis`)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis);

    if (yTitle)
      svg
        .append('text')
        .attr('class', `${viewTitle}-axis-title`)
        .attr('transform', `translate(${10}, ${height / 2}) rotate(270)`)
        .attr('font-size', '0.75rem')
        .style('text-anchor', 'middle')
        .text(yTitle);
  }

  export const drawSelectionShape = (points?: CoordinateType[]) => {
    const svg = select(`#${viewTitle}-canvas-axes`);
    svg.selectAll(`#${viewTitle}-selection-shape`).remove();

    if (!points) return;

    const lineGenerator = line()
      .x((d: number[]) => d[0])
      .y((d: number[]) => d[1]);

    svg
      .append('path')
      .datum(points.map((point) => [point.x, point.y]))
      .attr('id', `${viewTitle}-selection-shape`)
      .attr('fill', 'none')
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3, 3')
      .attr('d', lineGenerator as any);
  };

  export const saveSVG = () => {
    const svgElement = document.getElementById(`${viewTitle}-canvas-axes`);
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
  };

  afterUpdate(() => {
    clearSVG();
    renderAxes();
  });
</script>

{#if width > 0 && height > 0}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <svg
    id="{viewTitle}-canvas-axes"
    {width}
    {height}
    style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none; cursor: {isDragging
      ? 'crosshair'
      : 'default'};"
    on:contextmenu={(e) => {
      e.preventDefault();
    }}
  />
{/if}
