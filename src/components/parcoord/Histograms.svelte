<script lang="ts">
	import { afterUpdate, onMount } from 'svelte';
	import { select, group, bin, range } from 'd3';
	import { dimensionTypeStore } from '../../stores/dataset';
	import { parcoordDimData, parcoordHistogramData } from '../../stores/parcoord';
	import type { DSVParsedArray } from 'd3';

	export let dataset: DSVParsedArray<any>;
	export let width: number; // Container width
	export let height: number; // Container height
	export let dimensions: string[] = []; // Initial order of dimensions
	export let margin: any; // Margin object
	export let xScales: any[]; // Scales for all of the X-axes
	export let yScales: any; // Scales for all of the Y-axes

	let binGroupsCount = 0;

	let axisHeight: number;
	$: axisHeight = height - margin.top - margin.bottom;

	export function clearSVG() {
		const svg = select('#parcoord-canvas-histograms');
		svg.selectAll('.axis-bins').remove();
		svg.selectAll('.axis-bin').remove();
	}

	function generateEvenlySpacedNumbers(min: number, max: number, n: number, isInverted: boolean) {
		return isInverted
			? range(0, n).map((i) => max + (i / n) * (min - max))
			: range(0, n).map((i) => min + (i / n) * (max - min));
	}

	// Draw axes elements
	export function renderHistograms(initialRender: boolean = false) {
		console.log('Rendering histograms');
		if (!dimensions || xScales?.length === 0 || yScales?.length === 0) return;
		console.log('Rendering histograms');

		const svg = select('#parcoord-canvas-histograms');
		const step = xScales[1] - xScales[0];

		binGroupsCount = dimensions.length;

		dimensions.forEach((dim, i) => {
			if (!$parcoordDimData.get(dimensions[i])?.showHistograms) return;
			const dimData = $parcoordDimData;
			const currDimData = $parcoordDimData.get(dim);

			const binGroup = svg.append('g').attr('class', `axis-bins axis-bins-${i}`);

			let bins: any[] = [];
			if ($dimensionTypeStore.get(dim) === 'numerical') {
				if (currDimData?.binNo === null) {
					bins = bin()(dataset.map((row) => row[dim]));
					currDimData.binNo = bins.length;
					dimData.set(dim, currDimData);
					parcoordDimData.set(dimData);
				} else {
					const domain = yScales[dim].domain();
					bins = bin().thresholds(
						generateEvenlySpacedNumbers(
							domain[0],
							domain[1],
							currDimData?.binNo as number,
							currDimData?.inverted as boolean
						)
					)(dataset.map((row) => row[dim]));
				}
			} else {
				Array.from(
					group(dataset, (d) => d[dim]),
					([_, values]) => values
				);
			}

			const binWidth = axisHeight / bins.length;
			// If bin has width less than 10 hide histogram by default
			if (initialRender && binWidth < 10) {
				if (!currDimData) return;
				currDimData.showHistograms = false;
				dimData.set(dim, currDimData);
				parcoordDimData.set(dimData);
				clearSVG();
				return;
			}
			const longestBinHeight = bins.reduce((max, array) => Math.max(max, array.length), 0);
			bins.forEach((bin, j) => {
				binGroup
					.append('rect')
					.attr('class', 'axis-bin axis-bins-0-bin')
					.attr(
						'width',
						(bin.length / longestBinHeight) * ((step - 16) * $parcoordHistogramData.scale)
					)
					.attr('height', binWidth)
					.attr(
						'transform',
						`translate(${xScales[i] + 8}, ${
							margin.top +
							binWidth * ($parcoordDimData.get(dim)?.inverted ? j : bins.length - j - 1)
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
			renderHistograms(true);
		}, 10);
	});

	afterUpdate(() => {
		setTimeout(() => {
			clearSVG();
			renderHistograms(dimensions.length !== binGroupsCount);
		}, 10);
	});
</script>

<svg
	id="parcoord-canvas-histograms"
	{width}
	{height}
	style="background-color: rgba(255, 255, 255, 0); position: absolute; top: 0; right: 0; bottom: 0; left: 0; z-index: 2; user-select: none;"
/>
