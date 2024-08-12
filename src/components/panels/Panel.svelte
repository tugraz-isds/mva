<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button, Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import { ArrowUpDownOutline, DownloadOutline, RefreshOutline } from 'flowbite-svelte-icons';
  import { activePanelsStore } from '../../stores/panels';
  import HistogramSettings from '../parcoord/histograms/HistogramSettings.svelte';
  import DimensionPickers from '../scatterplot/DimensionPickers.svelte';
  import MethodPicker from '../simmap/MethodPicker.svelte';
  import TableVisibleDimensions from '../table/TableVisibleDimensions.svelte';
  import ParcoordVisibleDimensions from '../parcoord/ParcoordVisibleDimensions.svelte';
  import ScatterplotSelectionShape from '../scatterplot/SelectionShapePicker.svelte';
  import ParcoordSelectionShape from '../parcoord/SelectionShapePicker.svelte';
  import OverviewSettings from '../splom/OverviewSettings.svelte';
  import type { PanelType } from './types';

  export let otherPanels: PanelType[];
  export let handleSwap: (title: string, e: Event) => void;
  export let currPanel: PanelType;

  let showPanel = true;
  let unique = {}; // Needed for refreshing panel

  let panels: PanelType[];
  const unsubscribeActive = activePanelsStore.subscribe((value) => {
    panels = value;
  });

  $: otherPanels = panels?.filter((panel: PanelType) => panel.visible && panel.title !== currPanel.title);

  function saveSVG() {
    const event = new Event(`call-save-svg-${currPanel.id}`);
    window.dispatchEvent(event);
  }

  function refresh() {
    unique = {};
  }

  onDestroy(() => {
    unsubscribeActive();
  });
</script>

<div class="w-full h-full p-1 flex flex-col {showPanel ? 'block' : 'hidden'}">
  <div class="flex justify-between gap-2">
    <div class="flex text-xs text-nowrap">
      {currPanel.title}
      {#if currPanel.id === 'table'}
        <TableVisibleDimensions height={30 - 10} />
      {:else if currPanel.id === 'parcoord'}
        <ParcoordVisibleDimensions height={30 - 10} />
      {/if}
    </div>
    {#if currPanel.id === 'parcoord'}
      <HistogramSettings />
    {:else if currPanel.id === 'scatterplot'}
      <DimensionPickers />
    {:else if currPanel.id === 'simmap'}
      <MethodPicker />
    {/if}
    {#if currPanel.id === 'scatterplot' || currPanel.id === 'simmap'}
      <ScatterplotSelectionShape title={currPanel.id} />
    {:else if currPanel.id === 'parcoord'}
      <ParcoordSelectionShape />
    {:else if currPanel.id === 'splom'}
      <OverviewSettings />
    {/if}
    <div class="flex gap-0 lg:gap-1 items-center">
      {#if ['splom', 'parcoord', 'scatterplot', 'simmap'].includes(currPanel.id)}
        <Button on:click={refresh} class="p-0 m-0 text-black focus:ring-transparent">
          <RefreshOutline
            id="{currPanel.id}-refresh"
            size="sm"
            class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
          />
        </Button>
        <Tooltip style="z-index: 1000;" type="light">Refresh Panel</Tooltip>
      {/if}
      <ArrowUpDownOutline
        id="{currPanel.id}-swap"
        size="sm"
        class="rotate-90 text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
      />
      <Tooltip style="z-index: 1000;" type="light">Swap Panel</Tooltip>
      <Dropdown triggeredBy="#{currPanel.id}-swap" style="z-index: 1000;">
        <div slot="header" class="py-1 px-2">
          <span class="font-medium block text-sm text-gray-900">Swap Panel With</span>
        </div>
        {#each otherPanels as panel (panel.id)}
          <DropdownItem
            on:click={(e) => handleSwap(currPanel.title, e)}
            defaultClass="py-1 px-2 text-sm hover:bg-gray-100">{panel.title}</DropdownItem
          >
        {/each}
      </Dropdown>
      {#if ['splom', 'parcoord', 'scatterplot', 'simmap'].includes(currPanel.id)}
        <Button on:click={saveSVG} class="p-0 m-0 text-black focus:ring-transparent">
          <DownloadOutline
            id="{currPanel.id}-download"
            size="sm"
            class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
          />
        </Button>
        <Tooltip style="z-index: 1000;" type="light">Save SVG</Tooltip>
      {/if}
    </div>
  </div>
  {#key unique}
    <div
      class="panel-content w-full h-full {currPanel.id === 'splom'
        ? 'overflow-y-auto overflow-x-auto scrollable-div'
        : ''}"
    >
      <svelte:component this={currPanel.component} />
    </div>
  {/key}
</div>

<style>
  .scrollable-div {
    scrollbar-width: thin;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 0.75rem;
  }
</style>
