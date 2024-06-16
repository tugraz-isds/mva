<script lang="ts">
  import { Button, Modal, Label, Input, Helper, Select, Spinner, Checkbox } from 'flowbite-svelte';
  import { isInteractableStore } from '../../../stores/brushing';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';
  import {
    CELL_SEPARATOR_LIST,
    DECIMAL_SEPARATOR_LIST,
    DATASET_FORMAT_LIST,
    exportDataset,
    type DatasetFormatType
  } from './datasetUtil';
  import { datasetStore, dimensionDataStore } from '../../../stores/dataset';

  export let isOpen: boolean;

  // Form Data
  let cellSeparator = ',';
  let cellSeparatorOther = ',';
  let decimalSeparator = '.';
  let datasetFormat: DatasetFormatType = 'csv';
  let validUpload = true;
  let errorMessage = '';
  let isLoading = false;
  let exportInactive = false;
  let exportPartitions = true;

  $: if (!isOpen) $isInteractableStore = true;

  function handleExportDataset() {
    validUpload = true;
    const separator = cellSeparator === 'other' ? cellSeparatorOther : cellSeparator;
    if (separator === decimalSeparator) {
      errorMessage = 'Cell separator cannot be the same as decimal separator.';
      validUpload = false;
      return;
    }

    const dimensions = Array.from($dimensionDataStore.keys()).filter((dim) =>
      exportInactive ? true : $dimensionDataStore.get(dim)?.active
    );

    exportDataset(
      datasetFormat,
      $datasetStore,
      dimensions,
      separator,
      decimalSeparator,
      $dimensionDataStore,
      exportPartitions,
      $partitionsDataStore,
      $partitionsStore
    );

    isOpen = false;
  }
</script>

<Modal bind:open={isOpen} size="xs">
  {#if isLoading}
    <div class="w-full h-full flex items-center justify-center"><Spinner /></div>
  {/if}
  <form class="flex flex-col space-y-4 px-4 {isLoading ? 'invisible' : 'visible'}">
    <div class="mb-4">
      <h3 class="text-xl font-medium text-gray-900">Export Dataset</h3>
    </div>
    <div class="flex flex-col space-y-2 mb-6 w-full">
      <div class="flex items-center space-x-2 w-full ml-2">
        <Label for="separator-select" class="w-1/3">Dataset Format:</Label>
        <Select
          id="dataset-format-select"
          size="sm"
          class="w-2/3"
          bind:value={datasetFormat}
          on:change={() => (validUpload = true)}
          items={DATASET_FORMAT_LIST}
          placeholder=""
        />
      </div>
      <div class="flex items-center space-x-2 w-full ml-2">
        <Label for="cell-separator-select" class="w-1/3">Cell Separator:</Label>
        <Select
          id="cell-separator-select"
          size="sm"
          class="w-2/3"
          bind:value={cellSeparator}
          on:change={() => (validUpload = true)}
          items={CELL_SEPARATOR_LIST}
          placeholder=""
        />
        {#if cellSeparator === 'other'}
          <Input
            id="cell-other-separator-input"
            defaultClass="block ml-2 w-1/4"
            size="sm"
            bind:value={cellSeparatorOther}
          />
        {/if}
      </div>
      <div class="flex items-center space-x-2 w-full ml-2">
        <Label for="separator-select" class="w-1/3">Decimal Separator:</Label>
        <Select
          id="decimal-separator-select"
          size="sm"
          class="w-2/3"
          bind:value={decimalSeparator}
          on:change={() => (validUpload = true)}
          items={DECIMAL_SEPARATOR_LIST}
          placeholder=""
        />
      </div>
      <div class="flex flex-row items-center ml-2">
        <Label for="export-inactive-input">Export Inactive Dimensions:</Label>
        <Checkbox class="ml-2" bind:checked={exportInactive} />
      </div>
      <div class="flex flex-row items-center ml-2">
        <Label for="export-partitions-input">Export Partitions Data:</Label>
        <Checkbox class="ml-2" bind:checked={exportPartitions} />
      </div>
    </div>
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
    {/if}
    <div class="w-full flex justify-center">
      <Button on:click={handleExportDataset} class="w-1/2">Export Dataset</Button>
    </div>
  </form>
</Modal>
