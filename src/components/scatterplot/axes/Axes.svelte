<script lang="ts">
  import { afterUpdate } from 'svelte';
  import { axisBottom, axisLeft } from 'd3-axis';
  import { select } from 'd3-selection';
  import type { MarginType } from '../../../util/types';

  export let width: number;
  export let height: number;
  export let margin: MarginType;
  export let xScale: any;
  export let yScale: any;
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

    svg
      .append('g')
      .attr('class', `${viewTitle}-y-axis`)
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis);
  }

  export const saveSVG = () => {
    const svgElement = document.getElementById(`${viewTitle}-canvas-axes`);
    const serializer = new XMLSerializer();
    if (!svgElement) return;
    return serializer.serializeToString(svgElement);
  };

  afterUpdate(() => {
    clearSVG();
    renderAxes();
  });
</script>

{#if width > 0 && height > 0}
  <svg
    id="{viewTitle}-canvas-axes"
    {width}
    {height}
    style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 3; user-select: none;"
    on:contextmenu={(e) => {
      e.preventDefault();
    }}
  />
{/if}
