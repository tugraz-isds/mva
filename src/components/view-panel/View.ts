export interface View {
	id: string; // View id
	title: string; // View title
	width: number; // View width in percentages
	component: any; // View Svelte component
}
