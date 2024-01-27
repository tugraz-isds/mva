<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { dimensionDataStore, labelDimension } from '../../stores/dataset';
	import { filtersArray } from '../../stores/parcoord';
	import { hoveredArray } from '../../stores/brushing';
	import { linkingArray } from '../../stores/linking';
	import { COLOR_ACTIVE } from '../../util/colors';
	import type { DSVParsedArray } from 'd3';
	import type { RecordDataType } from '../../util/types';
	import type { AxesFilterType } from './types';

	export let width: number;
	export let height: number;
	export let dataset: DSVParsedArray<any>;
	export let initialDimensions: string[] = [];
	export let margin: any;
	export let xScales: any[];
	export let yScales: any;
	export let setTooltipData: Function;

	let canvasEl: HTMLCanvasElement;
	let offscreenCanvasEl: OffscreenCanvas;
	let worker: Worker;
	let dimensions: string[];
	let lines: number[][][] = [];
	let lineData: RecordDataType[] = [];
	let lineShow: boolean[] = [];
	let mouse: { x: number; y: number } = { x: 0, y: 0 };
	let tooltipPos: { x: number; y: number } = { x: 0, y: 0 };

	let axesFilters: AxesFilterType[] = [];
	const unsubscribeFilters = filtersArray.subscribe((value: any) => {
		axesFilters = value;
		if (dataset?.length > 0 && dimensions?.length > 0) {
			if (axesFilters.length === dimensions.length) {
				worker.postMessage({
					function: 'applyFilters',
					axesFilters
				});
			}
		}
	});

	function setLineData(): void {
		lines = [];
		dataset.forEach((dataRow: any, i: number) => {
			const linePoints: number[][] = [];
			dimensions.forEach((dim: string, j: number) => {
				let yPos;
				if ($dimensionDataStore.get(dim)?.type === 'numerical') yPos = yScales[dim](dataRow[dim]);
				else yPos = yScales[dim](dataRow[dim]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

				linePoints.push([
					xScales[j],
					isNaN(yScales[dim](dataRow[dim])) ? margin.top : yPos + margin.top,
					lineData[i].position
				]);
			});
			lines.push(linePoints);
		});
	}

	function handleMouseMove(event: MouseEvent) {
		if (!canvasEl) return;
		// Calculate normalized mouse coordinates relative to the canvas
		const canvasRect = canvasEl.getBoundingClientRect();
		mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
		mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
		// If mouse is not in canvas, return
		if (
			!(
				event.clientY >= canvasRect.top &&
				event.clientY <= canvasRect.bottom &&
				event.clientX >= canvasRect.left &&
				event.clientX <= canvasRect.right
			)
		)
			return;
		worker.postMessage({
			function: 'mouseMove',
			mouse
		});
		tooltipPos = {
			x: event.clientX - canvasRect.left,
			y: event.clientY - canvasRect.top
		};
	}

	function setTooltip(hoveredLinesSet: Set<number>) {
		if (hoveredLinesSet.size === 0) {
			setTooltipData({ visible: false, xPos: 0, yPos: 0, text: [] });
		} else {
			let tooltipText: string[] = [];
			hoveredLinesSet.forEach((i) => {
				tooltipText.push(`${dataset[i][$labelDimension]}`);
			});
			setTooltipData({
				visible: true,
				xPos: tooltipPos.x + 25,
				yPos: tooltipPos.y,
				text: tooltipText
			});
		}
	}

	function initializeArrays() {
		dimensions = initialDimensions;
		lineShow = Array(dataset.length).fill(true);
		lineData = Array(dataset.length).fill({ color: COLOR_ACTIVE, position: 0 });
		linkingArray.set(lineShow);
	}

	onMount(() => {
		initializeArrays();
		window.addEventListener('pointermove', handleMouseMove, false);

		offscreenCanvasEl = canvasEl.transferControlToOffscreen();
		worker = new Worker('../src/components/parcoord/lines/offscreenWorker.ts', {
			type: 'module'
		});
		worker.postMessage(
			{
				function: 'init',
				canvas: offscreenCanvasEl,
				width,
				height
			},
			[offscreenCanvasEl]
		);
		worker.onmessage = (message) => {
			const data = message.data;
			switch (data.function) {
				case 'setHovered':
					hoveredArray.set(data.hoveredIndices);
					setTooltip(data.hoveredIndices);
					break;
				default:
					break;
			}
		};

		setTimeout(() => {
			setLineData();
			worker.postMessage({
				function: 'drawLines',
				lines
			});
		}, 10);
	});

	onDestroy(() => {
		unsubscribeFilters();
	});
</script>

<canvas bind:this={canvasEl} />
