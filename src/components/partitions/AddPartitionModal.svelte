<script lang="ts">
  import { Button, Modal, Input } from 'flowbite-svelte';
  import { brushedArray, isInteractableStore } from '../../stores/brushing';
  import { partitionsDataStore, partitionsStore, selectedPartitionStore } from '../../stores/partitions';
  import { addPartition, addRecordsToPartition, getPartitionName } from './util';

  export let isOpen: boolean;

  let partitionName = '';

  $: if (!isOpen) $isInteractableStore = true;

  function handleAddPartition() {
    partitionName = getPartitionName(partitionName, Array.from($partitionsStore.keys()));
    addPartition(partitionName, $partitionsStore, partitionsStore, selectedPartitionStore);
    addRecordsToPartition(
      partitionName,
      $partitionsStore,
      $partitionsDataStore,
      $brushedArray,
      partitionsStore,
      partitionsDataStore
    );
    partitionName = '';
    isOpen = false;
  }
</script>

<Modal bind:open={isOpen} size="xs" class="w-full">
  <form class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Add New Partition</h3>
    <div class="flex flex-row gap-x-2">
      <Input size="sm" placeholder="New Partition" bind:value={partitionName} />
      <Button color="primary" size="sm" on:click={handleAddPartition}>Add</Button>
    </div>
  </form>
</Modal>
