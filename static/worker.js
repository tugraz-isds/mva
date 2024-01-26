onmessage = (e) => {
	switch (e.data.msg) {
		case 'start':
			const { offscreenCanvas } = e.data;
			console.log('Started calculating');
			const ctx = offscreenCanvas.getContext('2d');
			if (!ctx) return;
			let i = 0;
			while (i < 10000000000) {
				i++;
			}
			ctx.font = '30px serif';
			ctx.fillText('Hello World', 0, 90);
			console.log('Stopped calculating');
			break;
		default:
			break;
	}
};
