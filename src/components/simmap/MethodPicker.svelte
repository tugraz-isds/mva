<script lang="ts">
  import { Select, Tooltip } from 'flowbite-svelte';
  import { simmapMethodStore } from '../../stores/simmap';

  const SIMMAP_METHODS = [
    { value: 'PCA', name: 'PCA' },
    { value: 'UMAP', name: 'UMAP' }
  ];
</script>

<div class="flex flex-row justify-end w-24">
  <div class="flex flex-row justify-end w-full">
    <span class="mr-1 text-xs">Method:</span>
    <Select
      class="w-20 h-full text-xs rounded m-0 flex items-center justify-center overflow-hidden leading-4 z-10 text-ellipsis p-0 pl-2"
      style="padding-right: 1.5rem !important;"
      size="sm"
      items={SIMMAP_METHODS}
      bind:value={$simmapMethodStore}
      placeholder=""
    />
    <Tooltip style="z-index: 1000;" type="light">Similarity Map Method</Tooltip>
  </div>
</div>
