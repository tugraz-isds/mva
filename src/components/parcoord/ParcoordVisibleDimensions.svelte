<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Bars3 } from 'svelte-heros-v2';
  import { Checkbox, Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
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

<Bars3 id="parcoord-dims-dropdown" size="14" class="rotate-90 text-grey-900 cursor-pointer hover:bg-sky-100" />
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
