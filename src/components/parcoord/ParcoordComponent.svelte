<script lang="ts">
	import { onMount } from 'svelte';
	import * as PIXI from 'pixi.js';
	console.log('Is WebGL supported: ', PIXI.utils.isWebGLSupported());

	// PixiJS
	let app;

	onMount(async () => {
		app = new PIXI.Application({
			resolution: 1,
			backgroundColor: 0x10bb99
		});

		const sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
		sprite.tint = 0xff0000;
		sprite.width = sprite.height = 100;
		sprite.x = sprite.y = 100;

		const text = new PIXI.Text(
			'PixiJS with SvelteKit!',
			new PIXI.TextStyle({
				fontFamily: 'Helvetica',
				fill: '#222',
				fontWeight: '600',
				fontSize: 24,
				stroke: '#fff',
				strokeThickness: 8,
				lineJoin: 'round'
			})
		);
		text.position.set(150, 150);

		app.stage.addChild(sprite, text);

		const parcoordDiv = document.getElementById('parcoord-div');
		if (parcoordDiv instanceof HTMLElement) {
			const canvas = app.view as HTMLCanvasElement;
			canvas.id = 'parcoord-canvas';
			canvas.style.width = '100%';
			canvas.style.height = '100%';
			parcoordDiv.appendChild(canvas);
		}
	});
</script>

<div id="parcoord-div" />
