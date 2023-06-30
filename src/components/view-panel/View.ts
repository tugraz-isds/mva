export interface View {
	id: number; // View id
	title: string; // View title
	width: number; // View width in percentages
	order: number; // Order of view (from 0 to 4)
	component: any; // View Svelte component
}
