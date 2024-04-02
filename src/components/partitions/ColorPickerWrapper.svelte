<script lang="ts">
  import { portal } from 'svelte-portal';
  import { colorPickerPositionStore } from '../../stores/partitions';
  import { onDestroy } from 'svelte';

  export let wrapper;
  export let isOpen: boolean;
  export let isDialog: boolean;

  const COLOR_PICKER_WIDTH = 200;
  const COLOR_PICKER_HEIGHT = 200;

  let position: { x: number; y: number };
  let windowSize: { width: number; height: number };
  const unsubscribeColorPicker = colorPickerPositionStore.subscribe((value) => {
    position = value.position;
    windowSize = value.windowSize;

    console.log(position, windowSize);

    if (position.x + COLOR_PICKER_WIDTH + 10 > windowSize.width) {
      position.x = windowSize.width - COLOR_PICKER_WIDTH - 100;
    }

    if (position.y + COLOR_PICKER_HEIGHT + 10 > windowSize.height) {
      position.y = windowSize.height - COLOR_PICKER_HEIGHT - 100;
    }
  });

  onDestroy(() => {
    unsubscribeColorPicker();
  });
</script>

<div
  use:portal={'#color-picker-wrapper'}
  class="wrapper fixed p-2 bg-white border border-black rounded-lg {isOpen ? 'block' : 'hidden'}"
  style="top: {position.y}px; left: {position.x}px; z-index: 1000;"
  bind:this={wrapper}
>
  <slot />
</div>
