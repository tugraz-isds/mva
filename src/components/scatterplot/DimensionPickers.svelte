<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Select } from 'flowbite-svelte';
  import { xDimStore, yDimStore } from '../../stores/scatterplot';
  import { dimensionDataStore } from '../../stores/dataset';
  import type { DimensionDataType } from '../../util/types';

  let numericalDimensions: { value: string; name: string }[] = [];
  const unsubscribeDimensionData = dimensionDataStore.subscribe(
    (value: Map<string, DimensionDataType>) => {
      if (value?.size === 0) return;
      numericalDimensions = Array.from(value.keys())
        .filter((dim) => value.get(dim)?.active && value.get(dim)?.type === 'numerical')
        .map((dim) => ({
          value: dim,
          name: dim
        }));
    }
  );

  onDestroy(() => {
    unsubscribeDimensionData();
  });
</script>

<div class="flex flex-row w-full">
  <div class="flex flex-row w-full mr-2">
    <span class="mr-1/2" style="font-size: 14px;">Y:</span>
    <Select
      class="w-1/2"
      size="sm"
      items={numericalDimensions}
      bind:value={$yDimStore}
      placeholder=""
      style="height: 18px;
            padding: 0 16px 0 4px;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 12px;"
    />
  </div>
  <div class="flex flex-row w-full">
    <span class="mr-1/2" style="font-size: 14px;">X:</span>
    <Select
      class="w-1/2"
      size="sm"
      items={numericalDimensions}
      bind:value={$xDimStore}
      placeholder=""
      style="height: 18px;
            padding: 0 16px 0 4px;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 12px;"
    />
  </div>
</div>
