<script lang="ts">
  import { onDestroy } from 'svelte';
  import { DropdownItem } from 'flowbite-svelte';
  import { labelDimension } from '../../stores/dataset';

  let showMenu = false; // Flag if context is visible
  let menuStyle = ''; // Menu style string
  let dim = ''; // Current dimension
  let labelDim: string; // Dataset label dimension
  const activeClass = 'font-medium py-1 px-1 text-sm hover:bg-gray-100';
  const disabledClass =
    'font-medium py-1 px-1 text-sm hover:bg-gray-100 text-gray-400 cursor-not-allowed';

  const unsubscribeLabelDim = labelDimension.subscribe((value: string) => {
    labelDim = value;
  });

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

  onDestroy(() => {
    unsubscribeLabelDim();
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
      on:click={setLabel}>Use as label</DropdownItem
    >
    <DropdownItem defaultClass={activeClass}>Set as categorical</DropdownItem>
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
