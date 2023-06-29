export default class View {
	public id: number; // View CSS class name
	public width: number; // View width in percentages
	public order: number; // Order of view (from 1 to 5)
	public component: any; // View Svelte component

	constructor(id: number, width: number, order: number, component: any) {
		this.id = id;
		this.width = width;
		this.order = order;
		this.component = component;
	}
}
