<script lang="ts">
  import { Button, Checkbox, Tooltip } from 'flowbite-svelte';
  import { CogOutline } from 'flowbite-svelte-icons';
  import { parcoordHistogramData } from '../../../stores/parcoord';
  import HistogramSettingsModal from './HistogramSettingsModal.svelte';

  let isHistogramSettingsModalOpen = false;

  function toggleModal() {
    isHistogramSettingsModalOpen = false;
    isHistogramSettingsModalOpen = true;
  }
</script>

<div class="flex justify-center items-center">
  <span class="text-xs mr-1 text-nowrap text-ellipsis overflow-hidden">Show histograms: </span>
  <Checkbox bind:checked={$parcoordHistogramData.visible} style="height: 10px; width: 10px;" />
  <Button on:click={toggleModal} class="p-0 m-0 text-black">
    <CogOutline
      class="w-4 h-4 text-grey-900 cursor-pointer rounded bg-gray-50 border-solid border-2 border-gray-300 hover:bg-gray-300"
    />
  </Button>
  <Tooltip style="z-index: 1000;" type="light">Histogram Settings</Tooltip>
</div>

<HistogramSettingsModal isOpen={isHistogramSettingsModalOpen} />
