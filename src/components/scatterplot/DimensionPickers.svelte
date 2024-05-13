<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Select, Tooltip } from 'flowbite-svelte';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';
  import { dimensionDataStore } from '../../stores/dataset';

  let numericalDimensions: { value: string; name: string }[] = [];
  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    if (value?.size === 0) return;
    numericalDimensions = Array.from(value.keys())
      .filter((dim) => value.get(dim)?.active && value.get(dim)?.type === 'numerical')
      .map((dim) => ({
        value: dim,
        name: dim
      }));
  });

  onDestroy(() => {
    unsubscribeDimensionData();
  });
</script>

<div class="flex flex-row w-full">
  <div class="flex flex-row w-full mr-2">
    <span class="mr-1 text-[14px]">Y:</span>
    <Select
      class="w-full h-full text-[12px] rounded m-0 flex items-center justify-center overflow-hidden leading-4 z-10 text-ellipsis p-0 pl-2"
      style="padding-right: 1.5rem !important;"
      size="sm"
      items={numericalDimensions}
      bind:value={$yDimStore}
      placeholder=""
    />
    <Tooltip style="z-index: 1000;" type="light">Y Axis</Tooltip>
  </div>
  <div class="flex flex-row w-full">
    <span class="mr-1 text-[14px]">X:</span>
    <Select
      class="w-full h-full text-[12px] rounded m-0 flex items-center justify-center overflow-hidden leading-4 z-10 text-ellipsis p-0 pl-2"
      style="padding-right: 1.5rem !important;"
      size="sm"
      items={numericalDimensions}
      bind:value={$xDimStore}
      placeholder=""
    />
    <Tooltip style="z-index: 1000;" type="light">X Axis</Tooltip>
  </div>
</div>
