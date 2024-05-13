<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Checkbox, Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import { BarsOutline, ChevronDownOutline } from 'flowbite-svelte-icons';
  import { parcoordVisibleDimensionsStore } from '../../stores/parcoord';
  import { isInteractableStore } from '../../stores/brushing';
  import type { ParcoordVisibleDimensionsType } from './types';

  export let height: number;

  let updatedHere = false;

  let parcoordVisibleDimensions: ParcoordVisibleDimensionsType[] = [];
  const unsubscribeParcoordVisibleDimensions = parcoordVisibleDimensionsStore.subscribe((value) => {
    if (updatedHere) updatedHere = false;
    else {
      parcoordVisibleDimensions = value?.filter((dim) => dim.title !== '_i' && dim.title !== '_partition');
    }
  });

  function updateParcoordVisibleDimensions(i: number) {
    updatedHere = true;
    const parcoordDims = parcoordVisibleDimensions;
    parcoordDims[i].visible = !parcoordDims[i].visible;
    parcoordVisibleDimensionsStore.set(parcoordDims);
  }

  onDestroy(() => {
    unsubscribeParcoordVisibleDimensions();
  });
</script>

<div
  id="parcoord-dims-dropdown"
  class="ml-1 flex flex-row text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
>
  <BarsOutline size="xs" class="rotate-90" />
  <ChevronDownOutline size="xs" />
</div>
<Tooltip style="z-index: 1000;" type="light">Parallel Coordinates Dimensions</Tooltip>
<div on:mouseenter={() => ($isInteractableStore = false)} on:mouseleave={() => ($isInteractableStore = true)}>
  <Dropdown
    triggeredBy="#parcoord-dims-dropdown"
    class="overflow-y-auto"
    style="z-index: 1000; padding: 5px; max-height: {height}%;"
  >
    {#each parcoordVisibleDimensions as dim, i}
      <DropdownItem defaultClass="font-medium py-0.5 px-2 text-xs hover:bg-gray-100">
        <Checkbox checked={dim.visible} on:change={() => updateParcoordVisibleDimensions(i)} />{dim.title}</DropdownItem
      >
    {/each}
  </Dropdown>
</div>
