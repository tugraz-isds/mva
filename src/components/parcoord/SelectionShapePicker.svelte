<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Dropdown, DropdownItem, Tooltip } from 'flowbite-svelte';
  import { ChevronDownOutline, CheckOutline } from 'flowbite-svelte-icons';
  import { shape_line_dashed_icon, shape_rectangle_dashed_icon } from '../../util/icon-definitions';
  import type { ParcoordSelectionShapeType } from './types';
  import { parcoordSelectionShapeStore } from '../../stores/parcoord';

  const SELECTION_SHAPES: Map<ParcoordSelectionShapeType, string> = new Map([
    ['line', shape_line_dashed_icon],
    ['rectangle', shape_rectangle_dashed_icon]
  ]);

  let isShapeDropdownOpen = false;

  let selectionShape: ParcoordSelectionShapeType;
  const unsubscribeSelectionShape = parcoordSelectionShapeStore.subscribe((value) => {
    selectionShape = value;
  });

  function setShape(shape: ParcoordSelectionShapeType) {
    isShapeDropdownOpen = false;
    if (shape === selectionShape) return;
    parcoordSelectionShapeStore.set(shape);
  }

  onDestroy(() => {
    unsubscribeSelectionShape();
  });
</script>

<div
  id="parcoord-selection-shape"
  class="h-full flex flex-row items-center px-1 text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300 ml-8"
>
  {@html SELECTION_SHAPES.get(selectionShape)?.replace(
    '<svg',
    `<svg width="10" height="10" stroke="black" fill="none"`
  )}
  <ChevronDownOutline size="xs" />
</div>
<Tooltip style="z-index: 1000;" type="light">Selection Shape</Tooltip>
<Dropdown
  triggeredBy="#parcoord-selection-shape"
  bind:open={isShapeDropdownOpen}
  class="overflow-y-auto"
  style="z-index: 1000; padding: 5px;"
>
  {#each [...SELECTION_SHAPES] as [shape, icon]}
    <DropdownItem
      on:click={() => setShape(shape)}
      defaultClass="flex items-center font-medium py-1 px-0.5 text-xs hover:bg-gray-100"
    >
      <CheckOutline size="xs" class="ms-2 mr-2" style="visibility: {shape === selectionShape ? 'visible' : 'hidden'}" />
      <div class="flex flex-row items-center justify-between w-20">
        {shape[0].toUpperCase() + shape.slice(1)}
        {@html icon.replace('<svg', `<svg width="10" height="10" stroke="black" fill="none"`)}
      </div>
    </DropdownItem>
  {/each}
</Dropdown>
