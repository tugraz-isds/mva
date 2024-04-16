<script lang="ts">
  import { Tooltip, Dropdown, DropdownItem, Input } from 'flowbite-svelte';
  import { Trash, Plus, Eye, Check } from 'svelte-heros-v2';
  import DeletePartitionModal from './DeletePartitionModal.svelte';
  import ColorPickerModal from './ColorPickerModal.svelte';
  import {
    palette_icon,
    shape_circle_icon,
    shape_square_icon,
    shape_triangle_icon,
    shape_circle_hollow_icon,
    shape_square_hollow_icon,
    shape_triangle_hollow_icon
  } from '../../util/icon-definitions';
  import { rgbaToHexString } from '../../util/colors';
  import type { PartitionShapeType, PartitionType } from './types';
  import type { RgbaColor } from 'svelte-awesome-color-picker';
  import { DEFAULT_PARTITION } from '../../util/util';
  import { selectedPartitionStore } from '../../stores/partitions';

  export let index: number;
  export let partitionName: string;
  export let partitions: Map<string, PartitionType>;
  export let partition: PartitionType;
  export let addRecordsToPartition: (name: string) => void;
  export let updatePartition: (name: string, partition: PartitionType) => void;
  export let deletePartition: (name: string) => void;
  export let renamePartition: (oldName: string, newName: string, error?: string) => void;

  const SHAPES: Map<PartitionShapeType, string> = new Map([
    ['circle', shape_circle_icon],
    ['triangle', shape_triangle_icon],
    ['square', shape_square_icon],
    ['circle hollow', shape_circle_hollow_icon],
    ['triangle hollow', shape_triangle_hollow_icon],
    ['square hollow', shape_square_hollow_icon]
  ]);

  let isDeleteModalOpen = false;
  let isShapeDropdownOpen = false;
  let isColorPickerOpen = false;
  let colorPickerPosition = { x: 0, y: 0 };
  let isNameEditable = false;
  let partitionNameOld: string;

  function setShape(shape: PartitionShapeType) {
    if (shape === partition.shape) return;
    partition.shape = shape;
    isShapeDropdownOpen = false;
    updatePartition(partitionName, partition);
  }

  function setColor(color: RgbaColor) {
    if (JSON.stringify(color) === JSON.stringify(partition.color)) return;
    partition.color = color;
    updatePartition(partitionName, partition);
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
    let errorMessage: string | undefined;
    if (partitionName.length === 0) errorMessage = 'Cannot add partition with empty name.';
    if (Array.from(partitions.keys()).includes(partitionName))
      errorMessage = 'Partition with this name already exists.';
    setTimeout(() => {
      renamePartition(partitionNameOld, partitionName, errorMessage);
      if (errorMessage) partitionName = partitionNameOld;
    }, 100);
  }

  function handleDoubleClick(e: MouseEvent) {
    if (partitionName === DEFAULT_PARTITION) return;
    isNameEditable = true;
    (e.target as HTMLElement).focus();
    partitionNameOld = partitionName;
  }

  function handleClick(e: MouseEvent) {
    partitionNameOld = partitionName;
    $selectedPartitionStore = partitionName;
  }
</script>

<DeletePartitionModal isOpen={isDeleteModalOpen} {partitionName} {deletePartition} />

<ColorPickerModal
  isOpen={isColorPickerOpen}
  position={colorPickerPosition}
  partitionColor={partition.color}
  {setColor}
/>

<div
  on:click={handleClick}
  on:keydown={() => {}}
  class={`partition-element flex flex-row items-center mt-2 rounded-lg bg-gray-100 p-1 cursor-pointer ${
    $selectedPartitionStore === partitionNameOld ? 'border-4' : 'border-b-4'
  }`}
  style="border-color: {`rgba(${partition.color.r}, ${partition.color.g}, ${partition.color.b}, ${partition.color.a})`}; font-size: 12px;"
>
  <div on:dblclick={handleDoubleClick} class="w-1/2">
    <Input
      bind:value={partitionName}
      on:blur={handleBlur}
      on:focus={handleFocus}
      defaultClass="block w-full disabled:cursor-pointer rtl:text-right"
      class="rounded-lg p-1 {isNameEditable ? '' : 'opacity-50 select-none'}"
      style="background-color: {`rgba(${partition.color.r}, ${partition.color.g}, ${partition.color.b}, 0.1)`};"
    />
  </div>
  <div class="w-1/6 truncate ml-1">{partition.size}</div>
  <div class="w-1/3 flex flex-row items-center justify-evenly">
    <Trash
      size="16"
      on:click={() => {
        isDeleteModalOpen = false;
        isDeleteModalOpen = true;
      }}
      class="text-grey-900 cursor-pointer"
    />
    <Tooltip style="z-index: 1000;" type="light">Delete Partition</Tooltip>
    <Plus size="16" class="text-grey-900 cursor-pointer" on:click={() => addRecordsToPartition(partitionName)} />
    <Tooltip style="z-index: 1000;" type="light">Add Records</Tooltip>
    <div id="partition-shape-button-{index}" class="cursor-pointer">
      {@html SHAPES.get(partition.shape)?.replace('<svg', '<svg width="12" height="12" stroke="#fff" fill="#111827"')}
    </div>
    <Tooltip style="z-index: 1000;" type="light">Partition Shape</Tooltip>
    <Dropdown
      triggeredBy="#partition-shape-button-{index}"
      ulClass="bg-white border border-gray-300 p-1"
      style="z-index: 1000;"
      bind:open={isShapeDropdownOpen}
    >
      {#each [...SHAPES] as [name]}
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
    <div on:click={showColorPicker} on:keydown={() => {}} class="cursor-pointer">
      {@html palette_icon.replace(
        '<svg',
        `<svg width="16" height="16" stroke="#fff" fill="${rgbaToHexString(partition.color)}"`
      )}
    </div>

    <Tooltip style="z-index: 1000;" type="light">Partition Color</Tooltip>
    <Eye size="16" class="text-grey-900 cursor-pointer" />
    <Tooltip style="z-index: 1000;" type="light">View Records</Tooltip>
  </div>
</div>
