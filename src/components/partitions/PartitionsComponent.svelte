<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { ButtonGroup, Input, Button, Helper } from 'flowbite-svelte';
  import PartitionElement from './PartitionElement.svelte';
  import { partitionsStore, partitionsDataStore } from '../../stores/partitions';
  import { isInteractableStore, brushedArray } from '../../stores/brushing';
  import Tooltip from '../tooltip/Tooltip.svelte';
  import { DEFAULT_PARTITION } from '../../util/util';
  import type { PartitionType } from './types';
  import type { TooltipType } from '../../util/types';

  let width: number;
  let height: number;

  let isBrowser = false;
  let validUpload = true;
  let partitionName: string = '';

  let tooltip: TooltipType = {
    visible: false,
    clientX: 0,
    clientY: 0,
    text: []
  };

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
    if (Array.from(partitions.keys()).includes(partitionName)) {
      validUpload = false;
      return;
    }

    partitions.set(partitionName, {
      size: 0,
      shape: 'circle',
      color: { r: 65, b: 225, g: 105, a: 1 }
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
    partitionsData.forEach((partition, i) => {
      if (partition === name) {
        defaultPartition.size++;
        partitionsData[i] = DEFAULT_PARTITION;
      }
    });
    partitions.set(DEFAULT_PARTITION, defaultPartition);
    partitions.delete(name);
    partitionsStore.set(partitions);
    partitionsDataStore.set(partitionsData);
  }

  function showTooltip(e: MouseEvent, dim: string) {
    if (!$isInteractableStore) return;
    tooltip = {
      visible: true,
      clientX: e.clientX,
      clientY: e.clientY,
      text: [dim]
    };
  }

  function hideTooltip() {
    tooltip = {
      visible: false,
      clientX: 0,
      clientY: 0,
      text: []
    };
  }

  onMount(() => {
    isBrowser = true;
  });

  onDestroy(() => {
    unsubscribePartitions();
    unsubscribePartitionsData();
  });
</script>

<Tooltip data={tooltip} color="bg-gray-300" />

<div class="w-full h-full" bind:clientWidth={width} bind:clientHeight={height}>
  <ButtonGroup class="w-full" style="height: 25px;">
    <Input
      id="input-addon"
      type="email"
      size="sm"
      placeholder="New Partition"
      bind:value={partitionName}
      on:focus={() => (validUpload = true)}
    />
    <Button color="primary" size="sm" on:click={addPartition}>Add</Button>
  </ButtonGroup>
  {#if !validUpload}
    <Helper color="red"
      ><span class="font-medium">Partition with this name already exists.</span></Helper
    >
  {/if}

  {#if partitions.size === 0}
    <div class="mt-4">No partitions.</div>
  {:else}
    <div class="w-full overflow-y-auto scrollable-div pb-2" style="height: {height - 25}px">
      {#each [...partitions] as [partitionName, partition]}
        <PartitionElement
          {partitionName}
          {partition}
          {addRecordsToPartition}
          {updatePartition}
          {deletePartition}
          {showTooltip}
          {hideTooltip}
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
