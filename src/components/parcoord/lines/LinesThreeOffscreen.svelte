<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import OffscreenWorker from './offscreenWorker?worker';
	import { dimensionDataStore, labelDimension } from '../../../stores/dataset';
	import { filtersArray, parcoordIsInteractable } from '../../../stores/parcoord';
	import {
		brushedArray,
		hoveredArray,
		previouslyBrushedArray,
		previouslyHoveredArray
	} from '../../../stores/brushing';
	import { linkingArray } from '../../../stores/linking';
	import { COLOR_ACTIVE } from '../../../util/colors';
	import type { DSVParsedArray } from 'd3';
	import type { RecordDataType } from '../../../util/types';
	import type { AxesFilterType } from '../types';

	export let width: number;
	export let height: number;
	export let dataset: DSVParsedArray<any>;
	export let dimensions: string[] = [];
	export let margin: any;
	export let xScales: any[];
	export let yScales: any;
	export let setTooltipData: Function;

	let canvasEl: HTMLCanvasElement;
	let offscreenCanvasEl: OffscreenCanvas;
	let worker: Worker;
	let lines: number[][][] = [];
	let lineData: RecordDataType[] = [];
	let lineShow: boolean[] = [];
	let mouse: { x: number; y: number } = { x: 0, y: 0 };
	let tooltipPos: { x: number; y: number } = { x: 0, y: 0 };
	let updatedHere = false;

	let axesFilters: AxesFilterType[] = [];
	const unsubscribeFilters = filtersArray.subscribe((value: any) => {
		axesFilters = value;
		if (!worker) return;
		if (dataset?.length > 0 && dimensions?.length > 0) {
			worker.postMessage({
				function: 'applyFilters',
				axesFilters
			});
		}
	});

	const unsubscribePreviouslyHovered = previouslyHoveredArray.subscribe((value: Set<number>) => {
		if (!worker) return;
		worker.postMessage({
			function: 'updatePreviouslyHovered',
			indices: value
		});
	});

	const unsubscribePreviouslyBrushed = previouslyBrushedArray.subscribe((value: Set<number>) => {
		if (!worker) return;
		worker.postMessage({
			function: 'updatePreviouslyBrushed',
			indices: value
		});
	});

	const unsubscribeHovered = hoveredArray.subscribe((value: Set<number>) => {
		if (!worker) return;
		if (updatedHere) {
			updatedHere = false;
			return;
		}
		worker.postMessage({
			function: 'updateHovered',
			indices: value
		});
		updatedHere = false;
	});

	const unsubscribeBrushed = brushedArray.subscribe((value: Set<number>) => {
		if (!worker) return;
		if (updatedHere) {
			updatedHere = false;
			return;
		}
		worker.postMessage({
			function: 'updateBrushed',
			indices: value
		});
		updatedHere = false;
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
			) ||
			!$parcoordIsInteractable
		)
			return;

		worker.postMessage({ function: 'mouseMove', mouse });

		tooltipPos = {
			x: event.clientX - canvasRect.left,
			y: event.clientY - canvasRect.top
		};
	}

	function handleMouseDown(event: MouseEvent) {
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

		setTimeout(() => {
			setTooltipData({ visible: false, xPos: 0, yPos: 0, text: [] });

			if (!$parcoordIsInteractable) return;

			worker.postMessage({
				function: 'mouseDown',
				mouse,
				event: {
					ctrlKey: event.ctrlKey,
					shiftKey: event.shiftKey
				}
			});
		}, 1);
	}

	export function drawLines() {
		setLineData();
		worker.postMessage({
			function: 'drawLines',
			lines
		});
	}

	export function swapPoints(fromIndex: number, toIndex: number) {
		for (let i = 0; i < lines.length; i++) {
			const temp = lines[i][fromIndex][1];
			lines[i][fromIndex][1] = lines[i][toIndex][1];
			lines[i][toIndex][1] = temp;
		}

		worker.postMessage({
			function: 'drawLines',
			lines
		});
	}

	export function handleInvertAxis(axisIndex: number) {
		dataset.forEach((dataRow: any, i: number) => {
			const dim = dimensions[axisIndex];
			let yPos;
			if ($dimensionDataStore.get(dim)?.type === 'numerical') yPos = yScales[dim](dataRow[dim]);
			else yPos = yScales[dim](dataRow[dim]) + yScales[dim].step() / 2; // If data is categorical, add half of step to height

			const linePoints = [
				xScales[axisIndex],
				isNaN(yScales[dim](dataRow[dim])) ? margin.top : yPos + margin.top,
				lineData[i].position
			];
			lines[i][axisIndex] = linePoints;
		});

		worker.postMessage({
			function: 'drawLines',
			lines
		});
	}

	export function handleMarginChanged() {
		initializeArrays();
		drawLines();
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
		dimensions = dimensions;
		lineShow = Array(dataset.length).fill(true);
		lineData = Array(dataset.length).fill({ color: COLOR_ACTIVE, position: 0 });
		linkingArray.set(lineShow);
	}

	onMount(() => {
		initializeArrays();
		window.addEventListener('pointermove', handleMouseMove, false);
		window.addEventListener('pointerdown', handleMouseDown, false);

		offscreenCanvasEl = canvasEl.transferControlToOffscreen();
		worker = new OffscreenWorker();

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
					updatedHere = true;
					hoveredArray.set(data.hoveredIndices);
					setTooltip(data.hoveredIndices);
					break;
				case 'setBrushed':
					brushedArray.set(data.brushedIndices);
					break;
				default:
					break;
			}
		};

		setTimeout(() => {
			drawLines();
		}, 10);
	});

	onDestroy(() => {
		unsubscribeFilters();
		unsubscribeHovered();
		unsubscribeBrushed();
		unsubscribePreviouslyHovered();
		unsubscribePreviouslyBrushed();
	});
</script>

<canvas bind:this={canvasEl} />
