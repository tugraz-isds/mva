<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button, Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import { ArrowUpDownOutline, DownloadOutline, RefreshOutline } from 'flowbite-svelte-icons';
  import { activeViewsStore } from '../../stores/views';
  import HistogramSettings from '../parcoord/histograms/HistogramSettings.svelte';
  import DimensionPickers from '../scatterplot/DimensionPickers.svelte';
  import MethodPicker from '../simmap/MethodPicker.svelte';
  import TableVisibleDimensions from '../table/TableVisibleDimensions.svelte';
  import ParcoordVisibleDimensions from '../parcoord/ParcoordVisibleDimensions.svelte';
  import ScatterplotSelectionShape from '../scatterplot/SelectionShapePicker.svelte';
  import ParcoordSelectionShape from '../parcoord/SelectionShapePicker.svelte';
  import OverviewSettings from '../splom/OverviewSettings.svelte';
  import type { View } from './types';

  export let otherViews: View[];
  export let handleSwap: (title: string, e: Event) => void;
  export let currView: View;

  let showView = true;
  let unique = {}; // Needed for refreshing view

  let views: View[];
  const unsubscribeActive = activeViewsStore.subscribe((value) => {
    views = value;
  });

  $: otherViews = views?.filter((view: View) => view.visible && view.title !== currView.title);

  function saveSVG() {
    const event = new Event(`call-save-svg-${currView.id}`);
    window.dispatchEvent(event);
  }

  function refresh() {
    unique = {};
  }

  onDestroy(() => {
    unsubscribeActive();
  });
</script>

<div class="w-full h-full p-1 flex flex-col {showView ? 'block' : 'hidden'}">
  <div class="flex justify-between gap-2">
    <div class="flex text-xs text-nowrap">
      {currView.title}
      {#if currView.id === 'table'}
        <TableVisibleDimensions height={30 - 10} />
      {:else if currView.id === 'parcoord'}
        <ParcoordVisibleDimensions height={30 - 10} />
      {/if}
    </div>
    {#if currView.id === 'parcoord'}
      <HistogramSettings />
    {:else if currView.id === 'scatterplot'}
      <DimensionPickers />
    {:else if currView.id === 'simmap'}
      <MethodPicker />
    {/if}
    {#if currView.id === 'scatterplot' || currView.id === 'simmap'}
      <ScatterplotSelectionShape title={currView.id} />
    {:else if currView.id === 'parcoord'}
      <ParcoordSelectionShape />
    {:else if currView.id === 'splom'}
      <OverviewSettings />
    {/if}
    <div class="flex gap-0 lg:gap-1 items-center">
      {#if ['splom', 'parcoord', 'scatterplot', 'simmap'].includes(currView.id)}
        <Button on:click={refresh} class="p-0 m-0 text-black focus:ring-transparent">
          <RefreshOutline
            id="{currView.id}-refresh"
            size="sm"
            class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
          />
        </Button>
        <Tooltip style="z-index: 1000;" type="light">Refresh View</Tooltip>
      {/if}
      <ArrowUpDownOutline
        id="{currView.id}-swap"
        size="sm"
        class="rotate-90 text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
      />
      <Tooltip style="z-index: 1000;" type="light">Swap View</Tooltip>
      <Dropdown triggeredBy="#{currView.id}-swap" style="z-index: 1000;">
        <div slot="header" class="py-1 px-2">
          <span class="font-medium block text-sm text-gray-900">Swap View With</span>
        </div>
        {#each otherViews as view (view.id)}
          <DropdownItem
            on:click={(e) => handleSwap(currView.title, e)}
            defaultClass="py-1 px-2 text-sm hover:bg-gray-100">{view.title}</DropdownItem
          >
        {/each}
      </Dropdown>
      {#if ['splom', 'parcoord', 'scatterplot', 'simmap'].includes(currView.id)}
        <Button on:click={saveSVG} class="p-0 m-0 text-black focus:ring-transparent">
          <DownloadOutline
            id="{currView.id}-download"
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
      class="view-content w-full h-full {currView.id === 'splom'
        ? 'overflow-y-auto overflow-x-auto scrollable-div'
        : ''}"
    >
      <svelte:component this={currView.component} />
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
