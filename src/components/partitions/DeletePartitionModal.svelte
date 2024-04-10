<script lang="ts">
  import { Button, Modal } from 'flowbite-svelte';
  import { DEFAULT_PARTITION } from '../../util/util';

  export let isOpen: boolean;
  export let partitionName: string;
  export let deletePartition: (name: string) => void;
</script>

<Modal bind:open={isOpen} size="xs" autoclose>
  <div class="text-center">
    <h3 class="mb-5 text-lg font-normal text-gray-500">
      {partitionName === DEFAULT_PARTITION
        ? `You cannot delete '${DEFAULT_PARTITION}' partition.`
        : `Are you sure you want to delete partition '${partitionName}'?`}
    </h3>
    <Button
      disabled={partitionName === DEFAULT_PARTITION}
      color="red"
      class="me-2"
      on:click={() => deletePartition(partitionName)}>Delete</Button
    >
    <Button color="alternative">Cancel</Button>
  </div>
</Modal>
