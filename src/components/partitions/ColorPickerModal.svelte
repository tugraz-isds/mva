<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from 'flowbite-svelte';
  import { TrashBinOutline } from 'flowbite-svelte-icons';
  import ColorPickerCustom from './ColorPickerCustom.svelte';
  import { PARTITION_COLORS } from './util';
  import { partitionsStore } from '../../stores/partitions';
  import { hexStringToRgba, rgbaToHexString } from '../../util/colors';
  import type { RgbaColor } from 'svelte-awesome-color-picker';
  import type { CoordinateType } from '../../util/types';

  export let isOpen: boolean;
  export let partitionColor: RgbaColor;
  export let partitionColorOld: RgbaColor;
  export let position: CoordinateType;
  export let setColor: (color: RgbaColor) => void;

  let isCustomColorPickerOpen = false;
  let rgb: RgbaColor;
  let width: number, height: number;
  let isMounted = false;

  let customColors: string[] = [];
  let selectedCustomIndex: number | null = null;

  $: if (!isOpen) rgb = partitionColor;

  $: {
    if (isMounted && position.x + width + 10 > window.innerWidth) {
      position.x = window.innerWidth - width - 10;
    }
    if (isMounted && position.y + height + 10 > window.innerHeight) {
      position.y = window.innerHeight - height - 10;
    }
  }

  let usedColors: string[];
  partitionsStore.subscribe((value) => {
    usedColors = [];
    value.forEach((data) => {
      usedColors.push(rgbaToHexString(data.color));
    });
  });

  function addCustomColor(color: RgbaColor) {
    rgb = color;
    setColor(rgb);
    customColors = [...customColors, rgbaToHexString(color)];
    selectedCustomIndex = customColors.length;
    localStorage.setItem('partitionsCustomColors', JSON.stringify(customColors));
  }

  function deleteCustomColor(i: number | null) {
    if (i === null) return;
    customColors = [...customColors.slice(0, i), ...customColors.slice(i + 1)];
    localStorage.setItem('partitionsCustomColors', JSON.stringify(customColors));
    const defaultColor = hexStringToRgba(PARTITION_COLORS[0]);
    setColor(defaultColor);
    rgb = defaultColor;
    partitionColorOld = defaultColor;
    selectedCustomIndex = null;
  }

  onMount(() => {
    isMounted = true;

    const customColorsStorage = localStorage.getItem('partitionsCustomColors');
    if (customColorsStorage) customColors = JSON.parse(customColorsStorage);
  });
</script>

<ColorPickerCustom isOpen={isCustomColorPickerOpen} {position} {partitionColor} {addCustomColor} />

<div
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="bg-white {isOpen ? 'fixed' : 'hidden'} border border-gray-400 rounded-lg"
  style="left: {position.x}px; top: {position.y}px; z-index: 3; p-4;"
>
  <div class="w-full grid grid-cols-6 gap-2 p-2">
    {#each PARTITION_COLORS as color}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        style="background-color: {color};"
        class="w-5 h-5 rounded-md border border-black hover:cursor-pointer hover:border-2 {color ===
        rgbaToHexString(rgb)
          ? 'border-4 hover:border-4'
          : ''}"
        on:click={() => {
          rgb = hexStringToRgba(color);
          setColor(rgb);
          selectedCustomIndex = null;
        }}
        on:keydown={() => {}}
      />
    {/each}
  </div>
  <hr class="h-0.5 border-t-0 bg-neutral-100" />
  <div class="mb-8 flex flex-col items-center justify-center">
    {#if customColors.length > 0}
      <p class="text-sm mt-2">Custom Colors:</p>
      <div class="w-full grid grid-cols-6 gap-2 p-2">
        {#each customColors as color, i}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div
            style="background-color: {color};"
            class="w-5 h-5 rounded-md border border-black hover:cursor-pointer hover:border-2 {color ===
            rgbaToHexString(rgb)
              ? 'border-4 hover:border-4'
              : ''}"
            on:click={() => {
              rgb = hexStringToRgba(color);
              setColor(rgb);
              selectedCustomIndex = i;
            }}
            on:keydown={() => {}}
          />
        {/each}
      </div>
    {/if}
    <div class="flex flex-row mt-2 gap-x-2 mx-2">
      <Button
        size="xs"
        color="light"
        on:click={() => {
          isCustomColorPickerOpen = false;
          isCustomColorPickerOpen = true;
        }}
        class="focus:ring-transparent">Add Custom Color</Button
      >
      <Button
        size="xs"
        color="red"
        disabled={selectedCustomIndex === null}
        on:click={() => deleteCustomColor(selectedCustomIndex)}
        class="focus:ring-transparent"><TrashBinOutline /></Button
      >
    </div>
  </div>
  <div class="my-2 flex items-center justify-center gap-x-2">
    <Button
      size="sm"
      on:click={() => {
        isOpen = false;
      }}
      class="focus:ring-transparent">OK</Button
    >
    <Button
      size="sm"
      color="red"
      on:click={() => {
        setColor(partitionColorOld);
        isOpen = false;
      }}
      class="focus:ring-transparent">Cancel</Button
    >
  </div>
</div>
