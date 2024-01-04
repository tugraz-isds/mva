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
