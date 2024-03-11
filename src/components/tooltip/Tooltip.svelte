<script lang="ts">
  import { afterUpdate } from 'svelte';
  import type { TooltipType } from '../../util/types';

  export let data: TooltipType;
  export let maxWidth: number | null = null;

  let tooltipWidth: number;
  let tooltipHeight: number;
  let tooltipKey = ''; // Key to force re-render

  $: maxWidthString = maxWidth
    ? `max-width: ${maxWidth}px; overflow: hidden; text-overflow: ellipsis;`
    : '';

  $: {
    tooltipKey = data.text.join('') + (maxWidth ?? '');
  }

  afterUpdate(() => {
    if (data.visible && tooltipWidth) {
      // Check X overflow
      if (data.clientX + tooltipWidth > window.innerWidth)
        data.posX -= data.overflowOffsetX + tooltipWidth;
      // Check Y overflow
      if (data.clientY + 20 + tooltipHeight > window.innerHeight) data.posY -= tooltipHeight;
    }
  });
</script>

{#if data.visible}
  {#key tooltipKey}
    <div
      bind:clientWidth={tooltipWidth}
      bind:clientHeight={tooltipHeight}
      class="bg-gray-200 py-0.5 px-1 rounded-sm whitespace-nowrap z-10"
      style="font-size: 10px; position: absolute; top: {data.posY -
        8}px; left: {data.posX}px; {maxWidthString}"
    >
      {@html data.text.join('<br>')}
    </div>
  {/key}
{/if}
