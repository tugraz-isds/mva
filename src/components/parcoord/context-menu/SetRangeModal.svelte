<script lang="ts">
  import { Button, Modal, Label, Helper, NumberInput } from 'flowbite-svelte';
  import { parcoordCustomAxisRanges, parcoordDimMetadata, filtersArray } from '../../../stores/parcoord';
  import { isInteractableStore } from '../../../stores/brushing';
  import { dimensionDataStore } from '../../../stores/dataset';
  import { scaleLinear } from 'd3-scale';
  import type { AxesFilterType } from '../types';

  export let isOpen: boolean;
  export let dimension: string;
  export let yScales: any;
  export let dimIndex: number;
  export let handleResetDimensionRange: () => void;

  $: if (!isOpen) {
    $isInteractableStore = true;
  }

  let rangeMin: number, rangeMax: number;
  let originalMin: number, originalMax: number;
  let validUpload = true; // If false show error message
  let errorMessage = '';

  function loadData() {
    const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
    rangeMin = isAxisInverted ? yScales[dimension].domain()[1] : yScales[dimension].domain()[0];
    rangeMax = isAxisInverted ? yScales[dimension].domain()[0] : yScales[dimension].domain()[1];
    originalMin = $dimensionDataStore.get(dimension)?.min as number;
    originalMax = $dimensionDataStore.get(dimension)?.max as number;
  }

  function setDimensionRange() {
    errorMessage = '';
    const isAxisInverted = $parcoordDimMetadata.get(dimension)?.inverted;
    if (rangeMax < originalMax) {
      validUpload = false;
      errorMessage = `You cannot set Max lower than ${originalMax}.`;
      return;
    }
    if (rangeMin > originalMin) {
      validUpload = false;
      errorMessage = `You cannot set Min higher than ${originalMin}.`;
      return;
    }

    validUpload = true;
    const customRanges = $parcoordCustomAxisRanges;
    customRanges.set(dimension, {
      start: isAxisInverted ? rangeMax : rangeMin,
      end: isAxisInverted ? rangeMin : rangeMax
    });
    isOpen = false;

    // Calculate new filter values
    const axisFilter = $filtersArray.get(dimension) as AxesFilterType;
    const originalScale = scaleLinear().domain(yScales[dimension].domain()).range([0, 1]);
    const newScale = scaleLinear()
      .domain(isAxisInverted ? [rangeMax, rangeMin] : [rangeMin, rangeMax])
      .range([0, 1]);
    const originalStart = originalScale.invert(1 - (axisFilter.percentages.start as number));
    const originalEnd = originalScale.invert(1 - (axisFilter.percentages.end as number));
    axisFilter.percentages = {
      start: 1 - newScale(originalStart),
      end: 1 - newScale(originalEnd)
    };

    const filtersArrayTemp = $filtersArray;
    filtersArrayTemp.set(dimension, axisFilter);
    filtersArray.set(filtersArrayTemp);
    $parcoordCustomAxisRanges = customRanges;
  }

  function resetDimensionRange() {
    rangeMin = originalMin as number;
    rangeMax = originalMax as number;
    handleResetDimensionRange();
  }
</script>

<Modal bind:open={isOpen} on:open={loadData} size="xs" class="w-full">
  <form class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Set Range for Dimension '{dimension}'</h3>
    <div class="mb-6 flex items-center">
      <div class="flex flex-row items-center mr-4">
        <Label for="range-min" class="w-1/4">Min:</Label>
        <NumberInput
          bind:value={rangeMin}
          on:change={() => (validUpload = true)}
          id="range-min"
          defaultClass="block w-3/4"
          size="sm"
          step={1}
          max={originalMin}
        />
      </div>
      <div class="flex flex-row items-center mr-4">
        <Label for="range-max" class="mr-2 w-1/4">Max:</Label>
        <NumberInput
          bind:value={rangeMax}
          on:change={() => (validUpload = true)}
          id="range-max"
          defaultClass="block w-3/4"
          size="sm"
          step={1}
          min={originalMax}
        />
      </div>
      <div class="flex flex-row items-center">
        <Button type="submit" class="w-full" on:click={() => setDimensionRange()}>Save</Button>
      </div>
    </div>
    <div>
      <div class="text-sm font-medium block text-gray-400 w-1/4">Original Range:</div>
      <div class="mb-6 flex items-center">
        <div class="flex flex-row items-center mr-4">
          <Label for="original-range-min" class="w-1/4">Min:</Label>
          <NumberInput
            value={originalMin}
            disabled
            readonly
            id="original-range-min"
            defaultClass="block w-3/4"
            size="sm"
            style="color: #9ca3af;"
          />
        </div>
        <div class="flex flex-row items-center mr-4">
          <Label for="original-range-max" class="mr-2 w-1/4">Max:</Label>
          <NumberInput
            value={originalMax}
            disabled
            readonly
            id="original-range-max"
            defaultClass="block w-3/4"
            floatClass="text"
            size="sm"
            style="color: #9ca3af;"
          />
        </div>
        <div class="flex flex-row items-center">
          <Button type="submit" class="w-full" on:click={resetDimensionRange}>Reset</Button>
        </div>
      </div>
    </div>
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
    {/if}
  </form>
</Modal>
