<script lang="ts">
  import { ChevronRight, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import { partitionsDataStore, partitionsStore, selectedPartitionStore } from '../../stores/partitions';
  import { brushedArray, isInteractableStore } from '../../stores/brushing';
  import type { PartitionType } from './types';
  import { onDestroy } from 'svelte';
  import AddPartitionModal from './AddPartitionModal.svelte';

  let contextMenuElement: HTMLElement;
  let showMenu = false;
  let isAddPartitionModalOpen = false;
  let debounceTimeout: number;
  let menuStyle = '';
  let submenuStyle = '';
  let pos: { x: number; y: number };

  $: {
    if (contextMenuElement) {
      if (pos.x + contextMenuElement.offsetWidth + 10 > window.innerWidth)
        pos.x = window.innerWidth - contextMenuElement.offsetWidth - 10;
      if (pos.y + contextMenuElement.offsetHeight + 10 > window.innerHeight)
        pos.y = window.innerHeight - contextMenuElement.offsetHeight - 10;
      menuStyle = `left: ${pos.x}px; top: ${pos.y}px; z-index: 1000;`;

      if (pos.x + contextMenuElement.offsetWidth + 170 > window.innerWidth) submenuStyle = 'left-start';
      else submenuStyle = 'right-start';
    }
  }

  let partitions: Map<string, PartitionType> = new Map();
  const unsubscribePartitions = partitionsStore.subscribe((value) => {
    partitions = value;
  });

  let partitionsData: string[] = [];
  const unsubscribePartitionsData = partitionsDataStore.subscribe((value) => {
    partitionsData = value;
  });

  function addRecordsToPartition(newPartitionName: string) {
    $brushedArray.forEach((i) => {
      const oldPartition = partitions.get(partitionsData[i]);
      const newPartition = partitions.get(newPartitionName);
      if (!oldPartition || !newPartition || partitionsData[i] === newPartitionName) return;
      oldPartition.size--;
      partitions.set(partitionsData[i], oldPartition);
      partitionsData[i] = newPartitionName;
      newPartition.size++;
      partitions.set(partitionsData[i], newPartition);
    });
    partitionsDataStore.set(partitionsData);
    partitionsStore.set(partitions);
    hideContextMenu();
  }

  export function showContextMenu(event: MouseEvent) {
    event.preventDefault();
    showMenu = true;

    pos = { x: event.clientX, y: event.clientY };
    menuStyle = `left: ${pos.x}px; top: ${pos.y}px; z-index: 1000;`;
  }

  export function hideContextMenu() {
    showMenu = false;
  }

  function handleMouseLeave() {
    debounceTimeout = setTimeout(() => {
      hideContextMenu();
    }, 100);
  }

  function handleMouseEnter() {
    clearTimeout(debounceTimeout);
  }

  onDestroy(() => {
    unsubscribePartitions();
    unsubscribePartitionsData();
  });
</script>

<AddPartitionModal isOpen={isAddPartitionModalOpen} />

{#if showMenu}
  <div
    bind:this={contextMenuElement}
    class="context-menu fixed bg-white border border-gray-300 p-1 w-44"
    style={menuStyle}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
  >
    {#if $selectedPartitionStore !== null}
      <DropdownItem
        on:click={() => addRecordsToPartition($selectedPartitionStore)}
        defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
        >Add Selected to Partition '{$selectedPartitionStore}'</DropdownItem
      >
    {/if}
    <DropdownItem defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100 flex items-center justify-between"
      >Add Selected to Partition<ChevronRight class="w-3 h-3 ms-2" /></DropdownItem
    >
    <Dropdown class="p-1 w-40 max-h-36 overflow-y-auto overflow-x-hidden" placement={submenuStyle}>
      {#each [...partitions] as [key, value]}
        <DropdownItem
          defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
          on:click={() => addRecordsToPartition(key)}>{key}</DropdownItem
        >
      {/each}
    </Dropdown>
    <DropdownDivider />
    <DropdownItem
      defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
      on:click={() => {
        isAddPartitionModalOpen = false;
        isAddPartitionModalOpen = true;
        isInteractableStore.set(false);
        hideContextMenu();
      }}>Add to New Partition...</DropdownItem
    >
  </div>
{/if}
