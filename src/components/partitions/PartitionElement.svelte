<script lang="ts">
  import { Tooltip, Dropdown, DropdownItem, Input } from 'flowbite-svelte';
  import { Trash, PlusCircle, Eye, EyeSlash, Check } from 'svelte-heros-v2';
  import DeletePartitionModal from './DeletePartitionModal.svelte';
  import ColorPickerModal from './ColorPickerModal.svelte';
  import { palette_icon } from '../../util/icon-definitions';
  import { DEFAULT_PARTITION } from '../../util/util';
  import { partitionsDataStore, partitionsStore, selectedPartitionStore } from '../../stores/partitions';
  import { PARTITION_SHAPES, addRecordsToPartition, hidePartition, renamePartition, updatePartition } from './util';
  import { rgbaToHexString } from '../../util/colors';
  import { brushedArray } from '../../stores/brushing';
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
  let partitionNameOld: string;
  let shapesDropdownElement: HTMLDivElement;

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
  }

  function handleFocus(e: FocusEvent) {
    if (!isNameEditable) (e.target as HTMLElement).blur();
  }

  function handleBlur(e: FocusEvent) {
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

  function handleRenamePartition(e: MouseEvent) {
    if (partitionName === DEFAULT_PARTITION) return;
    isNameEditable = true;
    (e.target as HTMLElement).focus();
    partitionNameOld = partitionName;
  }

  function handleSelectPartition(e: MouseEvent) {
    partitionNameOld = partitionName;
    if (e.target instanceof SVGElement) return;
    $selectedPartitionStore = partitionName;
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
</script>

<DeletePartitionModal isOpen={isDeleteModalOpen} {partitionName} />

<ColorPickerModal
  isOpen={isColorPickerOpen}
  position={colorPickerPosition}
  partitionColor={partition.color}
  {setColor}
/>

<div
  on:click={handleSelectPartition}
  on:keydown={() => {}}
  class={`flex flex-row items-center mt-2 rounded-lg bg-gray-100 p-1 cursor-pointer ${
    $selectedPartitionStore === partitionNameOld ? 'border-4' : 'border-b-4'
  }`}
  style="border-color: {`rgba(${partition.color.r}, ${partition.color.g}, ${partition.color.b}, ${partition.color.a})`}; font-size: 12px;"
>
  <div on:click={handleRenamePartition} on:keydown={() => {}} class="w-1/2">
    <Input
      bind:value={partitionName}
      on:blur={handleBlur}
      on:focus={handleFocus}
      defaultClass="block w-full disabled:cursor-pointer rtl:text-right"
      class="rounded-lg p-1 {isNameEditable ? '' : 'opacity-50 select-none'}"
      style="background-color: {`rgba(${partition.color.r}, ${partition.color.g}, ${partition.color.b}, 0.1)`};"
    />
  </div>
  <div class="w-1/6 truncate mr-2 text-right">{partition.size}</div>
  <div class="w-1/3 flex flex-row items-center justify-evenly">
    <Trash
      size="16"
      on:click={() => {
        isDeleteModalOpen = false;
        isDeleteModalOpen = true;
      }}
      class="text-grey-900 cursor-pointer {partitionName === DEFAULT_PARTITION ? 'invisible' : ''}"
    />
    <Tooltip style="z-index: 1000;" type="light">Delete Partition</Tooltip>
    <PlusCircle
      size="20"
      class="text-grey-900 cursor-pointer"
      on:click={() =>
        addRecordsToPartition(
          partitionName,
          partitions,
          $partitionsDataStore,
          $brushedArray,
          partitionsStore,
          partitionsDataStore
        )}
    />
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
            ><Check
              class="w-3 h-3 ms-2 mr-2"
              style="visibility: {partition.shape === name ? 'visible' : 'hidden'}"
            />{name[0].toUpperCase() + name.slice(1)}</DropdownItem
          >
        {/each}
      </Dropdown>
    </div>
    <div on:click={showColorPicker} on:keydown={() => {}} class="cursor-pointer">
      {@html palette_icon.replace(
        '<svg',
        `<svg width="16" height="16" stroke="#fff" fill="${rgbaToHexString(partition.color)}"`
      )}
    </div>

    <Tooltip style="z-index: 1000;" type="light">Partition Color</Tooltip>
    {#if partition.visible}
      <Eye
        on:click={() => hidePartition(partitionNameOld ?? partitionName, partitions, partitionsStore)}
        size="16"
        class="text-grey-900 cursor-pointer"
      />
      <Tooltip style="z-index: 1000;" type="light">Hide Records</Tooltip>
    {:else}
      <EyeSlash
        on:click={() => hidePartition(partitionNameOld ?? partitionName, partitions, partitionsStore)}
        size="16"
        class="text-grey-900 cursor-pointer"
      />
      <Tooltip style="z-index: 1000;" type="light">Show Records</Tooltip>
    {/if}
  </div>
</div>
