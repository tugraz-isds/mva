<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Select } from 'flowbite-svelte';
	import { extent, scaleLinear } from 'd3';
	import Axes from './Axes.svelte';
	import Points from './Points.svelte';
	import Tooltip from '../tooltip/Tooltip.svelte';
	import { datasetStore, dimensionTypeStore, labelDimension } from '../../stores/dataset';
	import type { DSVParsedArray } from 'd3';
	import type { MarginType, TooltipType } from '../../util/types';

	let width: number;
	let height: number;
	let dimensions: string[] = [];
	let numericalDimensions: string[] = [];
	let xDim: string, yDim: string;
	let xScale: any, yScale: any;

	let margin: MarginType = { top: 20, right: 10, bottom: 20, left: 30 };

	let tooltip: TooltipType = {
		visible: false,
		xPos: 0,
		yPos: 0,
		text: []
	};

	$: {
		if (height > 0 && dataset?.length > 0) {
			calculateXScale();
			calculateYScale();
		}
	}

	// Set dataset and handle new dataset upload
	let dataset: DSVParsedArray<any>;
	const unsubscribeDataset = datasetStore.subscribe((value: any) => {
		dataset = value;
		if (dataset?.length > 0) {
			dimensions = Object.keys(dataset[0]);
			numericalDimensions = dimensions.filter(
				(dim) => $dimensionTypeStore.get(dim) === 'numerical'
			);
			if (numericalDimensions.length >= 2) {
				yDim = numericalDimensions[0];
				xDim = numericalDimensions[1];
			}
		}
	});

	function calculateXScale() {
		const xDimExtent = extent(dataset, (d: any) => +d[xDim]);
		xScale = scaleLinear()
			.domain(xDimExtent as [number, number])
			.range([0, width - margin.right - margin.left]);
	}

	function calculateYScale() {
		const yDimExtent = extent(dataset, (d: any) => +d[yDim]);
		yScale = scaleLinear()
			.domain(yDimExtent as [number, number])
			.range([height * 0.9 - margin.top - margin.bottom, 0]);
	}

	function setTooltipData(data: TooltipType) {
		tooltip = data;
	}

	onDestroy(() => {
		unsubscribeDataset();
	});
</script>

{#if numericalDimensions.length < 2}
	<div><span>Not enough numerical dimensions.</span></div>
{:else}
	<div
		id="scatterplot-canvas-container"
		class="w-full h-full flex flex-col items-end"
		bind:clientWidth={width}
		bind:clientHeight={height}
	>
		<Axes {width} height={height * 0.9} {xScale} {yScale} {margin} viewTitle="scatterplot" />

		<Tooltip data={tooltip} viewTitle="scatterplot" />

		<!-- <Points
			{width}
			height={height * 0.9}
			{xScale}
			{yScale}
			xData={dataset.map((row) => row[xDim])}
			yData={dataset.map((row) => row[yDim])}
			labelData={dataset.map((row) => row[$labelDimension])}
			{margin}
			{setTooltipData}
			viewTitle="scatterplot"
		/> -->

		<div class="w-full scatterplot-canvas" style="height: {height * 0.9}px;" />
		<div class="flex w-full justify-evenly" style="height: {height * 0.1}px">
			<div class="flex items-center w-1/3">
				<span class="mr-1/2" style="font-size: 0.75em;">Y:</span>
				<Select
					bind:value={yDim}
					size="sm"
					placeholder=""
					style="height: {height * 0.06}px;
								padding: 0 {width < 350 ? '18px' : '25px'} 0 4px;
								display: flex;
								align-items: center;
								justify-content: center;
								width: 100%;
								overflow: hidden;
        				text-overflow: ellipsis;
								font-size: {width < 350 ? '0.5em' : '0.75em'};"
					on:change={calculateYScale}
				>
					{#each numericalDimensions as dim}
						<option value={dim}>{dim}</option>
					{/each}
				</Select>
			</div>
			<div class="flex items-center select-sm w-1/3">
				<span class="mr-1/2" style="font-size: 0.75em;">X:</span>
				<Select
					bind:value={xDim}
					size="sm"
					placeholder=""
					style="height: {height * 0.06}px;
								padding: 0 25px 0 4px;
								display: flex;
								align-items: center;
								justify-content: center;
								width: 100%;
								overflow: hidden;
        				text-overflow: ellipsis;
								font-size: {width < 350 ? '0.5rem' : '0.75rem'};"
					on:change={calculateXScale}
				>
					{#each numericalDimensions as dim}
						<option value={dim}>{dim}</option>
					{/each}
				</Select>
			</div>
		</div>
	</div>
{/if}
