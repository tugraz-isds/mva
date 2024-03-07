<script lang="ts">
  import { Select } from 'flowbite-svelte';
  import { numericalDimensionsStore, xDimStore, yDimStore } from '../../stores/scatterplot';
  import { onDestroy } from 'svelte';

  let numericalDimensions: { value: string; name: string }[] = [];
  const unsubscribeNumericalDims = numericalDimensionsStore.subscribe((value: string[]) => {
    numericalDimensions = [];
    value.forEach((dim: string) => {
      numericalDimensions.push({
        value: dim,
        name: dim
      });
    });
  });

  onDestroy(() => {
    unsubscribeNumericalDims();
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
