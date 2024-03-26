<script lang="ts">
  import { onDestroy } from 'svelte';
  import { DropdownItem } from 'flowbite-svelte';
  import { dimensionDataStore, labelDimension } from '../../stores/dataset';
  import type { DimensionDataType } from '../../util/types';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';

  let showMenu = false;
  let dim = '';
  let menuStyle = '';
  let labelDim: string;
  let validActive = true;

  const activeClass = 'font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100';
  const disabledClass =
    'font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100 text-gray-400 cursor-not-allowed';

  const unsubscribeLabelDim = labelDimension.subscribe((value: string) => {
    labelDim = value;
  });

  let dimensionData: Map<string, DimensionDataType> = new Map();
  const unsubscribeDimensionData = dimensionDataStore.subscribe(
    (value: Map<string, DimensionDataType>) => {
      dimensionData = value;
    }
  );

  export function showContextMenu(event: MouseEvent, dimension: string) {
    event.preventDefault();
    showMenu = true;

    const { clientX, clientY } = event;
    menuStyle = `left: ${clientX}px; top: ${clientY}px;`;
    dim = dimension;
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
    const dimData = $dimensionDataStore.get(dim);
    if (!dimData) return;
    dimData.active = !dimData.active;
    $dimensionDataStore.set(dim, dimData);
  }

  onDestroy(() => {
    unsubscribeLabelDim();
    unsubscribeDimensionData();
  });
</script>

{#if showMenu}
  <div
    class="context-menu"
    style={menuStyle}
    on:click={hideContextMenu}
    on:mouseleave={hideContextMenu}
    on:keydown={hideContextMenu}
  >
    <DropdownItem
      disabled={dim === labelDim}
      defaultClass={dim === labelDim ? disabledClass : activeClass}
      on:click={setLabel}>Use as Label</DropdownItem
    >
    <DropdownItem defaultClass={activeClass} on:click={setDimensionActive}
      >Set as {dimensionData.get(dim)?.active ? 'Inactive' : 'Active'}</DropdownItem
    >
  </div>
{/if}

<style>
  .context-menu {
    position: fixed;
    background: white;
    border: 1px solid #ccc;
    padding: 5px;
    z-index: 1000;
    width: 150px;
  }
</style>
