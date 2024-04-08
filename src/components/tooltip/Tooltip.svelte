<script lang="ts">
  import type { TooltipType } from '../../util/types';

  export let data: TooltipType;
  export let maxWidth: number | null = null;
  export let color = 'bg-gray-100';

  let tooltipElement: HTMLDivElement;
  let tooltipStyle = `position: fixed; display: none;`;
  let tooltipKey = ''; // Key to force re-render

  $: {
    tooltipKey = data.text.join('') + (maxWidth ?? '');
  }

  $: {
    if (tooltipElement) {
      const { clientX, clientY } = data;
      let left = clientX;
      let top = clientY;

      if (clientX + tooltipElement.offsetWidth + 10 > window.innerWidth) left -= tooltipElement.offsetWidth + 10;
      else left += 10;

      if (clientY + tooltipElement.offsetHeight + 10 > window.innerHeight) top -= tooltipElement.offsetHeight;
      else top += 10;

      tooltipStyle = `position: fixed; top: ${top}px; left: ${left}px; font-size: 10px; ${
        maxWidth ? `max-width: ${maxWidth}px; overflow: hidden; text-overflow: ellipsis;` : ''
      }`;
    }
  }
</script>

{#if data.visible}
  {#key tooltipKey}
    <div bind:this={tooltipElement} class="{color} py-0.5 px-1 rounded-sm whitespace-nowrap z-10" style={tooltipStyle}>
      {@html data.text.join('<br>')}
    </div>
  {/key}
{/if}
