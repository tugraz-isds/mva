<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Navbar from '../components/navbar/Navbar.svelte';
  import { isOffscreenCanvasSupported } from '../util/util';
  import { activeViewsStore } from '../stores/views';
  import Layout_1 from '../components/views/Layout-1.svelte';
  import Layout_2 from '../components/views/Layout-2.svelte';
  import Layout_3 from '../components/views/Layout-3.svelte';
  import Layout_4 from '../components/views/Layout-4.svelte';
  import Layout_5 from '../components/views/Layout-5.svelte';
  import Layout_6 from '../components/views/Layout-6.svelte';
  import type { View } from '../components/views/ViewType';

  let offScreenSupported = true;

  let activeViews: View[];
  $: activeViews = views.filter((view) => view.visible);

  let views: View[];
  const unsubscribeActive = activeViewsStore.subscribe((value) => {
    views = value;
  });

  const handleSwap = (title: string, e: Event) => {
    const index1 = views.findIndex((view: View) => view.title === title);
    const index2 = views.findIndex((view: View) => view.title === (e.target as HTMLElement).textContent);

    if (index1 !== -1 && index2 !== -1) {
      [views[index1], views[index2]] = [views[index2], views[index1]];
      activeViewsStore.set(views);
    }
  };

  onMount(() => {
    const canvasEl: HTMLCanvasElement = document.createElement('canvas');
    offScreenSupported = isOffscreenCanvasSupported(canvasEl);
  });

  onDestroy(() => {
    unsubscribeActive();
  });
</script>

{#if offScreenSupported}
  <div class="w-full h-full">
    <Navbar />
    <div class="w-full h-[96%]">
      {#if activeViews.length === 1}
        <Layout_1 views={activeViews} {handleSwap} />
      {:else if activeViews.length === 2}
        <Layout_2 views={activeViews} {handleSwap} />
      {:else if activeViews.length === 3}
        <Layout_3 views={activeViews} {handleSwap} />
      {:else if activeViews.length === 4}
        <Layout_4 views={activeViews} {handleSwap} />
      {:else if activeViews.length === 5}
        <Layout_5 views={activeViews} {handleSwap} />
      {:else if activeViews.length === 6}
        <Layout_6 views={activeViews} {handleSwap} />
      {/if}
    </div>
  </div>
{:else}
  <div class="w-full h-full">
    <div class="w-1/2 w-full text-center pt-2 bg-red-200">
      <b>Your browser does not support OffscreenCanvas with a WebGL Context</b>
      <p>
        To use the MVA app you need to download a browser that supports OffscreenCanvas. Check the browser support on
        <a href="https://caniuse.com/#feat=offscreencanvas" target="_blank" class="text-blue-600"
          >https://caniuse.com/#feat=offscreencanvas</a
        >.
      </p>
    </div>
  </div>
{/if}

<style global>
  :global(.splitpanes.modern-theme) :global(.splitpanes__pane) {
    background-color: white;
  }
  :global(.splitpanes.modern-theme) :global(.splitpanes__splitter) {
    background-color: #ccc;
    position: relative;
  }
  :global(.splitpanes.modern-theme) :global(.splitpanes__splitter:before) {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    transition: opacity 0.4s;
    background-color: #2db9d2;
    opacity: 0;
    z-index: 1;
  }
  :global(.splitpanes.modern-theme) :global(.splitpanes__splitter:hover:before) {
    opacity: 1;
  }

  :global(.modern-theme.splitpanes--vertical) > :global(.splitpanes__splitter:before) {
    left: -3px;
    right: -3px;
    height: 100%;
    cursor: col-resize;
  }
  :global(.modern-theme.splitpanes--horizontal) > :global(.splitpanes__splitter:before) {
    top: -3px;
    bottom: -3px;
    width: 100%;
    cursor: row-resize;
  }

  :global(.splitpanes.no-splitter) :global(.splitpanes__pane) {
    background-color: #f8f8f8;
  }
  :global(.splitpanes.no-splitter) :global(.splitpanes__splitter) {
    background-color: #ccc;
    position: relative;
  }

  :global(.no-splitter.splitpanes--horizontal) > :global(.splitpanes__splitter:before) {
    width: 0.225rem;
    pointer-events: none;
    cursor: none;
  }
  :global(.no-splitter.splitpanes--vertical) > :global(.splitpanes__splitter:before) {
    height: 0.225rem;
    pointer-events: none;
    cursor: none;
  }
</style>
