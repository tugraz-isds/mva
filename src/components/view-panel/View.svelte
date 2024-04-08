<script lang="ts">
  import { onDestroy } from 'svelte';
  import { ArrowsRightLeft, ArrowsPointingOut, BookmarkSquare, EllipsisVertical } from 'svelte-heros-v2';
  import { openWindow } from 'svelte-window-system';
  import { Checkbox, Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import { activeViewsStore } from '../../stores/views';
  import HistogramSettings from '../parcoord/histograms/HistogramSettings.svelte';
  import DimensionPickers from '../scatterplot/DimensionPickers.svelte';
  import MethodPicker from '../simmap/MethodPicker.svelte';
  import type { View } from './ViewType';
  import { tableDimensionsStore } from '../../stores/table';
  import type { TableDimensionsType } from '../table/types';

  export let otherViews: View[];
  export let handleSwap: (title: string, e: Event) => void;
  export let currView: View;
  export let parentHeight: number;

  let showView = true;
  let updatedHere = false;
  let showTableDimensions = false;
  let menuStyle = '';

  // Get active views from store
  let activeViews: View[];
  const unsubscribeActive = activeViewsStore.subscribe((value) => {
    activeViews = value;
  });

  let tableDimensions: TableDimensionsType[] = [];
  const unsubscribeTableDimensions = tableDimensionsStore.subscribe((value) => {
    if (updatedHere) updatedHere = false;
    else tableDimensions = value;
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

  function openTableDimensions(e: MouseEvent) {
    menuStyle = `left: ${e.clientX + 10}px; top: ${e.clientY + 10}px;`;
    showTableDimensions = true;
  }

  function updateTableDimensions(i: number) {
    updatedHere = true;
    const tableDims = tableDimensions;
    tableDims[i].visible = !tableDims[i].visible;
    tableDimensionsStore.set(tableDims);
  }

  onDestroy(() => {
    unsubscribeActive();
    unsubscribeTableDimensions();
  });
</script>

<div class="w-full h-full p-1 {showView ? 'block' : 'hidden'}">
  <div class="flex flex-row justify-between" style="height: 18px; font-size: 14px;">
    <div class="flex flex-row items-center">
      <span>{currView.title}</span>
      {#if currView.id === 'table'}
        <EllipsisVertical
          id="table-dims-dropdown"
          size="16"
          class="text-grey-900 cursor-pointer hover:bg-sky-100"
          on:click={openTableDimensions}
        />
        <Tooltip style="z-index: 1000;" type="light">Table Dimensions</Tooltip>
        <Dropdown
          triggeredBy="#table-dims-dropdown"
          class="overflow-y-auto"
          style="z-index: 1000; padding: 5px; max-height: {parentHeight - 10}%;"
        >
          {#each tableDimensions as dim, i}
            <DropdownItem defaultClass="font-medium py-0.5 px-2 text-xs hover:bg-gray-100">
              <Checkbox checked={dim.visible} on:change={() => updateTableDimensions(i)} />{dim.title}</DropdownItem
            >
          {/each}
        </Dropdown>
      {/if}
    </div>
    <div class="w-1/2">
      {#if currView.id === 'parcoord'}
        <HistogramSettings />
      {:else if currView.id === 'scatterplot'}
        <DimensionPickers />
      {:else if currView.id === 'simmap'}
        <MethodPicker />
      {/if}
    </div>
    <div id="{currView.id}-expand-container">
      <div class="flex flex-row gap-1">
        <ArrowsRightLeft id="{currView.id}-swap" size="16" class="text-grey-900 cursor-pointer hover:bg-sky-100" />
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
        <ArrowsPointingOut
          id="{currView.id}-expand"
          size="16"
          class="text-grey-900 cursor-pointer hover:bg-sky-100"
          on:click={openWinbox}
        />
        <Tooltip style="z-index: 1000;" type="light">Expand View</Tooltip>
        {#if currView.id === 'parcoord'}
          <BookmarkSquare
            id="{currView.id}-save"
            size="16"
            class="text-grey-900 cursor-pointer hover:bg-sky-100"
            on:click={saveSVG}
          />
          <Tooltip style="z-index: 1000;" type="light">Save SVG</Tooltip>
        {/if}
      </div>
    </div>
  </div>
  <div class="view-content" style="height: 95%;">
    <svelte:component this={currView.component} />
  </div>
</div>
