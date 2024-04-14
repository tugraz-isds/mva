<script lang="ts">
  import { Button, Modal, Label, Input, Fileupload, Helper, Select, Spinner } from 'flowbite-svelte';
  import { datasetStore, labelDimension, dimensionDataStore } from '../../../stores/dataset';
  import { isInteractableStore } from '../../../stores/brushing';
  import { tableDimensionsStore } from '../../../stores/table';
  import { DEFAULT_PARTITION, isNumber } from '../../../util/util';
  import {
    SELECT_DEFAULT_STYLE,
    CELL_SEPARATOR_LIST,
    DECIMAL_SEPARATOR_LIST,
    COLUMN_TYPE_LIST,
    parseDatasetPreview,
    parseDataset
  } from './datasetUtil';
  import type { DimensionType } from '../../../util/types';
  import DatasetPreview from './DatasetPreview.svelte';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';

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
  let selectedColumn: number | null = null;

  $: if (!isOpen) {
    $isInteractableStore = true;
  }

  $: if (previewHeaderString.length > 0 && previewRowsString.length > 0) {
    const separator = cellSeparator === 'other' ? cellSeparatorOther : cellSeparator;
    previewRows = previewRowsString.map((row) => row.split(separator));
    previewHeader = previewHeaderString.split(separator).map((header, i) => ({
      title: header,
      type: isNumber(previewRows[0][i]) ? 'numerical' : 'categorical'
    }));
  }

  async function handleFileUpload(event: Event) {
    files = (event.target as HTMLInputElement).files as FileList;
    if (files.length > 0) ({ previewHeaderString, previewRowsString } = await parseDatasetPreview(files[0]));
    selectedColumn = null;
    validUpload = true;
  }

  async function importDataset() {
    isLoading = true;
    try {
      const { dataset, tableDimensions, dimensionTypeMap, labelDim } = await parseDataset(
        files,
        cellSeparator,
        decimalSeparator
      );

      tableDimensionsStore.set(tableDimensions);
      dimensionDataStore.set(dimensionTypeMap);
      datasetStore.set(dataset);
      labelDimension.set(labelDim);

      partitionsStore.set(
        new Map([
          [
            DEFAULT_PARTITION,
            {
              size: dataset.length,
              shape: 'circle',
              color: { r: 65, b: 225, g: 105, a: 1 }
            }
          ]
        ])
      );

      partitionsDataStore.set(Array(dataset.length).fill(DEFAULT_PARTITION));

      validUpload = true;
      isOpen = false;
    } catch (error: any) {
      errorMessage = error.message;
      validUpload = false;
    } finally {
      isLoading = false;
    }
  }

  function selectColumn(i: number, calledFrom: 'click' | 'contextMenu') {
    selectedColumn = selectedColumn === i && calledFrom === 'click' ? null : i;
    columnType = previewHeader[i].type ?? 'numerical';
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
          accept=".csv"
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
          defaultClass={SELECT_DEFAULT_STYLE}
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
          defaultClass={SELECT_DEFAULT_STYLE}
          bind:value={decimalSeparator}
          on:change={() => (validUpload = true)}
          items={DECIMAL_SEPARATOR_LIST}
          placeholder=""
        />
      </div>
    </div>
    <div class="border-b-2 border-gray-200" />
    <div class="mb-6 flex items-center space-x-2 w-1/2">
      <Label for="cell-type-select" class="w-1/4">Column Type:</Label>
      <Select
        id="cell-type-select"
        size="sm"
        defaultClass={SELECT_DEFAULT_STYLE}
        bind:value={columnType}
        on:change={() => changeColumnType(selectedColumn)}
        items={COLUMN_TYPE_LIST}
        placeholder=""
      />
    </div>
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
    {/if}
    {#if previewHeader.length > 0 && previewRowsString.length > 0}
      <DatasetPreview {selectedColumn} {previewHeader} {previewRows} {changeColumnType} {selectColumn} />
    {/if}
    <div class="w-full flex justify-center">
      <Button class="w-1/2" on:click={importDataset}>Import Dataset</Button>
    </div>
  </form>
</Modal>
