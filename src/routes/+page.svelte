<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Navbar from '../components/navbar/Navbar.svelte';
  import { isOffscreenCanvasSupported } from '../util/util';
  import { activePanelsStore, isCurrentlyResizing } from '../stores/panels';
  import { datasetStore } from '../stores/dataset';
  import { panels as initialPanels } from '../components/panels/Panels';
  import StartPanel from '../components/panels/StartPanel.svelte';
  import Layout_1 from '../components/panels/Layout-1.svelte';
  import Layout_2 from '../components/panels/Layout-2.svelte';
  import Layout_3 from '../components/panels/Layout-3.svelte';
  import Layout_4 from '../components/panels/Layout-4.svelte';
  import Layout_5 from '../components/panels/Layout-5.svelte';
  import Layout_6 from '../components/panels/Layout-6.svelte';
  import type { PanelType } from '../components/panels/types';

  let offScreenSupported = true;
  let showImportButtons = false;

  let activePanels: PanelType[];
  $: activePanels = panels.filter((panel) => panel.visible);

  let panels: PanelType[];
  const unsubscribeActive = activePanelsStore.subscribe((value) => {
    panels = value;
  });

  const handleSwap = (title: string, e: Event) => {
    const index1 = panels.findIndex((panel: PanelType) => panel.title === title);
    const index2 = panels.findIndex((panel: PanelType) => panel.title === (e.target as HTMLElement).textContent);

    if (index1 !== -1 && index2 !== -1) {
      [panels[index1], panels[index2]] = [panels[index2], panels[index1]];
      activePanelsStore.set(panels);
      localStorage.setItem(
        'activePanels',
        JSON.stringify(panels.filter((panel) => panel.visible).map((panel) => panel.id))
      );
    }
  };

  function startResize() {
    if (!$isCurrentlyResizing) isCurrentlyResizing.set(true);
  }

  function endResize() {
    if ($isCurrentlyResizing) isCurrentlyResizing.set(false);
  }

  onMount(() => {
    const canvasEl: HTMLCanvasElement = document.createElement('canvas');
    offScreenSupported = isOffscreenCanvasSupported(canvasEl);

    const activePanelsIdsStr = localStorage.getItem('activePanels');
    if (activePanelsIdsStr) {
      const activePanelsIds = JSON.parse(activePanelsIdsStr);
      const activePanels: PanelType[] = [];
      activePanelsIds.forEach((currPanel: string) => {
        const panel = initialPanels.find((p) => currPanel === p.id);
        if (panel) activePanels.push(panel);
      });
      activePanelsStore.set(activePanels);
    }

    setTimeout(() => {
      showImportButtons = true;
    }, 500);
  });

  onDestroy(() => {
    unsubscribeActive();
  });
</script>

{#if offScreenSupported}
  <div class="w-full h-full">
    <Navbar />
    {#if !showImportButtons}
      <div />
    {:else if $datasetStore.length === 0}
      <StartPanel />
    {:else}
      <div class="w-full h-[96%]">
        {#if activePanels.length === 1}
          <Layout_1 panels={activePanels} {handleSwap} />
        {:else if activePanels.length === 2}
          <Layout_2 panels={activePanels} {handleSwap} {startResize} {endResize} />
        {:else if activePanels.length === 3}
          <Layout_3 panels={activePanels} {handleSwap} {startResize} {endResize} />
        {:else if activePanels.length === 4}
          <Layout_4 panels={activePanels} {handleSwap} {startResize} {endResize} />
        {:else if activePanels.length === 5}
          <Layout_5 panels={activePanels} {handleSwap} {startResize} {endResize} />
        {:else if activePanels.length === 6}
          <Layout_6 panels={activePanels} {handleSwap} {startResize} {endResize} />
        {/if}
      </div>
    {/if}
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
