class View {
	public className: string; // View CSS class name
	public width: number; // View width in percentages
	public height: number; // View height in percentages
	public order: number; // Order of view (from 1 to 5)
	public component: any; // View Svelte component

	constructor(className: string, width: number, height: number, order: number, component: any) {
		this.className = className;
		this.width = width;
		this.height = height;
		this.order = order;
		this.component = component;
	}
}

class ViewPanel {
	public views: View[];
	// Initial row heights (percentages)
	public upperRowHeight = 40;
	public lowerRowHeight = 55;
	// Variables that control dragging
	public isDraggingVertical = false;
	public isDraggingHorizontal = false;
	public disableTextSelection = false;

	constructor(views: View[]) {
		this.views = views;
	}

	public handleVerticalMouseDown = () => {
		console.log('Vertical mouse down');
		this.isDraggingVertical = true;
	};

	public handleHorizontalMouseDown = () => {
		this.isDraggingHorizontal = true;
	};

	public handleMouseUp = () => {
		this.disableTextSelection = false;
		this.isDraggingVertical = false;
		this.isDraggingHorizontal = false;
	};

	public handleVerticalResize = (e: MouseEvent) => {
		if (!this.isDraggingVertical) return;
		const windowHeight = window.innerHeight;
		const dragY = e.clientY;
		this.upperRowHeight = (dragY / windowHeight) * 100 - 5;
		this.lowerRowHeight = ((windowHeight - dragY) / windowHeight) * 100 + 5;
		console.log(this.lowerRowHeight, this.upperRowHeight);
		this.disableTextSelection = true;
	};
}

export { View, ViewPanel };
