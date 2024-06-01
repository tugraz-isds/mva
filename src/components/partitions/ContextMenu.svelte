<script lang="ts">
  import { onDestroy } from 'svelte';
  import { ChevronRight, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import { partitionsDataStore, partitionsStore, selectedPartitionStore } from '../../stores/partitions';
  import { brushedArray, hoveredArray, isInteractableStore } from '../../stores/brushing';
  import AddPartitionModal from './AddPartitionModal.svelte';
  import { addRecordsToPartition } from './util';
  import type { PartitionType } from './types';
  import type { CoordinateType } from '../../util/types';

  let contextMenuElement: HTMLElement;
  let showMenu = false;
  let isAddPartitionModalOpen = false;
  let debounceTimeout: number;
  let menuStyle = '';
  let submenuStyle = '';
  let pos: CoordinateType;

  $: isInteractableStore.set(!showMenu);

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

  function addRecords(newPartitionName: string) {
    addRecordsToPartition(
      newPartitionName,
      $partitionsStore,
      $partitionsDataStore,
      $brushedArray,
      brushedArray,
      $hoveredArray,
      hoveredArray,
      partitionsStore,
      partitionsDataStore
    );
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
        on:click={() => addRecords($selectedPartitionStore)}
        defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100">Add to Selected Partition</DropdownItem
      >
    {/if}
    <DropdownItem defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100 flex items-center justify-between"
      >Add to Partition<ChevronRight class="w-3 h-3 ms-2" /></DropdownItem
    >
    <Dropdown class="p-1 w-40 max-h-36 overflow-y-auto overflow-x-hidden" placement={submenuStyle}>
      {#each [...partitions] as [key, value]}
        <DropdownItem
          defaultClass="font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
          on:click={() => addRecords(key)}>{key}</DropdownItem
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
