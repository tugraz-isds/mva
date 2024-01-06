import * as THREE from 'three';
import { COLOR_ACTIVE, COLOR_HOVERED, COLOR_BRUSHED, COLOR_FILTERED } from './colors';
import type { ColorType } from './types';

// Line materials
export const LINE_MATERIAL_ACTIVE = new THREE.LineBasicMaterial({
	color: COLOR_ACTIVE,
	linewidth: 1,
	transparent: true,
	opacity: 0.75
});

export const LINE_MATERIAL_HOVERED = new THREE.LineBasicMaterial({
	color: COLOR_HOVERED,
	linewidth: 1,
	transparent: true,
	opacity: 1
});

export const LINE_MATERIAL_BRUSHED = new THREE.LineBasicMaterial({
	color: COLOR_BRUSHED,
	linewidth: 1,
	transparent: true,
	opacity: 1
});

export const LINE_MATERIAL_FILTERED = new THREE.LineBasicMaterial({
	color: COLOR_FILTERED,
	linewidth: 1,
	transparent: true,
	opacity: 0.75
});

export const LINE_MATERIAL_MAP: Map<ColorType, THREE.LineBasicMaterial> = new Map([
	[COLOR_ACTIVE, LINE_MATERIAL_ACTIVE],
	[COLOR_HOVERED, LINE_MATERIAL_HOVERED],
	[COLOR_BRUSHED, LINE_MATERIAL_BRUSHED],
	[COLOR_FILTERED, LINE_MATERIAL_FILTERED]
]);

// Point materials
export const POINT_MATERIAL_ACTIVE = new THREE.MeshBasicMaterial({
	color: COLOR_ACTIVE,
	transparent: true,
	opacity: 0.75,
	side: THREE.DoubleSide
});

export const POINT_MATERIAL_HOVERED = new THREE.MeshBasicMaterial({
	color: COLOR_HOVERED,
	transparent: true,
	opacity: 1,
	side: THREE.DoubleSide
});

export const POINT_MATERIAL_BRUSHED = new THREE.MeshBasicMaterial({
	color: COLOR_BRUSHED,
	transparent: true,
	opacity: 1,
	side: THREE.DoubleSide
});

export const POINT_MATERIAL_FILTERED = new THREE.MeshBasicMaterial({
	color: COLOR_FILTERED,
	transparent: true,
	opacity: 0.75,
	side: THREE.DoubleSide
});

export const POINT_MATERIAL_MAP: Map<ColorType, THREE.MeshBasicMaterial> = new Map([
	[COLOR_ACTIVE, POINT_MATERIAL_ACTIVE],
	[COLOR_HOVERED, POINT_MATERIAL_HOVERED],
	[COLOR_BRUSHED, POINT_MATERIAL_BRUSHED],
	[COLOR_FILTERED, POINT_MATERIAL_FILTERED]
]);

// Other
export const MATERIAL_DRAGGING_RECT = new THREE.LineBasicMaterial({
	color: 0x000000,
	linewidth: 1,
	transparent: true,
	opacity: 1
});
