<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import ColorPicker, { type RgbaColor } from 'svelte-awesome-color-picker';

  export let isOpen: boolean;
  export let partitionColor: RgbaColor;
  export let position: { x: number; y: number };
  export let setColor: (color: RgbaColor) => void;

  let rgb: RgbaColor;
  let width: number, height: number;
  let isMounted = false;

  $: if (!isOpen) rgb = partitionColor;

  $: {
    if (isMounted && position.x + width + 10 > window.innerWidth) position.x = window.innerWidth - width - 10;
    if (isMounted && position.y + height + 10 > window.innerHeight) position.y = window.innerHeight - height - 10;
  }

  onMount(() => {
    isMounted = true;
  });
</script>

<div
  bind:clientWidth={width}
  bind:clientHeight={height}
  class="bg-white {isOpen ? 'fixed' : 'hidden'} border border-gray-400 rounded-lg"
  style="left: {position.x}px; top: {position.y}px; z-index: 4; p-4;"
>
  <div>
    <ColorPicker
      label=""
      --input-size="16px"
      --picker-height="200px"
      --picker-width="200px"
      --cp-border-color="white"
      --cp-input-color="#9ca3af"
      bind:rgb
      isDialog={false}
    />
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
