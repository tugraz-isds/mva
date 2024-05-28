<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { ButtonGroup, Input, Button } from 'flowbite-svelte';
  import PartitionElement from './PartitionElement.svelte';
  import { partitionsStore, partitionsDataStore, selectedPartitionStore } from '../../stores/partitions';
  import { addPartition, getPartitionName } from './util';
  import type { PartitionType } from './types';

  let width: number;
  let height: number;

  let isBrowser = false;
  let partitionName = '';

  let partitions: Map<string, PartitionType> = new Map();
  const unsubscribePartitions = partitionsStore.subscribe((value) => {
    partitions = value;
    if (isBrowser) localStorage.setItem('partitions', JSON.stringify(Array.from(partitions.entries())));
  });

  let partitionsData: string[] = [];
  const unsubscribePartitionsData = partitionsDataStore.subscribe((value) => {
    partitionsData = value;
    if (isBrowser) localStorage.setItem('partitionsData', JSON.stringify(partitionsData));
  });

  function handleKeyUp(e: KeyboardEvent) {
    if (e.key === 'Enter') handleAddPartition();
  }

  function handleAddPartition() {
    partitionName = getPartitionName(partitionName, Array.from(partitions.keys()));
    addPartition(partitionName, partitions, partitionsStore, selectedPartitionStore);
    partitionName = '';
  }

  function handleClick(e: MouseEvent) {
    if (!(e.target instanceof HTMLElement) || !e.target.className?.includes('partitions-component')) return;
    $selectedPartitionStore = null;
  }

  onMount(() => {
    isBrowser = true;
  });

  onDestroy(() => {
    unsubscribePartitions();
    unsubscribePartitionsData();
  });
</script>

<div
  class="partitions-component w-full h-full"
  bind:clientWidth={width}
  bind:clientHeight={height}
  on:click={handleClick}
  on:keydown={() => {}}
>
  <ButtonGroup class="w-full" style="height: 25px;">
    <Input
      class="partitions-component"
      size="sm"
      placeholder="New Partition"
      bind:value={partitionName}
      on:keyup={handleKeyUp}
    />
    <Button color="primary" size="sm" on:click={handleAddPartition}>Add</Button>
  </ButtonGroup>

  {#if partitions.size === 0}
    <div class="mt-4">No partitions.</div>
  {:else}
    <div
      class="partitions-component w-full overflow-y-auto scrollable-div pb-2"
      style="height: {height - 25}px"
      on:keydown={() => {}}
    >
      {#each [...partitions] as [partitionName, partition], index}
        <PartitionElement {index} {partitionName} {partitions} {partition} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .scrollable-div {
    scrollbar-width: thin;
    overflow-x: auto !important;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 12px;
  }
</style>
