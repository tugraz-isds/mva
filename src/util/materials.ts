import * as THREE from 'three';
import { COLOR_ACTIVE, COLOR_HOVERED, COLOR_BRUSHED, COLOR_FILTERED } from './colors';
import type { ColorType } from './types';

const MATERIAL_ACTIVE = new THREE.LineBasicMaterial({
	color: COLOR_ACTIVE,
	linewidth: 1,
	transparent: true,
	opacity: 0.75
});

const MATERIAL_HOVERED = new THREE.LineBasicMaterial({
	color: COLOR_HOVERED,
	linewidth: 1,
	transparent: true,
	opacity: 1
});

const MATERIAL_BRUSHED = new THREE.LineBasicMaterial({
	color: COLOR_BRUSHED,
	linewidth: 1,
	transparent: true,
	opacity: 1
});

const MATERIAL_FILTERED = new THREE.LineBasicMaterial({
	color: COLOR_FILTERED,
	linewidth: 1,
	transparent: true,
	opacity: 0.75
});

const MATERIAL_MAP: Map<ColorType, THREE.LineBasicMaterial> = new Map([
	[COLOR_ACTIVE, MATERIAL_ACTIVE],
	[COLOR_HOVERED, MATERIAL_HOVERED],
	[COLOR_BRUSHED, MATERIAL_BRUSHED],
	[COLOR_FILTERED, MATERIAL_FILTERED]
]);

const MATERIAL_DRAGGING_RECT = new THREE.LineBasicMaterial({
	color: 0x000000,
	linewidth: 1,
	transparent: true,
	opacity: 1
});

export { MATERIAL_MAP, MATERIAL_HOVERED, MATERIAL_BRUSHED, MATERIAL_DRAGGING_RECT };
