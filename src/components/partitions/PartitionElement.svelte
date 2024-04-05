<script lang="ts">
  import ColorPicker, { type RgbaColor } from 'svelte-awesome-color-picker';
  import { Tooltip, Dropdown, DropdownItem, Modal, Button } from 'flowbite-svelte';
  import { Trash, Plus, Eye, Stop, Check } from 'svelte-heros-v2';
  import ColorPickerWrapper from './ColorPickerWrapper.svelte';
  import { colorPickerOpenedStore, colorPickerPositionStore } from '../../stores/partitions';
  import { onDestroy, onMount } from 'svelte';
  import { DEFAULT_PARTITION } from '../../util/util';
  import type { PartitionShapeType, PartitionType } from './types';

  export let partitionName: string;
  export let partition: PartitionType;
  export let addRecordsToPartition: (name: string) => void;
  export let updatePartition: (name: string, partition: PartitionType) => void;
  export let deletePartition: (name: string) => void;
  export let showTooltip: (e: MouseEvent, dim: string) => void;
  export let hideTooltip: () => void;

  let isMounted = false;
  let rgb: RgbaColor = { r: 65, b: 225, g: 105, a: 1 };
  let isDeleteModalOpen = false;
  let isShapeDropdownOpen = false;

  const unsubscribeColorPickerOpened = colorPickerOpenedStore.subscribe((value) => {
    if (value || !isMounted) return;
    setColor(rgb);
  });

  function handleColorPickerOpen(event: MouseEvent) {
    colorPickerPositionStore.set({
      position: { x: event.clientX, y: event.clientY },
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    });
  }

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

  onMount(() => {
    isMounted = true;
    setTimeout(() => {
      rgb = partition.color;
    }, 0);
  });

  onDestroy(() => {
    unsubscribeColorPickerOpened();
  });
</script>

<Modal bind:open={isDeleteModalOpen} size="xs" autoclose>
  <div class="text-center">
    <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
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

<div
  class="flex flex-row items-center mt-2 rounded-lg bg-gray-100 border-b-4 p-1"
  style="border-color: {`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${rgb.a})`}; font-size: 12px;"
>
  <div
    class="w-1/2 truncate rounded-lg p-1"
    style="background-color: {`rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`};"
    on:mouseenter={(e) => showTooltip(e, partitionName)}
    on:mouseleave={hideTooltip}
  >
    {partitionName}
  </div>
  <div class="w-1/6 truncate">{partition.size}</div>
  <div class="w-1/3 flex flex-row items-center justify-evenly">
    <Trash
      size="16"
      on:click={() => {
        isDeleteModalOpen = true;
      }}
      class="text-grey-900 cursor-pointer"
    />
    <Tooltip style="z-index: 1000;" type="light">Delete Partition</Tooltip>
    <Plus
      size="16"
      class="text-grey-900 cursor-pointer"
      on:click={() => addRecordsToPartition(partitionName)}
    />
    <Tooltip style="z-index: 1000;" type="light">Add Records</Tooltip>
    <Stop
      id="partition-shape-button-{partitionName.replace(' ', '')}"
      size="16"
      class="text-grey-900 cursor-pointer"
    />
    <Tooltip style="z-index: 1000;" type="light">Partition Shape</Tooltip>
    <Dropdown
      triggeredBy="#partition-shape-button-{partitionName.replace(' ', '')}"
      ulClass="bg-white border border-gray-300 p-1"
      style="z-index: 1000;"
      bind:open={isShapeDropdownOpen}
    >
      <DropdownItem
        on:click={() => setShape('circle')}
        defaultClass="flex items-center font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
        ><Check
          class="w-3 h-3 ms-2 mr-2"
          style="visibility: {partition.shape === 'circle' ? 'visible' : 'hidden'}"
        />Circle</DropdownItem
      >
      <DropdownItem
        on:click={() => setShape('triangle')}
        defaultClass="flex items-center font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
        ><Check
          class="w-3 h-3 ms-2 mr-2"
          style="visibility: {partition.shape === 'triangle' ? 'visible' : 'hidden'}"
        />Triangle</DropdownItem
      >
      <DropdownItem
        on:click={() => setShape('square')}
        defaultClass="flex items-center font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100"
        ><Check
          class="w-3 h-3 ms-2 mr-2"
          style="visibility: {partition.shape === 'square' ? 'visible' : 'hidden'}"
        />Square</DropdownItem
      >
    </Dropdown>
    <div id="color-picker-wrapper" />
    <div on:click={handleColorPickerOpen} on:keydown={() => {}}>
      <ColorPicker
        label=""
        --input-size="16px"
        --picker-height="200px"
        --picker-width="200px"
        bind:rgb
        components={{ wrapper: ColorPickerWrapper }}
      />
    </div>
    <Tooltip style="z-index: 1000;" type="light">Partition Color</Tooltip>
    <Eye size="16" class="text-grey-900 cursor-pointer" />
    <Tooltip style="z-index: 1000;" type="light">View Records</Tooltip>
  </div>
</div>
