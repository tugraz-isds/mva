<script lang="ts">
  import { DropdownItem } from 'flowbite-svelte';
  import { partitionsDataStore, partitionsStore, selectedPartitionStore } from '../../stores/partitions';
  import { brushedArray } from '../../stores/brushing';
  import type { PartitionType } from './types';
  import { onDestroy } from 'svelte';

  let contextMenuElement: HTMLElement;
  let showMenu = false;
  let menuStyle = '';
  let pos: { x: number; y: number };

  $: {
    if (contextMenuElement) {
      if (pos.x + contextMenuElement.offsetWidth + 10 > window.innerWidth)
        pos.x = window.innerWidth - contextMenuElement.offsetWidth - 10;
      if (pos.y + contextMenuElement.offsetHeight + 10 > window.innerHeight)
        pos.y = window.innerHeight - contextMenuElement.offsetHeight - 10;
      menuStyle = `left: ${pos.x}px; top: ${pos.y}px; z-index: 1000;`;
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

  function addRecordsToPartition() {
    const newPartitionName = $selectedPartitionStore;
    if (newPartitionName === null) return;
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

  onDestroy(() => {
    unsubscribePartitions();
    unsubscribePartitionsData();
  });
</script>

{#if showMenu}
  <div
    bind:this={contextMenuElement}
    class="context-menu fixed bg-white border border-gray-300 p-1 w-40"
    style={menuStyle}
    on:click={hideContextMenu}
    on:mouseleave={hideContextMenu}
    on:keydown={hideContextMenu}
  >
    <DropdownItem
      on:click={addRecordsToPartition}
      defaultClass={`font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100 ${
        $selectedPartitionStore === null ? 'text-gray-400 cursor-not-allowed' : ''
      }`}>Add Brushed to Partition</DropdownItem
    >
  </div>
{/if}
