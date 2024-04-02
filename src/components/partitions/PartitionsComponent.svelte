<script lang="ts">
  import ColorPicker from 'svelte-awesome-color-picker';
  import { ButtonGroup, Input, Button } from 'flowbite-svelte';
  import { Trash, Plus, Eye } from 'svelte-heros-v2';
  import ColorPickerWrapper from './ColorPickerWrapper.svelte';
  import { colorPickerPositionStore } from '../../stores/partitions';

  let width: number;
  let height: number;

  function handleColorPickerOpen(event: MouseEvent) {
    colorPickerPositionStore.set({
      position: { x: event.clientX, y: event.clientY },
      windowSize: { width: window.innerWidth, height: window.innerHeight }
    });
  }
</script>

<div class="w-full h-full" bind:clientWidth={width} bind:clientHeight={height}>
  <ButtonGroup class="w-full" style="height: 25px;">
    <Input id="input-addon" type="email" size="sm" placeholder="New Partition" />
    <Button color="primary" size="sm">Add</Button>
  </ButtonGroup>

  <div class="w-full overflow-y-auto scrollable-div pb-2" style="height: {height - 25}px">
    <div
      class="flex flex-row items-center mt-2 rounded-lg bg-gray-100 border-b-4 p-1"
      style="border-color: red; font-size: 12px;"
    >
      <div class="w-1/2 truncate">Lorem Ipsum Dolor Sit Amet</div>
      <div class="w-1/6 truncate">1052</div>
      <div class="w-1/3 flex flex-row items-center justify-evenly">
        <Trash size="16" class="text-grey-900 cursor-pointer" />
        <Plus size="16" class="text-grey-900 cursor-pointer" />
        <Eye size="16" class="text-grey-900 cursor-pointer" />
        <div id="color-picker-wrapper" />
        <div on:click={handleColorPickerOpen} on:keydown={() => {}}>
          <ColorPicker
            label=""
            --input-size="16px"
            --picker-height="200px"
            --picker-width="200px"
            --picker-z-index="1000"
            components={{ wrapper: ColorPickerWrapper }}
          />
        </div>
      </div>
    </div>
  </div>
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
