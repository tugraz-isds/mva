<script lang="ts">
  import { DropdownItem } from 'flowbite-svelte';
  import type { DimensionType } from '../../util/types';

  export let changeColumnType: (idx: number | null, newColumnType: DimensionType | null) => void;

  let showMenu = false;
  let menuStyle = '';
  let currHeader: { title: string; type: DimensionType | null };
  let currIdx: number | null;

  export function showContextMenu(
    event: MouseEvent,
    idx: number | null,
    header: { title: string; type: DimensionType | null }
  ) {
    event.preventDefault();
    showMenu = true;

    const { clientX, clientY } = event;
    menuStyle = `left: ${clientX}px; top: ${clientY}px;`;
    currIdx = idx;
    currHeader = header;
  }

  export function hideContextMenu() {
    showMenu = false;
  }
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
      defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
      on:click={() =>
        changeColumnType(currIdx, currHeader.type === 'categorical' ? 'numerical' : 'categorical')}
      >Set as {currHeader.type === 'categorical' ? 'Numerical' : 'Categorical'}</DropdownItem
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
