<script lang="ts">
  import { Checkbox } from 'flowbite-svelte';
  import { showSplomOverviewStore } from '../../stores/splom';
</script>

<div class="flex justify-center items-center">
  <span class="text-xs mr-1 text-nowrap text-ellipsis overflow-hidden">Show overview:</span>
  <Checkbox bind:checked={$showSplomOverviewStore} class="p-1 w-2.5 h-2.5" />
</div>
