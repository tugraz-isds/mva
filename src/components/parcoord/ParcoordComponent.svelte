<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox';
  import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper';

  let canvasEl: HTMLCanvasElement;
  let camera: THREE.OrthographicCamera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let width: number;
  let height: number;
  let selectionBox: SelectionBox;
  let selectionHelper: SelectionHelper;

  function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
    camera.position.set(0, 0, 5);
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasEl });
    renderer.setClearColor(0xffff00);
    renderer.setSize(width, height);
    const parcoordDiv = document.getElementById('parcoord-canvas');
    if (parcoordDiv instanceof HTMLElement) parcoordDiv.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry();

    for (let i = 0; i < width; i += 20) {
      console.log(i);
      const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
      object.position.x = i;
      object.position.y = i;
      object.position.z = 0;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() * 2 + 1;
      object.scale.y = Math.random() * 2 + 1;
      object.scale.z = Math.random() * 2 + 1;

      object.castShadow = true;
      object.receiveShadow = true;

      scene.add(object);
    }

    selectionBox = new SelectionBox(camera, scene);
    selectionHelper = new SelectionHelper(renderer, 'selectBox');
  }

  function render() {
    if (!renderer) return;
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function getNormalizedCoordinates(e: MouseEvent, element: HTMLElement) {
    const rect = element.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
      y: -((e.clientY - rect.top) / rect.height) * 2 + 1
    };
  }

  function onPointerDown(e: MouseEvent) {
    const { x, y } = getNormalizedCoordinates(e, canvasEl);

    for (const item of selectionBox.collection) {
      item.material.emissive.set(0x000000);
    }

    selectionBox.startPoint.set(x, y, 0.5);
  }

  function onPointerMove(e: MouseEvent) {
    const { x, y } = getNormalizedCoordinates(e, canvasEl);

    if (selectionHelper.isDown) {
      for (let i = 0; i < selectionBox.collection.length; i++) {
        selectionBox.collection[i].material.emissive.set(0x000000);
      }

      selectionBox.endPoint.set(x, y, 0.5);

      const allSelected = selectionBox.select();
      for (let i = 0; i < allSelected.length; i++) {
        allSelected[i].material.emissive.set(0xffffff);
      }
    }
  }

  function onPointerUp(e: MouseEvent) {
    const { x, y } = getNormalizedCoordinates(e, canvasEl);
    selectionBox.endPoint.set(x, y, 0.5);

    const allSelected = selectionBox.select();
    for (let i = 0; i < allSelected.length; i++) {
      allSelected[i].material.emissive.set(0xffffff);
    }
  }

  onMount(() => {
    initScene();
    animate();
  });
</script>

<div id="parcoord-canvas" class="w-full h-full" bind:clientWidth={width} bind:clientHeight={height}>
  <canvas
    bind:this={canvasEl}
    class="w-full h-full"
    on:pointerdown={onPointerDown}
    on:pointermove={onPointerMove}
    on:pointerup={onPointerUp}
  />
</div>

<style>
  :global(.selectBox) {
    border: 1px solid #55aaff;
    background-color: rgba(75, 160, 255, 0.3);
    position: fixed;
  }
</style>
