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
