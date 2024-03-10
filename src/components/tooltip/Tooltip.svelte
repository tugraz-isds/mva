<script lang="ts">
  import type { TooltipType } from '../../util/types';

  export let data: TooltipType;
  export let maxWidth: number | null = null;

  let tooltipWidth: number;
  let leftPosition: number;

  $: maxWidthString = maxWidth
    ? `max-width: ${maxWidth}px; overflow: hidden; text-overflow: ellipsis;`
    : '';

  $: leftPosition = data.posX - 12; // Initial left position

  $: {
    if (data.visible && tooltipWidth) {
      // Check if the tooltip overflows the window width
      if (data.clientX + 12 + tooltipWidth > window.innerWidth) {
        // Calculate the overflow amount
        const overflowAmount = data.clientX + 12 + tooltipWidth - window.innerWidth;
        // Adjust the left position to prevent overflow
        leftPosition = data.posX - 30 - tooltipWidth;
        console.log('overflows', overflowAmount);
      } else {
        // No adjustment needed if it doesn't overflow
        leftPosition = data.posX - 12;
        console.log('NOT overflows');
      }
    }
  }
</script>

{#if data.visible}
  <div
    bind:clientWidth={tooltipWidth}
    class="bg-gray-200 py-0.5 px-1 rounded-sm whitespace-nowrap z-10"
    style="font-size: 10px; position: absolute; top: {data.posY -
      8}px; left: {leftPosition}px; {maxWidthString}"
  >
    {@html data.text.join('<br>')}
  </div>
{/if}
