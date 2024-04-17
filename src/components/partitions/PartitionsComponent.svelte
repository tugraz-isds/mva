<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { ButtonGroup, Input, Button, Helper } from 'flowbite-svelte';
  import PartitionElement from './PartitionElement.svelte';
  import { partitionsStore, partitionsDataStore, selectedPartitionStore } from '../../stores/partitions';
  import { brushedArray } from '../../stores/brushing';
  import { DEFAULT_PARTITION } from '../../util/util';
  import type { PartitionType } from './types';

  let width: number;
  let height: number;

  let isBrowser = false;
  let validUpload = true;
  let errorMessage = '';
  let partitionName = '';

  let partitions: Map<string, PartitionType> = new Map();
  const unsubscribePartitions = partitionsStore.subscribe((value) => {
    partitions = value;
    if (isBrowser) {
      localStorage.setItem('partitions', JSON.stringify(Array.from(partitions.entries())));
    }
  });

  let partitionsData: string[] = [];
  const unsubscribePartitionsData = partitionsDataStore.subscribe((value) => {
    partitionsData = value;
    if (isBrowser) {
      localStorage.setItem('partitionsData', JSON.stringify(partitionsData));
    }
  });

  function addRecordsToPartition(name: string) {
    $brushedArray.forEach((i) => {
      const oldPartition = partitions.get(partitionsData[i]);
      const newPartition = partitions.get(name);
      if (!oldPartition || !newPartition || partitionsData[i] === name) return;
      oldPartition.size--;
      partitions.set(partitionsData[i], oldPartition);
      partitionsData[i] = name;
      newPartition.size++;
      partitions.set(partitionsData[i], newPartition);
    });
    partitionsDataStore.set(partitionsData);
    partitionsStore.set(partitions);
  }

  function addPartition() {
    if (partitionName.length === 0) {
      validUpload = false;
      errorMessage = 'Cannot add partition with empty name.';
      return;
    }
    if (Array.from(partitions.keys()).includes(partitionName)) {
      validUpload = false;
      errorMessage = 'Partition with this name already exists.';
      return;
    }

    partitions.set(partitionName, {
      size: 0,
      shape: 'circle',
      color: { r: 65, b: 225, g: 105, a: 1 },
      visible: true
    });
    partitionsStore.set(partitions);
    partitionName = '';
  }

  function updatePartition(name: string, partition: PartitionType) {
    partitions.set(name, partition);
    partitionsStore.set(partitions);
  }

  function deletePartition(name: string) {
    const defaultPartition = partitions.get(DEFAULT_PARTITION);
    if (!defaultPartition) return;
    let changedRecords = 0;
    partitionsData.forEach((partition, i) => {
      if (partition === name) {
        defaultPartition.size++;
        changedRecords++;
        partitionsData[i] = DEFAULT_PARTITION;
      }
    });
    partitions.set(DEFAULT_PARTITION, defaultPartition);
    partitions.delete(name);
    partitionsStore.set(partitions);
    if (changedRecords > 0) partitionsDataStore.set(partitionsData);
  }

  function renamePartition(oldName: string, newName: string, error?: string) {
    if (oldName === newName || !partitions.has(oldName)) return;
    if (error) {
      validUpload = false;
      errorMessage = error;
      return;
    }

    const partitionsUpdated = new Map(
      Array.from(partitions.entries()).map((record) => (record[0] === oldName ? [newName, record[1]] : record))
    );
    partitions = new Map(partitionsUpdated);
    partitionsData = partitionsData.map((record) => (record = record === oldName ? newName : record));
    partitionsStore.set(partitions);
    partitionsDataStore.set(partitionsData);
  }

  function hidePartition(name: string) {
    const partition = partitions.get(name);
    if (!partition) return;
    partition.visible = !partition.visible;
    partitions.set(name, partition);
    partitionsStore.set(partitions);
  }

  function handleClick(e: MouseEvent) {
    if (!(e.target instanceof HTMLElement) || e.target.className?.includes('partitions-component')) return;
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
      id="input-addon"
      class="partitions-component"
      type="email"
      size="sm"
      placeholder="New Partition"
      bind:value={partitionName}
      on:focus={() => (validUpload = true)}
    />
    <Button color="primary" size="sm" on:click={addPartition}>Add</Button>
  </ButtonGroup>

  {#if partitions.size === 0}
    <div class="mt-4">No partitions.</div>
  {:else}
    <div
      class="partitions-component w-full overflow-y-auto scrollable-div pb-2"
      style="height: {height - 25}px"
      on:click={() => (validUpload = true)}
      on:keydown={() => {}}
    >
      {#if !validUpload}
        <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
      {/if}
      {#each [...partitions] as [partitionName, partition], index}
        <PartitionElement
          {index}
          {partitionName}
          {partitions}
          {partition}
          {addRecordsToPartition}
          {updatePartition}
          {deletePartition}
          {renamePartition}
          {hidePartition}
        />
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
