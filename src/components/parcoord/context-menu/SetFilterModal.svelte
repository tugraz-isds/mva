<script lang="ts">
  import { Button, Modal, Label, NumberInput, Helper } from 'flowbite-svelte';
  import { parcoordDimMetadata, filtersArray } from '../../../stores/parcoord';
  import { isInteractableStore } from '../../../stores/brushing';
  import { dimensionDataStore } from '../../../stores/dataset';

  export let isOpen: boolean;
  export let dimension: string;
  export let yScales: any;
  export let dimIndex: number;

  let filterStart: number, filterEnd: number;
  let originalMin: number, originalMax: number;
  let validUpload = true;
  let errorMessage = '';

  $: if (!isOpen) {
    $isInteractableStore = true;
  }

  function loadData() {
    const numberOfDecimals = $dimensionDataStore.get(dimension)?.numberOfDecimals;
    const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
    filterStart = isAxisInverted
      ? yScales[dimension].invert($filtersArray[dimIndex].pixels.start).toFixed(numberOfDecimals)
      : yScales[dimension].invert($filtersArray[dimIndex].pixels.end).toFixed(numberOfDecimals);
    filterEnd = isAxisInverted
      ? yScales[dimension].invert($filtersArray[dimIndex].pixels.end).toFixed(numberOfDecimals)
      : yScales[dimension].invert($filtersArray[dimIndex].pixels.start).toFixed(numberOfDecimals);
    originalMin = $dimensionDataStore.get(dimension)?.min as number;
    originalMax = $dimensionDataStore.get(dimension)?.max as number;
  }

  function setAxisRange() {
    const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
    if (filterEnd > originalMax) {
      validUpload = false;
      errorMessage = `Highest value of dimension is ${originalMax}. You cannot set the filter value higher than that.`;
      return;
    }
    if (filterStart < originalMin) {
      validUpload = false;
      errorMessage = `Lowest value of dimension is ${originalMin}. You cannot set the filter value lower than that.`;
      return;
    }
    if (filterStart > filterEnd) {
      validUpload = false;
      errorMessage = `Filter start cannot be higher than filter end.`;
      return;
    }

    validUpload = true;
    isOpen = false;

    // Calculate new filter values
    const filtersTemp = $filtersArray;
    filtersTemp[dimIndex] = {
      pixels: {
        start: isAxisInverted ? yScales[dimension](filterStart) : yScales[dimension](filterEnd),
        end: isAxisInverted ? yScales[dimension](filterEnd) : yScales[dimension](filterStart)
      },
      percentages: {
        start: null,
        end: null
      }
    };

    $filtersArray = filtersTemp;
  }
</script>

<Modal bind:open={isOpen} on:open={loadData} size="xs" class="w-full">
  <form class="flex flex-col space-y-6" action="#">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Set Filter Values</h3>
    <div class="mb-6 flex items-center">
      <div class="flex flex-row items-center">
        <Label for="filter-min" class="mr-2">Start:</Label>
        <NumberInput
          bind:value={filterStart}
          on:change={() => (validUpload = true)}
          id="filter-min"
          defaultClass="block w-1/2"
          size="sm"
          step={1}
          min={originalMin}
          max={filterEnd}
        />
      </div>
      <div class="flex flex-row items-center">
        <Label for="filter-max" class="mr-2">End:</Label>
        <NumberInput
          bind:value={filterEnd}
          on:change={() => (validUpload = true)}
          id="filter-max"
          defaultClass="block w-1/2"
          size="sm"
          step={1}
          min={filterStart}
          max={originalMax}
        />
      </div>
    </div>
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
    {/if}
    <Button type="submit" class="w-full" on:click={() => setAxisRange()}>Save</Button>
  </form>
</Modal>
