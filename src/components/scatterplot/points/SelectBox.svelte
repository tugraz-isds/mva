<script lang="ts">
  import type { CoordinateType } from '../../../util/types';

  export let visible: boolean = false;
  export let start: CoordinateType;
  export let end: CoordinateType;

  $: {
    if (divElement) {
      if (visible) divElement.style.display = 'block';
      else divElement.style.display = 'none';
    }
  }

  $: if (start && end && divElement) {
    divElement.style.left = Math.min(start.x, end.x) + 'px';
    divElement.style.top = Math.min(start.y, end.y) + 'px';
    divElement.style.width = Math.abs(end.x - start.x) + 'px';
    divElement.style.height = Math.abs(end.y - start.y) + 'px';
  }

  let divElement: HTMLDivElement;
</script>

<div bind:this={divElement} class="selectBox" />

<style>
  .selectBox {
    pointer-events: none;
    border: 1px solid #55aaff;
    background-color: rgba(75, 160, 255, 0.3);
    position: fixed;
    width: 100px;
    height: 100px;
  }
</style>
