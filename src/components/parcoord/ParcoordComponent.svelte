<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox';
  import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper';

  let canvasEl: HTMLCanvasElement;
  let camera: THREE.PerspectiveCamera;
  let scene: THREE.Scene;
  let renderer: THREE.WebGLRenderer;
  let width: number;
  let height: number;
  let selectionBox: SelectionBox;
  let selectionHelper: SelectionHelper;

  function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 500);
    camera.position.set(0, 0, 50);
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasEl });
    renderer.setClearColor(0xffff00);
    renderer.setSize(width, height);
    const parcoordDiv = document.getElementById('parcoord-canvas');
    if (parcoordDiv instanceof HTMLElement) parcoordDiv.appendChild(renderer.domElement);

    const light = new THREE.SpotLight(0xffff00, 10000);
    light.position.set(0, 25, 50);
    light.angle = Math.PI / 5;

    light.castShadow = true;
    light.shadow.camera.near = 10;
    light.shadow.camera.far = 100;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    scene.add(light);

    const geometry = new THREE.BoxGeometry();

    for (let i = 0; i < 20; i++) {
      const object = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff }));

      object.position.x = Math.random() * 80 - 40;
      object.position.y = Math.random() * 45 - 25;
      object.position.z = Math.random() * 45 - 25;

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

  function getNormalizedCoordinates(e, element) {
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
