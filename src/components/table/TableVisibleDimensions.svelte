<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Bars3 } from 'svelte-heros-v2';
  import { Checkbox, Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import type { TableVisibleDimensionsType } from './types';
  import { tableVisibleDimensionsStore } from '../../stores/table';

  export let height: number;

  let menuStyle = '';
  let updatedHere = false;

  let tableVisibleDimensions: TableVisibleDimensionsType[] = [];
  const unsubscribeTableVisibleDimensions = tableVisibleDimensionsStore.subscribe((value) => {
    if (updatedHere) updatedHere = false;
    else tableVisibleDimensions = value;
  });

  function updateTableVisibleDimensions(i: number) {
    updatedHere = true;
    const tableVisibleDims = tableVisibleDimensions;
    tableVisibleDims[i].visible = !tableVisibleDims[i].visible;
    tableVisibleDimensionsStore.set(tableVisibleDims);
  }

  onDestroy(() => {
    unsubscribeTableVisibleDimensions();
  });
</script>

<Bars3 id="table-dims-dropdown" size="14" class="rotate-90 text-grey-900 cursor-pointer hover:bg-sky-100" />
<Tooltip style="z-index: 1000;" type="light">Table Dimensions</Tooltip>
<Dropdown
  triggeredBy="#table-dims-dropdown"
  class="overflow-y-auto"
  style="z-index: 1000; padding: 5px; max-height: {height}%;"
>
  {#each tableVisibleDimensions as dim, i}
    <DropdownItem defaultClass="font-medium py-0.5 px-2 text-xs hover:bg-gray-100">
      <Checkbox checked={dim.visible} on:change={() => updateTableVisibleDimensions(i)} />{dim.title}</DropdownItem
    >
  {/each}
</Dropdown>
