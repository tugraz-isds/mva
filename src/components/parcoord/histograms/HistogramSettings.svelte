<script lang="ts">
  import { Checkbox, Tooltip } from 'flowbite-svelte';
  import { Cog8Tooth } from 'svelte-heros-v2';
  import { parcoordHistogramData } from '../../../stores/parcoord';
  import HistogramSettingsModal from './HistogramSettingsModal.svelte';

  let isHistogramSettingsModalOpen = false;

  function toggleModal() {
    isHistogramSettingsModalOpen = false;
    isHistogramSettingsModalOpen = true;
  }
</script>

<div class="w-full flex items-center">
  <span class="text-xs mr-1">Show histograms: </span>
  <Checkbox
    bind:checked={$parcoordHistogramData.visible}
    style="height: 10px; width: 10px; margin-right: 8px;"
  />
  <Cog8Tooth
    size="16"
    class="text-grey-900 cursor-pointer hover:bg-sky-100"
    on:click={toggleModal}
  />
  <Tooltip type="light">Histogram Settings</Tooltip>
</div>

<HistogramSettingsModal isOpen={isHistogramSettingsModalOpen} />
