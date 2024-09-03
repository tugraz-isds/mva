<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Tooltip, Dropdown, DropdownItem, Input, Button } from 'flowbite-svelte';
  import {
    CheckOutline,
    EyeOutline,
    EyeSlashOutline,
    PaletteOutline,
    CirclePlusOutline,
    TrashBinOutline
  } from 'flowbite-svelte-icons';
  import DeletePartitionModal from './DeletePartitionModal.svelte';
  import ColorPickerModal from './ColorPickerModal.svelte';
  import { DEFAULT_PARTITION } from '../../util/util';
  import { partitionsDataStore, partitionsStore, selectedPartitionStore } from '../../stores/partitions';
  import { PARTITION_SHAPES, addRecordsToPartition, hidePartition, renamePartition, updatePartition } from './util';
  import { rgbaToHexString } from '../../util/colors';
  import { brushedArray, hoveredArray } from '../../stores/brushing';
  import type { PartitionShapeType, PartitionType } from './types';
  import type { RgbaColor } from 'svelte-awesome-color-picker';

  export let index: number;
  export let partitionName: string;
  export let partitions: Map<string, PartitionType>;
  export let partition: PartitionType;

  let isDeleteModalOpen = false;
  let isShapeDropdownOpen = false;
  let isColorPickerOpen = false;
  let colorPickerPosition = { x: 0, y: 0 };
  let isNameEditable = false;
  let partitionColorOld: RgbaColor;
  let partitionNameOld: string;
  let shapesDropdownElement: HTMLDivElement;

  let selectedPartition: string | null;
  const unsubscribeSelectedPartition = selectedPartitionStore.subscribe((value) => {
    selectedPartition = value;
  });

  function setShape(shape: PartitionShapeType) {
    if (shape === partition.shape) return;
    partition.shape = shape;
    isShapeDropdownOpen = false;
    updatePartition(partitionName, partition, partitions, partitionsStore);
  }

  function setColor(color: RgbaColor) {
    if (JSON.stringify(color) === JSON.stringify(partition.color)) return;
    partition.color = color;
    updatePartition(partitionName, partition, partitions, partitionsStore);
  }

  function showColorPicker(e: MouseEvent) {
    isColorPickerOpen = false;
    isColorPickerOpen = true;
    colorPickerPosition = {
      x: e.clientX,
      y: e.clientY
    };
    partitionColorOld = partition.color;
  }

  function handleFocus(e: FocusEvent) {
    if (!isNameEditable) (e.target as HTMLElement).blur();
  }

  function rename() {
    if (!isNameEditable) return;
    isNameEditable = false;
    renamePartition(
      partitionNameOld,
      partitionName,
      partitions,
      $partitionsDataStore,
      partitionsStore,
      partitionsDataStore
    );
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      partitionName = partitionNameOld;
      isNameEditable = false;
      (e.target as HTMLElement).blur();
    } else if (e.key === 'Enter') {
      rename();
      (e.target as HTMLElement).blur();
    }
  }

  function editName(e: MouseEvent) {
    if (partitionName === DEFAULT_PARTITION) return;
    isNameEditable = true;
    (e.target as HTMLElement).focus();
    partitionNameOld = partitionName;
  }

  function selectPartition(e: MouseEvent) {
    partitionNameOld = partitionName;
    if (e.target instanceof SVGElement) return;
    selectedPartitionStore.set(partitionName);
  }

  function getPartitionIcon(partition: PartitionType) {
    let iconString = PARTITION_SHAPES.get(partition.shape) ?? '';
    if (partition.shape.includes('hollow'))
      iconString = iconString.replace(
        '<svg',
        `<svg width="12" height="12" stroke="${rgbaToHexString(partition.color)}" fill="none"`
      );
    else
      iconString = iconString.replace(
        '<svg',
        `<svg width="12" height="12" stroke="#fff" fill="${rgbaToHexString(partition.color)}"`
      );

    return iconString;
  }

  onMount(() => {
    partitionNameOld = partitionName;
  });

  onDestroy(() => {
    unsubscribeSelectedPartition();
  });
</script>

<DeletePartitionModal isOpen={isDeleteModalOpen} {partitionName} />

<ColorPickerModal
  isOpen={isColorPickerOpen}
  position={colorPickerPosition}
  partitionColor={partition.color}
  {partitionColorOld}
  {setColor}
/>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:click={selectPartition}
  on:keydown={() => {}}
  class={`flex flex-row items-center mt-2 rounded-lg bg-gray-100 p-1 cursor-pointer text-xs ${
    selectedPartition === partitionNameOld ? 'border-4' : 'border-b-4'
  }`}
  style="border-color: {`rgba(${partition.color.r}, ${partition.color.g}, ${partition.color.b}, ${partition.color.a})`};"
>
  <div on:click={editName} on:keydown={() => {}} class="w-1/2">
    <Input
      bind:value={partitionName}
      on:blur={rename}
      on:focus={handleFocus}
      on:keydown={handleKeyDown}
      defaultClass="block w-full disabled:cursor-pointer rtl:text-right"
      class="rounded-lg p-1 {isNameEditable ? '' : 'opacity-50 select-none'}"
      style="background-color: {`rgba(${partition.color.r}, ${partition.color.g}, ${partition.color.b}, 0.1)`};"
    />
  </div>
  <div class="w-1/6 truncate mr-2 text-right">{partition.size}</div>
  <div class="w-1/3 flex flex-row items-center justify-evenly">
    <Button
      on:click={() => {
        isDeleteModalOpen = false;
        isDeleteModalOpen = true;
      }}
      class="text-grey-900 p-0 m-0 bg-inherit hover:bg-inherit focus:ring-transparent {partitionName ===
      DEFAULT_PARTITION
        ? 'invisible'
        : ''}"
    >
      <TrashBinOutline size="sm" />
    </Button>
    <Tooltip style="z-index: 1000;" type="light">Delete Partition</Tooltip>
    <Button
      on:click={() =>
        addRecordsToPartition(
          partitionName,
          partitions,
          $partitionsDataStore,
          $brushedArray,
          brushedArray,
          $hoveredArray,
          hoveredArray,
          partitionsStore,
          partitionsDataStore
        )}
      class="p-0 m-0 text-grey-900 bg-inherit hover:bg-inherit focus:ring-transparent"
    >
      <CirclePlusOutline size="sm" />
    </Button>
    <Tooltip style="z-index: 1000;" type="light">Add Selected Records</Tooltip>
    <div id="partition-shape-button-{index}" class="cursor-pointer">
      {@html getPartitionIcon(partition)}
    </div>
    <Tooltip style="z-index: 1000;" type="light">Partition Shape</Tooltip>
    <div bind:this={shapesDropdownElement}>
      <Dropdown
        triggeredBy="#partition-shape-button-{index}"
        ulClass="bg-white border border-gray-300 p-1 h-44"
        style="z-index: 1000;"
        placement={shapesDropdownElement?.getBoundingClientRect().bottom + 180 > window.innerHeight ? 'top' : 'bottom'}
        bind:open={isShapeDropdownOpen}
      >
        {#each [...PARTITION_SHAPES] as [name]}
          <DropdownItem
            on:click={() => setShape(name)}
            defaultClass="flex items-center font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
          >
            <CheckOutline
              size="xs"
              class="ms-2 mr-2"
              style="visibility: {partition.shape === name ? 'visible' : 'hidden'}"
            />
            {name[0].toUpperCase() + name.slice(1)}
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>
    <Button
      on:click={showColorPicker}
      class="p-0 m-0 bg-inherit hover:bg-inherit focus:ring-transparent"
      style="color: {rgbaToHexString(partition.color)};"
    >
      <PaletteOutline size="sm" />
    </Button>
    <Tooltip style="z-index: 1000;" type="light">Partition Color</Tooltip>
    {#if partition.visible}
      <Button
        on:click={() => hidePartition(partitionNameOld ?? partitionName, partitions, partitionsStore)}
        class="p-0 m-0 text-grey-900 bg-inherit hover:bg-inherit focus:ring-transparent"
      >
        <EyeOutline size="sm" />
      </Button>
      <Tooltip style="z-index: 1000;" type="light">Hide Records</Tooltip>
    {:else}
      <Button
        on:click={() => hidePartition(partitionNameOld ?? partitionName, partitions, partitionsStore)}
        class="p-0 m-0 text-grey-900 bg-inherit hover:bg-inherit focus:ring-transparent"
      >
        <EyeSlashOutline size="sm" />
      </Button>
      <Tooltip style="z-index: 1000;" type="light">Show Records</Tooltip>
    {/if}
  </div>
</div>
