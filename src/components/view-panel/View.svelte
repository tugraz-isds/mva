<script lang="ts">
  import { onDestroy } from 'svelte';
  import { openWindow } from 'svelte-window-system';
  import { Button, Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import { ArrowUpDownOutline, ExpandOutline, DownloadOutline, FloppyDiskOutline } from 'flowbite-svelte-icons';
  import { activeViewsStore } from '../../stores/views';
  import HistogramSettings from '../parcoord/histograms/HistogramSettings.svelte';
  import DimensionPickers from '../scatterplot/DimensionPickers.svelte';
  import MethodPicker from '../simmap/MethodPicker.svelte';
  import TableVisibleDimensions from '../table/TableVisibleDimensions.svelte';
  import ParcoordVisibleDimensions from '../parcoord/ParcoordVisibleDimensions.svelte';
  import type { View } from './ViewType';
  import SelectionShape from '../scatterplot/SelectionShape.svelte';

  export let otherViews: View[];
  export let handleSwap: (title: string, e: Event) => void;
  export let currView: View;
  export let parentHeight: number;

  let showView = true;

  // Get active views from store
  let activeViews: View[];
  const unsubscribeActive = activeViewsStore.subscribe((value) => {
    activeViews = value;
  });

  $: otherViews = otherViews?.filter((view: View) => view.title !== currView.title);

  function openWinbox() {
    showView = false;
    activeViewsStore.set(activeViews.filter((view: View) => view.title !== currView.title));
    openWindow(currView.component, {
      width: window.innerWidth * 0.8,
      height: window.innerHeight * 0.8,
      title: currView.title,
      customTitlebarClass: 'bg-sky-900 font-sans'
      //customTitlebarButtons: [{ value: 'X', callback: () => {} }]
    });
  }

  // onMount(() => {
  // 	window.addEventListener('closeWinbox', (event: any) => {
  // 		if (currView.id === event.detail.id) {
  // 			showView = true;
  // 			activeViewsStore.set([...activeViews, currView]);
  // 		}
  // 	});
  // });

  function saveSVG() {
    const event = new Event(`call-save-svg-${currView.id}`);
    window.dispatchEvent(event);
  }

  onDestroy(() => {
    unsubscribeActive();
  });
</script>

<div class="w-full h-full p-1 {showView ? 'block' : 'hidden'}">
  <div class="flex flex-row justify-between" style="height: 18px; font-size: 14px;">
    <div class="flex flex-row items-center">
      <span>{currView.title}</span>
      {#if currView.id === 'table'}
        <TableVisibleDimensions height={parentHeight - 10} />
      {:else if currView.id === 'parcoord'}
        <ParcoordVisibleDimensions height={parentHeight - 10} />
      {/if}
    </div>
    <div class="w-1/2 flex flex-row justify-center items-center">
      {#if currView.id === 'parcoord'}
        <HistogramSettings />
      {:else if currView.id === 'scatterplot'}
        <DimensionPickers />
        <SelectionShape title={currView.id} />
      {:else if currView.id === 'simmap'}
        <MethodPicker />
        <SelectionShape title={currView.id} />
      {/if}
    </div>
    <div id="{currView.id}-expand-container">
      <div class="flex flex-row gap-1">
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
        <Button on:click={openWinbox} class="p-0 m-0 text-black">
          <ExpandOutline
            id="{currView.id}-expand"
            size="sm"
            class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
          />
        </Button>
        <Tooltip style="z-index: 1000;" type="light">Expand View</Tooltip>
        {#if ['parcoord', 'scatterplot', 'simmap'].includes(currView.id)}
          <Button on:click={saveSVG} class="p-0 m-0 text-black">
            <DownloadOutline
              id="{currView.id}-expand"
              size="sm"
              class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
            />
          </Button>
          <Tooltip style="z-index: 1000;" type="light">Save SVG</Tooltip>
        {/if}
      </div>
    </div>
  </div>
  <div class="view-content" style="height: 95%;">
    <svelte:component this={currView.component} />
  </div>
</div>
