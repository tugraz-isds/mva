<script lang="ts">
  import { Button, Modal, Label, NumberInput, Helper } from 'flowbite-svelte';
  import { parcoordDimMetadata, filtersArray, parcoordCustomAxisRanges } from '../../../stores/parcoord';
  import { isInteractableStore } from '../../../stores/brushing';
  import { dimensionDataStore } from '../../../stores/dataset';
  import type { AxesFilterType, CustomRangeType } from '../types';

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
    const axisFilter = $filtersArray.get(dimension) as AxesFilterType;
    filterStart = isAxisInverted
      ? yScales[dimension].invert(axisFilter.pixels.start).toFixed(numberOfDecimals)
      : yScales[dimension].invert(axisFilter.pixels.end).toFixed(numberOfDecimals);
    filterEnd = isAxisInverted
      ? yScales[dimension].invert(axisFilter.pixels.end).toFixed(numberOfDecimals)
      : yScales[dimension].invert(axisFilter.pixels.start).toFixed(numberOfDecimals);
    let dimCustomRange = $parcoordCustomAxisRanges.get(dimension) as CustomRangeType;
    originalMin = dimCustomRange === null ? ($dimensionDataStore.get(dimension)?.min as number) : dimCustomRange.start;
    originalMax = dimCustomRange === null ? ($dimensionDataStore.get(dimension)?.max as number) : dimCustomRange.end;
  }

  function setAxisRange() {
    const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
    if (filterEnd > originalMax) {
      validUpload = false;
      errorMessage = `Highest value of dimension range is ${originalMax}. You cannot set the filter value higher than that.`;
      return;
    }
    if (filterStart < originalMin) {
      validUpload = false;
      errorMessage = `Lowest value of dimension range is ${originalMin}. You cannot set the filter value lower than that.`;
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
    const filtersArrayTemp = $filtersArray;
    filtersArrayTemp.set(dimension, {
      pixels: {
        start: isAxisInverted ? yScales[dimension](filterStart) : yScales[dimension](filterEnd),
        end: isAxisInverted ? yScales[dimension](filterEnd) : yScales[dimension](filterStart)
      },
      percentages: {
        start: null,
        end: null
      }
    });
    filtersArray.set(filtersArrayTemp);
  }
</script>

<Modal bind:open={isOpen} on:open={loadData} size="xs" class="w-full">
  <form class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Set Filter Values for Dimension '{dimension}'</h3>
    <div class="mb-6 flex items-center">
      <div class="flex flex-row items-center mr-4 w-1/2">
        <Label for="filter-min" class="w-1/4">Start:</Label>
        <NumberInput
          bind:value={filterStart}
          on:change={() => (validUpload = true)}
          id="filter-min"
          defaultClass="block w-3/4"
          size="sm"
          step={1}
          min={originalMin}
          max={filterEnd}
        />
      </div>
      <div class="flex flex-row items-center mr-4 w-1/2">
        <Label for="filter-max" class="mr-2 w-1/4">End:</Label>
        <NumberInput
          bind:value={filterEnd}
          on:change={() => (validUpload = true)}
          id="filter-max"
          defaultClass="block w-3/4"
          size="sm"
          step={1}
          min={filterStart}
          max={originalMax}
        />
      </div>
    </div>
    <div>
      <div class="text-sm font-medium block text-gray-400 w-2/4 mb-2">Dimension Range:</div>
      <div class="mb-6 flex items-center">
        <div class="flex flex-row items-center mr-4">
          <Label for="original-range-min" class="w-1/4">Min:</Label>
          <NumberInput
            disabled
            readonly
            value={originalMin}
            id="original-range-min"
            defaultClass="block w-3/4"
            size="sm"
            style="color: #9ca3af;"
          />
        </div>
        <div class="flex flex-row items-center mr-4">
          <Label for="original-range-max" class="mr-2 w-1/4">Max:</Label>
          <NumberInput
            disabled
            readonly
            value={originalMax}
            id="original-range-max"
            defaultClass="block w-3/4"
            floatClass="text"
            size="sm"
            style="color: #9ca3af;"
          />
        </div>
      </div>
    </div>
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
    {/if}
    <Button type="submit" class="w-full" on:click={() => setAxisRange()}>Save</Button>
  </form>
</Modal>
