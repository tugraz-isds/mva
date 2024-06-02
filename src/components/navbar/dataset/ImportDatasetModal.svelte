<script lang="ts">
  import { Button, Modal, Label, Input, Fileupload, Helper, Select, Spinner } from 'flowbite-svelte';
  import { datasetStore, labelDimension, dimensionDataStore } from '../../../stores/dataset';
  import { isInteractableStore } from '../../../stores/brushing';
  import { tableVisibleDimensionsStore } from '../../../stores/table';
  import { isNumber } from '../../../util/util';
  import {
    CELL_SEPARATOR_LIST,
    DECIMAL_SEPARATOR_LIST,
    parseDatasetPreview,
    parseDataset,
    getCsvFromFile,
    getDatasetExtension
  } from './datasetUtil';
  import DatasetPreview from './DatasetPreview.svelte';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';
  import { parcoordVisibleDimensionsStore } from '../../../stores/parcoord';
  import type { DimensionType } from '../../../util/types';

  export let isOpen: boolean;

  // Form Data
  let files: FileList;
  let fileName: string;
  let cellSeparator = ',';
  let cellSeparatorOther = ',';
  let decimalSeparator = '.';
  let columnType: DimensionType;
  let validUpload = true;
  let errorMessage = 'Upload valid CSV file.';
  let isLoading = false;

  // Dataset Preview
  let previewHeaderString = '';
  let previewHeader: { title: string; type: DimensionType | null }[] = [];
  let previewRowsString: string[] = [];
  let previewRows: string[][] = [];

  $: if (!isOpen) $isInteractableStore = true;

  $: if (previewHeaderString.length > 0 && previewRowsString.length > 0) {
    const separator = cellSeparator === 'other' ? cellSeparatorOther : cellSeparator;
    previewRows = previewRowsString.map((row) => row.split(separator));
    previewHeader = previewHeaderString.split(separator).map((header, i) => ({
      title: header,
      type: isNumber(previewRows[0][i]) ? 'numerical' : 'categorical'
    }));
  }

  async function handleFileUpload(event: Event) {
    try {
      files = (event.target as HTMLInputElement).files as FileList;
      if (files.length > 0) ({ previewHeaderString, previewRowsString } = await parseDatasetPreview(files[0]));
      validUpload = true;
    } catch (error: any) {
      errorMessage = error.message;
      validUpload = false;
    }
  }

  async function importDataset() {
    isLoading = true;
    try {
      const datasetText = await getCsvFromFile(files);
      const datasetExtension = getDatasetExtension(files[0].name);
      const { dataset, shownDimensions, dimensionTypeMap, labelDim, partitionsMap, partitionsData } =
        await parseDataset(datasetText, datasetExtension, cellSeparator, decimalSeparator);

      tableVisibleDimensionsStore.set(shownDimensions);
      parcoordVisibleDimensionsStore.set(shownDimensions);
      dimensionDataStore.set(dimensionTypeMap);
      datasetStore.set(dataset);
      labelDimension.set(labelDim);
      partitionsStore.set(partitionsMap);
      partitionsDataStore.set(partitionsData);

      validUpload = true;
      isOpen = false;
    } catch (error: any) {
      errorMessage = error.message;
      validUpload = false;
    } finally {
      isLoading = false;
    }
  }

  function changeColumnType(idx: number | null, newColumnType: DimensionType | null = null) {
    if (idx === null) return;
    if (newColumnType !== null) columnType = newColumnType;

    previewHeader[idx].type = columnType;
  }
</script>

<Modal bind:open={isOpen} size="xl">
  {#if isLoading}
    <div class="w-full h-full flex items-center justify-center"><Spinner /></div>
  {/if}
  <form class="flex flex-col space-y-4 {isLoading ? 'invisible' : 'visible'}">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Import Dataset</h3>
    <div class="flex flex-row mb-6">
      <div class="flex items-center w-1/2">
        <Label for="upload-input" class="w-1/4">Upload File:</Label>
        <Fileupload
          bind:value={fileName}
          on:change={handleFileUpload}
          id="upload-input"
          class="block ml-2 w-3/4"
          accept=".csv,.mva"
        />
      </div>
      {#if fileName?.length > 0}
        <Label class="ml-4 self-center">Dataset: {fileName.replace('C:\\fakepath\\', '')}</Label>
      {/if}
    </div>
    <div class="border-b-2 border-gray-200" />
    <div class="flex flex-row mb-6">
      <div class="flex items-center space-x-2 w-1/2">
        <Label for="cell-separator-select" class="w-1/4">Cell Separator:</Label>
        <Select
          id="cell-separator-select"
          size="sm"
          class="w-1/2"
          bind:value={cellSeparator}
          on:change={() => (validUpload = true)}
          items={CELL_SEPARATOR_LIST}
          placeholder=""
        />
        {#if cellSeparator === 'other'}
          <Input
            id="cell-other-separator-input"
            defaultClass="block ml-2 w-1/2"
            size="sm"
            bind:value={cellSeparatorOther}
          />
        {/if}
      </div>
      <div class="flex items-center space-x-2 w-1/2 ml-2">
        <Label for="separator-select" class="w-1/4">Decimal Separator:</Label>
        <Select
          id="decimal-separator-select"
          size="sm"
          class="w-1/2"
          bind:value={decimalSeparator}
          on:change={() => (validUpload = true)}
          items={DECIMAL_SEPARATOR_LIST}
          placeholder=""
        />
      </div>
    </div>
    <div class="border-b-2 border-gray-200" />
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
    {/if}
    {#if previewHeader.length > 0 && previewRowsString.length > 0}
      <DatasetPreview {previewHeader} {previewRows} />
    {/if}
    <div class="w-full flex justify-center">
      <Button class="w-1/2" on:click={importDataset}>Import Dataset</Button>
    </div>
  </form>
</Modal>
