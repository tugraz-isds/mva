<script lang="ts">
  import { Button, Modal } from 'flowbite-svelte';
  import { partitionsDataStore, partitionsStore } from '../../stores/partitions';
  import { deletePartition } from './util';

  export let isOpen: boolean;
  export let partitionName: string;
</script>

<Modal bind:open={isOpen} size="xs" autoclose>
  <div class="text-center">
    <h3 class="mb-5 text-lg font-normal text-gray-500">
      Are you sure you want to delete partition '{partitionName}'?
    </h3>
    <Button
      color="red"
      class="me-2 focus:ring-transparent"
      on:click={() =>
        deletePartition(partitionName, $partitionsStore, $partitionsDataStore, partitionsStore, partitionsDataStore)}
      >Delete</Button
    >
    <Button color="alternative" class="focus:ring-transparent">Cancel</Button>
  </div>
</Modal>
