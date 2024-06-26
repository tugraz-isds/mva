<script lang="ts">
  import { afterUpdate, onMount } from 'svelte';
  import { select } from 'd3-selection';
  import { group, bin } from 'd3-array';
  import { dimensionDataStore } from '../../../stores/dataset';
  import { parcoordDimMetadata, parcoordHistogramData } from '../../../stores/parcoord';
  import { generateEvenlySpacedNumbers } from '../../../util/util';
  import type { DSVParsedArray } from 'd3-dsv';

  export let dataset: DSVParsedArray<any>;
  export let width: number; // Container width
  export let height: number; // Container height
  export let dimensions: string[] = []; // Initial order of dimensions
  export let margin: any; // Margin object
  export let xScales: any[]; // Scales for all of the X-axes
  export let yScales: any; // Scales for all of the Y-axes

  let axisHeight: number;
  $: axisHeight = height - margin.top - margin.bottom;

  export function clearSVG() {
    const svg = select('#parcoord-canvas-histograms');
    svg.selectAll('.axis-bins').remove();
    svg.selectAll('.axis-bin').remove();
  }

  // Draw axes elements
  export function renderHistograms() {
    if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;

    const svg = select('#parcoord-canvas-histograms');
    const step = xScales[1] - xScales[0];

    const dimData = $parcoordDimMetadata;
    dimensions.forEach((dim, i) => {
      if (!$parcoordDimMetadata.get(dimensions[i])?.showHistograms) return;
      const currDimData = $parcoordDimMetadata.get(dim);

      const binGroup = svg.append('g').attr('class', `axis-bins axis-bins-${i}`);

      let bins: any[] = [];
      let binsStart: number;
      let binsEnd: number;
      if ($dimensionDataStore.get(dim)?.type === 'numerical') {
        const min: number = $dimensionDataStore.get(dim)?.min as number;
        const max: number = $dimensionDataStore.get(dim)?.max as number;
        binsStart = yScales[dim](currDimData?.inverted ? max : min);
        binsEnd = yScales[dim](currDimData?.inverted ? min : max);
        if (currDimData?.binNo === null) {
          bins = bin()(dataset.map((row) => row[dim]));
          currDimData.binNo = bins.length;
          dimData.set(dim, currDimData);
          parcoordDimMetadata.set(dimData);
        } else {
          bins = bin().thresholds(
            generateEvenlySpacedNumbers(
              currDimData?.inverted ? max : min,
              currDimData?.inverted ? min : max,
              currDimData?.binNo as number,
              currDimData?.inverted as boolean
            )
          )(dataset.map((row) => row[dim]));
        }
      } else {
        bins = Array.from(
          group(dataset, (d) => d[dim]),
          ([_, values]) => values
        );
        binsStart = axisHeight;
        binsEnd = 0;
      }

      const binHeight = Math.abs(binsStart - binsEnd) / bins.length;
      const longestBinHeight = bins.reduce((max, array) => Math.max(max, array.length), 0);
      bins.forEach((bin, j) => {
        const binWidth = (bin.length / longestBinHeight) * ((step - 16) * $parcoordHistogramData.width);
        binGroup
          .append('rect')
          .attr('class', 'axis-bin axis-bins-0-bin')
          .attr(
            'width',
            binWidth < $parcoordHistogramData.widthLimits.min ? $parcoordHistogramData.widthLimits.min : binWidth
          )
          .attr('height', binHeight)
          .attr(
            'transform',
            `translate(${xScales[i] + 8}, ${
              margin.top + binsEnd + binHeight * ($parcoordDimMetadata.get(dim)?.inverted ? j : bins.length - j - 1)
            })`
          )
          .attr('fill', 'grey')
          .attr('stroke', 'black')
          .attr('fill-opacity', $parcoordHistogramData.fillOpacity)
          .attr('stroke-opacity', $parcoordHistogramData.strokeOpacity);
      });
    });
  }

  onMount(() => {
    setTimeout(() => {
      clearSVG();
      renderHistograms();
    }, 0);
  });

  afterUpdate(() => {
    setTimeout(() => {
      clearSVG();
      renderHistograms();
    }, 0);
  });
</script>

<svg
  id="parcoord-canvas-histograms"
  {width}
  {height}
  style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 2; user-select: none;"
/>
