<script lang="ts">
  import { Button, Modal, Label, NumberInput, Helper } from 'flowbite-svelte';
  import { parcoordHistogramData } from '../../../stores/parcoord';
  import { isInteractableStore } from '../../../stores/brushing';
  import type { HistogramsType } from '../types';

  export let isOpen: boolean;

  $: if (!isOpen) $isInteractableStore = true;

  let histogramSettings: HistogramsType;

  function checkData(
    property: 'fillOpacity' | 'strokeOpacity' | 'width' | 'widthLimits',
    minValue: number,
    maxValue: number
  ) {
    if (property === 'widthLimits')
      histogramSettings.widthLimits.min = Math.max(
        minValue,
        Math.min(maxValue, histogramSettings.widthLimits.min)
      );
    else
      histogramSettings[property] = Math.max(
        minValue,
        Math.min(maxValue, histogramSettings[property])
      );
  }

  function loadData() {
    $isInteractableStore = false;
    histogramSettings = $parcoordHistogramData;
  }

  function saveData() {
    parcoordHistogramData.set(histogramSettings);
    isOpen = false;
  }
</script>

<Modal bind:open={isOpen} on:open={loadData} size="xs" class="w-full">
  <form class="flex flex-col space-y-6">
    <h3 class="text-xl font-medium text-gray-900">Histogram Settings</h3>
    <div>
      <div class="flex items-center">
        <Label for="fill-opacity-input" class="w-1/4">Fill opacity:</Label>
        <NumberInput
          id="fill-opacity-input"
          bind:value={histogramSettings.fillOpacity}
          on:change={() => checkData('fillOpacity', 0, 1)}
          defaultClass="block w-1/5"
          size="sm"
          step={0.1}
          min={0}
          max={1}
        />
      </div>
      <div class="mb-6 flex items-center">
        <span class="w-1/4 bg-red-300" />
        <Helper class="text-xs w-3/4">Fill opacity of bins. Select a number from 0.0 to 1.0.</Helper
        >
      </div>

      <div class="flex items-center">
        <Label for="stroke-opacity-input" class="w-1/4">Stroke opacity:</Label>
        <NumberInput
          id="stroke-opacity-input"
          bind:value={histogramSettings.strokeOpacity}
          on:change={() => checkData('strokeOpacity', 0, 1)}
          defaultClass="block w-1/5"
          size="sm"
          step={0.1}
          min={0}
          max={1}
        />
      </div>
      <div class="mb-6 flex items-center">
        <span class="w-1/4 bg-red-300" />
        <Helper class="text-xs w-3/4"
          >Stroke opacity of bins. Select a number from 0.0 to 1.0.</Helper
        >
      </div>

      <div class="flex items-center">
        <Label for="width-input" class="w-1/4">Bins width:</Label>
        <NumberInput
          id="width-input"
          bind:value={histogramSettings.width}
          on:change={() => checkData('width', 0, 1)}
          defaultClass="block w-1/5"
          size="sm"
          step={0.1}
          min={0}
          max={1}
        />
      </div>
      <div class="mb-6 flex items-center">
        <span class="w-1/4 bg-red-300" />
        <Helper class="text-xs w-3/4"
          >Bins width as proportion of distance between two axes. Select a number from 0.0 to 1.0.</Helper
        >
      </div>

      <div class="flex items-center">
        <Label for="width-input" class="w-1/4">Bins min width:</Label>
        <NumberInput
          id="width-input"
          bind:value={histogramSettings.widthLimits.min}
          on:change={() => checkData('widthLimits', 0, histogramSettings.widthLimits.max)}
          defaultClass="block w-1/5"
          size="sm"
          step={1}
          min={0}
          max={histogramSettings.widthLimits.max}
        />
      </div>
      <div class="mb-6 flex items-center">
        <span class="w-1/4 bg-red-300" />
        <Helper class="text-xs w-3/4"
          >Minimum width of bins in pixels. Select a number from 0 to {Math.floor(
            histogramSettings.widthLimits.max
          )}.</Helper
        >
      </div>

      <Button type="submit" class="w-full" on:click={saveData}>Save</Button>
    </div>
  </form>
</Modal>
