<script lang="ts">
  import { onDestroy } from 'svelte';
  import { DropdownItem } from 'flowbite-svelte';
  import { dimensionDataStore, labelDimension } from '../../stores/dataset';
  import type { DimensionDataType } from '../../util/types';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';

  let showMenu = false;
  let dim = '';
  let isDisabled = false;
  let menuStyle = '';
  let labelDim: string;

  const unsubscribeLabelDim = labelDimension.subscribe((value) => {
    labelDim = value;
  });

  let dimensionData: Map<string, DimensionDataType> = new Map();
  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    dimensionData = value;
  });

  export function showContextMenu(event: MouseEvent, dimension: string) {
    event.preventDefault();
    showMenu = true;

    const { clientX, clientY } = event;
    menuStyle = `left: ${clientX}px; top: ${clientY}px;`;
    dim = dimension;
    isDisabled = dim === '_i' || dim === '_partition';
  }

  export function hideContextMenu() {
    showMenu = false;
  }

  function setLabel() {
    labelDimension.set(dim);
  }

  function setDimensionActive() {
    if (dim === $xDimStore || dim === $yDimStore) {
      alert(
        `Cannot set dimension '${dim}' as '${
          dimensionData.get(dim)?.active ? 'Inactive' : 'Active'
        }' as it is used in scatterplot.`
      );
      return;
    }
    const dimData = $dimensionDataStore;
    const currDimData = dimData.get(dim);
    if (!currDimData) return;
    currDimData.active = !currDimData.active;
    dimData.set(dim, currDimData);
    dimensionDataStore.set(dimData);
  }

  onDestroy(() => {
    unsubscribeLabelDim();
    unsubscribeDimensionData();
  });
</script>

{#if showMenu}
  <div
    class="context-menu fixed bg-white border border-gray-300 p-1 w-28 z-10"
    style={menuStyle}
    on:click={hideContextMenu}
    on:mouseleave={hideContextMenu}
    on:keydown={hideContextMenu}
  >
    <DropdownItem
      disabled={isDisabled || dim === labelDim}
      defaultClass={`font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100 ${
        isDisabled || dim === labelDim ? 'text-gray-400 cursor-not-allowed' : ''
      }`}
      on:click={setLabel}>Use as Label</DropdownItem
    >
    <DropdownItem
      disabled={isDisabled}
      defaultClass={`font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100 ${
        isDisabled ? 'text-gray-400 cursor-not-allowed' : ''
      }`}
      on:click={setDimensionActive}>Set as {dimensionData.get(dim)?.active ? 'Inactive' : 'Active'}</DropdownItem
    >
  </div>
{/if}
