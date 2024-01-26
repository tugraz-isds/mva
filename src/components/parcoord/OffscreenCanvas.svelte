<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let offscreenCanvas: OffscreenCanvas;
	let worker: Worker;

	function calculate() {
		console.log('Button pressed');
		worker.postMessage(
			{
				msg: 'start',
				offscreenCanvas
			},
			[offscreenCanvas]
		);
	}

	onMount(() => {
		worker = new Worker('./worker.js');
		offscreenCanvas = canvas.transferControlToOffscreen();

		worker.onmessage = (e) => {
			console.log('got message from worker', e);
			switch (e.data.msg) {
				case 'render':
					const { btm } = e.data;
					const ctx = canvas.getContext('bitmaprenderer');
					ctx?.transferFromImageBitmap(btm);
					break;
				default:
					break;
			}
		};
	});
</script>

<div>
	<h1>Offscreen example</h1>
	<button on:click={calculate}>Start</button>
	<input style="border: 1px black solid;" />
	<canvas bind:this={canvas} width="200" height="200" style="background-color: red;" />
</div>
