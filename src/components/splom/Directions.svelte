<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from 'flowbite-svelte';
  import { ArrowRightOutline, ArrowLeftOutline, ArrowDownOutline, ArrowUpOutline } from 'flowbite-svelte-icons';
  import { splomXDimensionsStore, splomYDimensionsStore } from '../../stores/splom';
  import { dimensionDataStore } from '../../stores/dataset';
  import { SPLOM_DIMENSIONS_NUM } from './util';

  let numericalDimensions: string[];
  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    if (value?.size === 0) return;
    const numericalDimensionsNew = Array.from(value.keys()).filter(
      (dim) => value.get(dim)?.active && value.get(dim)?.type === 'numerical'
    );
    numericalDimensions = numericalDimensionsNew;
  });

  let splomXStart: number;
  const unsubscribeXDim = splomXDimensionsStore.subscribe((value) => {
    splomXStart = value;
  });

  let splomYStart: number;
  const unsubscribeYDim = splomYDimensionsStore.subscribe((value) => {
    splomYStart = value;
  });

  onDestroy(() => {
    unsubscribeDimensionData();
    unsubscribeXDim();
    unsubscribeYDim();
  });
</script>

<div class="flex flex-row gap-1">
  <Button
    on:click={() => splomXDimensionsStore.set(splomXStart - 1)}
    disabled={splomXStart === 0}
    class="p-0 m-0 text-black"
  >
    <ArrowLeftOutline
      size="sm"
      class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
    />
  </Button>
  <Button
    on:click={() => splomXDimensionsStore.set(splomXStart + 1)}
    disabled={splomXStart >= numericalDimensions?.length - SPLOM_DIMENSIONS_NUM}
    class="p-0 m-0 text-black"
  >
    <ArrowRightOutline
      size="sm"
      class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
    />
  </Button>
  <Button
    on:click={() => splomYDimensionsStore.set(splomYStart - 1)}
    disabled={splomYStart === 0}
    class="p-0 m-0 text-black"
  >
    <ArrowUpOutline
      size="sm"
      class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
    />
  </Button>
  <Button
    on:click={() => splomYDimensionsStore.set(splomYStart + 1)}
    disabled={splomYStart >= numericalDimensions?.length - SPLOM_DIMENSIONS_NUM}
    class="p-0 m-0 text-black"
  >
    <ArrowDownOutline
      size="sm"
      class="text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
    />
  </Button>
</div>
