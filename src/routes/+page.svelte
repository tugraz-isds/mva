<script lang="ts">
  import { onMount } from 'svelte';
  import Navbar from '../components/navbar/Navbar.svelte';
  import ViewPanel from '../components/view-panel/ViewPanel.svelte';
  import { isOffscreenCanvasSupported } from '../util/util';

  let offScreenSupported = true;

  onMount(() => {
    const canvasEl: HTMLCanvasElement = document.createElement('canvas');
    offScreenSupported = isOffscreenCanvasSupported(canvasEl);
  });
</script>

{#if offScreenSupported}
  <div class="w-full h-full">
    <Navbar />
    <ViewPanel />
  </div>
{:else}
  <div class="w-full h-full">
    <div class="w-1/2 w-full text-center pt-2 bg-red-200">
      <b>Your browser does not support OffscreenCanvas with a WebGL Context</b>
      <p>
        To use the MVA app you need to download a browser that supports OffscreenCanvas. Check the
        browser support on
        <a href="https://caniuse.com/#feat=offscreencanvas" target="_blank" class="text-blue-600"
          >https://caniuse.com/#feat=offscreencanvas</a
        >.
      </p>
    </div>
  </div>
{/if}
