import { range } from 'd3';

// Helper function to reorder an array
export function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
	const result = [...arr];
	const [removed] = result.splice(fromIndex, 1);
	result.splice(toIndex, 0, removed);
	return result;
}

// Helper function that returns whether item is a number
export function isNumber(item: any) {
	if (typeof item === 'number') return true;
	if (typeof item === 'string') return !isNaN(+item);
	return false;
}

// Helper function to compare 2 sets
export function areSetsEqual(set1: Set<number>, set2: Set<number>) {
	return set1.size === set2.size && [...set1].every((value) => set2.has(value));
}

export function getAllTicks(domainValues: any, ticks: any) {
	if (ticks.indexOf(domainValues[0]) === -1) {
		if (((ticks[0] - domainValues[0]) * 100) / (domainValues[1] - domainValues[0]) < 10)
			ticks[0] = domainValues[0];
		else ticks.unshift(domainValues[0]);
	}
	if (ticks.indexOf(domainValues[1]) === -1) {
		if (
			((domainValues[1] - ticks[ticks.length - 1]) * 100) / (domainValues[1] - domainValues[0]) <
			10
		)
			ticks[ticks.length - 1] = domainValues[1];
		else ticks.push(domainValues[1]);
	}
	return ticks;
}

export function isOffscreenCanvasSupported(canvas: HTMLCanvasElement): boolean {
	const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
	let supportOffScreenWebGL = 'transferControlToOffscreen' in canvas;

	// If it's Safari, then check the version because Safari < 17 doesn't support OffscreenCanvas with a WebGL context
	if (isSafari) {
		var versionMatch = navigator.userAgent.match(/version\/(\d+)/i);
		var safariVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
		supportOffScreenWebGL = safariVersion >= 17;
	}

	return supportOffScreenWebGL;
}

export const throttle = (func: Function, delay: number) => {
	let prev = 0;
	return (...args: any[]) => {
		let now = new Date().getTime();
		if (now - prev > delay) {
			prev = now;
			return func(...args);
		}
	};
};

export const debounce = (func: Function, delay: number) => {
	let debounceTimer: number;
	return (...args: any[]) => {
		clearTimeout(debounceTimer);
		debounceTimer = window.setTimeout(() => func(...args), delay);
	};
};

export function generateEvenlySpacedNumbers(
	min: number,
	max: number,
	n: number,
	isInverted: boolean
) {
	return isInverted
		? range(0, n).map((i) => max + (i / n) * (min - max))
		: range(0, n).map((i) => min + (i / n) * (max - min));
}
