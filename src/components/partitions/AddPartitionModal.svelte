<script lang="ts">
  import { Button, Modal, Input } from 'flowbite-svelte';
  import { brushedArray, hoveredArray, isInteractableStore } from '../../stores/brushing';
  import { partitionsDataStore, partitionsStore, selectedPartitionStore } from '../../stores/partitions';
  import { addPartition, addRecordsToPartition, getPartitionName } from './util';

  export let isOpen: boolean;

  let partitionName = '';

  $: $isInteractableStore = !isOpen;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAddPartition();
  }

  function handleAddPartition() {
    partitionName = getPartitionName(partitionName, Array.from($partitionsStore.keys()));
    addPartition(partitionName, $partitionsStore, partitionsStore, selectedPartitionStore);
    setTimeout(() => {
      addRecordsToPartition(
        partitionName,
        $partitionsStore,
        $partitionsDataStore,
        $brushedArray,
        brushedArray,
        $hoveredArray,
        hoveredArray,
        partitionsStore,
        partitionsDataStore
      );
      partitionName = '';
      isOpen = false;
    }, 0);
  }
</script>

<Modal bind:open={isOpen} size="xs" class="w-full">
  <form class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Add New Partition</h3>
    <div class="flex flex-row gap-x-2">
      <Input size="sm" placeholder="New Partition" bind:value={partitionName} on:keydown={handleKeyDown} />
      <Button color="primary" size="sm" on:click={handleAddPartition} class="focus:ring-transparent">Add</Button>
    </div>
  </form>
</Modal>
