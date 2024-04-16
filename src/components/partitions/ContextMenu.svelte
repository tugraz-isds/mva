<script lang="ts">
  import { DropdownItem } from 'flowbite-svelte';

  let showMenu = false;
  let menuStyle = '';

  export function showContextMenu(event: MouseEvent) {
    event.preventDefault();
    showMenu = true;

    const { clientX, clientY } = event;
    menuStyle = `left: ${clientX}px; top: ${clientY}px; z-index: 3;`;
  }

  export function hideContextMenu() {
    showMenu = false;
  }
</script>

{#if showMenu}
  <div
    class="context-menu fixed bg-white border border-gray-300 p-1 w-38"
    style={menuStyle}
    on:click={hideContextMenu}
    on:mouseleave={hideContextMenu}
    on:keydown={hideContextMenu}
  >
    <DropdownItem defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
      >Add to Selected Partition</DropdownItem
    >
  </div>
{/if}
