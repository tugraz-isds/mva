<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import ColorPickerCustom from './ColorPickerCustom.svelte';
  import { PARTITION_COLORS } from './util';
  import { hexStringToRgba, rgbaToHexString } from '../../util/colors';
  import type { RgbaColor } from 'svelte-awesome-color-picker';
  import type { CoordinateType } from '../../util/types';

  export let isOpen: boolean;
  export let partitionColor: RgbaColor;
  export let position: CoordinateType;
  export let setColor: (color: RgbaColor) => void;

  let isCustomColorPickerOpen = false;
  let rgb: RgbaColor;
  let width: number, height: number;
  let isMounted = false;

  $: if (!isOpen) rgb = partitionColor;

  $: {
    if (isMounted && position.x + width + 10 > window.innerWidth) position.x = window.innerWidth - width - 10;
    if (isMounted && position.y + height + 10 > window.innerHeight) position.y = window.innerHeight - height - 10;
  }

  function setCustomColor(color: RgbaColor) {
    setColor(color);
    isOpen = false;
  }

  onMount(() => {
    isMounted = true;
  });
</script>

<ColorPickerCustom isOpen={isCustomColorPickerOpen} {position} {partitionColor} setColor={setCustomColor} />

<div
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="bg-white {isOpen ? 'fixed' : 'hidden'} border border-gray-400 rounded-lg"
  style="left: {position.x}px; top: {position.y}px; z-index: 3; p-4;"
>
  <div class="w-full grid grid-cols-6 gap-2 p-2">
    {#each PARTITION_COLORS as color}
      <div
        style="width: 20px; height: 20px; background-color: {color};"
        class="rounded-md border-black hover:border-solid hover:cursor-pointer {color === rgbaToHexString(rgb)
          ? 'border-4 border-solid'
          : 'border-2 border-none'}"
        on:click={() => (rgb = hexStringToRgba(color))}
        on:keydown={() => {}}
      />
    {/each}
  </div>
  <div class="mt-2 mb-8 flex items-center justify-center">
    <Button
      size="xs"
      color="light"
      on:click={() => {
        isCustomColorPickerOpen = false;
        isCustomColorPickerOpen = true;
      }}>Custom Color</Button
    >
  </div>
  <div class="my-2 flex items-center justify-center gap-x-4">
    <Button
      size="sm"
      on:click={() => {
        setColor(rgb);
        isOpen = false;
      }}>Apply</Button
    >
    <Button size="sm" color="red" on:click={() => (isOpen = false)}>Cancel</Button>
  </div>
</div>
