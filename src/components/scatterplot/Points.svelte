<script lang="ts">
	import { afterUpdate, onDestroy, onMount } from 'svelte';
	import * as THREE from 'three';
	import {
		POINT_MATERIAL_ACTIVE,
		POINT_MATERIAL_BRUSHED,
		POINT_MATERIAL_HOVERED,
		POINT_MATERIAL_MAP
	} from '../../util/materials';
	import { COLOR_ACTIVE, COLOR_BRUSHED, COLOR_FILTERED } from '../../util/colors';
	import { areSetsEqual } from '../../util/util';
	import {
		brushedArray,
		hoveredArray,
		previouslyBrushedArray,
		previouslyHoveredArray
	} from '../../stores/brushing';
	import type { MarginType, RecordDataType } from '../../util/types';

	export let width: number;
	export let height: number;
	export let xScale: any;
	export let yScale: any;
	export let xData: any;
	export let yData: any;
	export let labelData: any;
	export let margin: MarginType;
	export let setTooltipData: Function;

	let canvasEl: HTMLCanvasElement;
	let camera: THREE.OrthographicCamera;
	let scene: THREE.Scene;
	let renderer: THREE.WebGLRenderer;
	let point: THREE.Mesh & { index?: number };
	let raycaster: THREE.Raycaster;
	let mouse: THREE.Vector2;
	const pointGeometry = new THREE.CircleGeometry(3, 16);

	let points: any[] = [];
	let pointShow: boolean[] = [];
	let pointData: RecordDataType[] = [];

	let hoveredPointsIndices = new Set<number>();
	let previouslyHoveredPointsIndices = new Set<number>();
	let brushedPointsIndices = new Set<number>();
	let previouslyBrushedPointsIndices = new Set<number>();
	let labelDim: string;
	let intersectingPoints: any[];

	const unsubscribeHovered = hoveredArray.subscribe((value: Set<number>) => {
		removeHoveredPoints();
		hoveredPointsIndices = value;
		drawHoveredPoints();
		previouslyHoveredArray.set(hoveredPointsIndices);
	});

	const unsubscribePrevHovered = previouslyHoveredArray.subscribe((value: Set<number>) => {
		previouslyHoveredPointsIndices = value;
	});

	const unsubscribeBrushing = brushedArray.subscribe((value: any) => {
		brushedPointsIndices = value;
		drawBrushedPoints();
	});

	const unsubscribePrevBrushed = previouslyBrushedArray.subscribe((value: Set<number>) => {
		previouslyBrushedPointsIndices = value;
		removeBrushedPoints();
	});

	export function initScene() {
		scene = new THREE.Scene();
		camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
		camera.position.set(0, 0, 5);
		renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasEl });
		renderer.setClearColor(0xffffff);
		renderer.setSize(width, height);
		const scatterplotDiv = document.getElementById('scatterplot-canvas');
		if (scatterplotDiv instanceof HTMLElement) scatterplotDiv.appendChild(renderer.domElement);
		raycaster = new THREE.Raycaster();
		mouse = new THREE.Vector2();
	}

	function drawPoints() {
		points = [];
		if (xData.length !== yData.length) return;
		for (let i = 0; i < xData.length; i++) {
			drawPoint(margin.left + xScale(xData[i]), margin.top + yScale(yData[i]), i);
		}
		render();
	}

	function drawPoint(x: number, y: number, idx: number) {
		const material = POINT_MATERIAL_MAP.get(pointData[idx].color) ?? new THREE.MeshBasicMaterial();
		material.needsUpdate = false;
		point = new THREE.Mesh(pointGeometry, material);
		point.position.set(x, y, pointData[idx].position);
		point.index = idx;
		points.push(point);
		scene.add(point);
	}

	function drawHoveredPoints() {
		hoveredPointsIndices.forEach((i) => {
			const point = points[i];
			point.material = POINT_MATERIAL_HOVERED;
			changePointPosition(point, 2);
			point.material.needsUpdate = true;
		});
		render();
	}

	function drawBrushedPoints() {
		brushedPointsIndices.forEach((i) => {
			const point = points[i];
			pointData[i] = { color: COLOR_BRUSHED, position: 1 };
			point.material = POINT_MATERIAL_BRUSHED;
			changePointPosition(point, 1);
			point.material.needsUpdate = true;
		});
		render();
	}

	function removeHoveredPoints() {
		previouslyHoveredPointsIndices.forEach((i) => {
			const point = points[i];
			point.material = POINT_MATERIAL_MAP.get(pointData[i].color) ?? new THREE.MeshBasicMaterial();
			point.material.needsUpdate = false;
			changePointPosition(point, pointData[i].position);
		});
	}

	function removeBrushedPoints() {
		previouslyBrushedPointsIndices.forEach((i) => {
			const point = points[i];
			pointData[i] = {
				color: pointShow[i] ? COLOR_ACTIVE : COLOR_FILTERED,
				position: pointShow[i] ? 0 : -1
			};
			point.material = POINT_MATERIAL_MAP.get(pointData[i].color) ?? new THREE.MeshBasicMaterial();
			point.material.needsUpdate = false;
			changePointPosition(point, pointData[i].position);
		});
		render();
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

		raycaster.setFromCamera(mouse, camera); // Check for intersections
		// Add hovered lines
		intersectingPoints = raycaster.intersectObjects(points);
		const hoveredPointsSet: Set<number> = new Set();
		intersectingPoints.forEach((intersection) => {
			const point = intersection.object as any;
			if (pointShow[point.index]) hoveredPointsSet.add(point.index);
			hoveredPointsSet.add(point.index);
		});

		if (areSetsEqual(previouslyHoveredPointsIndices, hoveredPointsSet)) return;
		setTooltip(hoveredPointsSet, event.clientX - canvasRect.left, event.clientY - canvasRect.top);
		hoveredArray.set(hoveredPointsSet);
	}

	function handleMouseDown(event: MouseEvent) {
		if (!canvasEl) return;
		const canvasRect = canvasEl.getBoundingClientRect();
		// If mouse is not in parcoord, return
		if (
			!(
				event.clientY >= canvasRect.top + margin.top &&
				event.clientY <= canvasRect.bottom &&
				event.clientX >= canvasRect.left &&
				event.clientX <= canvasRect.right
			)
		)
			return;

		setTooltipData({ visible: false, xPos: 0, yPos: 0, text: [] });
		intersectingPoints = [];

		previouslyBrushedArray.set(brushedPointsIndices);

		// Add to brushed if Ctrl key is pressed
		if (event.ctrlKey) {
			hoveredPointsIndices.forEach((i) => {
				if (brushedPointsIndices.has(i)) brushedPointsIndices.delete(i);
				else brushedPointsIndices.add(i);
			});
		}
		// Set brushed to hovered
		else {
			const newBrushedPointsIndices = new Set<number>();
			hoveredPointsIndices.forEach((i) => {
				if (!brushedPointsIndices.has(i)) newBrushedPointsIndices.add(i);
			});
			brushedPointsIndices = newBrushedPointsIndices;
		}
		brushedPointsIndices.forEach((i) => {
			if (!pointShow[i]) brushedPointsIndices.delete(i);
		});
		brushedArray.set(brushedPointsIndices);
	}

	function setTooltip(hoveredPointsSet: Set<number>, x: number, y: number) {
		if (hoveredPointsSet.size === 0) {
			setTooltipData({ visible: false, xPos: 0, yPos: 0, text: [] });
		} else {
			let tooltipText: string[] = [];
			hoveredPointsSet.forEach((i) => {
				tooltipText.push(`${labelData[i]}`);
			});
			setTooltipData({ visible: true, xPos: x + 25, yPos: y, text: tooltipText });
		}
	}

	function changePointPosition(point: THREE.Mesh, newZPosition: number) {
		point.position.z = newZPosition;
		point.geometry.attributes.position.needsUpdate = true;
	}

	function render() {
		if (!renderer) return;
		renderer.clear();
		renderer.render(scene, camera);
	}

	function initialzeArrays() {
		pointShow = Array(xData.length).fill(true);
		pointData = Array(xData.length).fill({ color: COLOR_ACTIVE, position: 0 });
	}

	onMount(() => {
		initialzeArrays();
		initScene();
		drawPoints();
		window.addEventListener('mousemove', handleMouseMove, false);
		window.addEventListener('mousedown', handleMouseDown, false);
	});

	afterUpdate(() => {
		if (pointData.length !== xData.length) initialzeArrays();
		initScene();
		drawPoints();
	});

	onDestroy(() => {
		unsubscribeHovered();
		unsubscribePrevHovered();
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mousedown', handleMouseDown);
	});
</script>

<canvas bind:this={canvasEl} />
