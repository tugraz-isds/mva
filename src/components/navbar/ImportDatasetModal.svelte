<script lang="ts">
  import {
    Button,
    Modal,
    Label,
    Input,
    Fileupload,
    Helper,
    Select,
    Spinner
  } from 'flowbite-svelte';
  import ContextMenu from './ContextMenu.svelte';
  import { extent, max } from 'd3-array';
  import { autoType, dsvFormat, type DSVParsedArray } from 'd3-dsv';
  import { datasetStore, labelDimension, dimensionDataStore } from '../../stores/dataset';
  import { parcoordIsInteractable } from '../../stores/parcoord';
  import { isNumber } from '../../util/util';
  import { capitalizeString, clearStringQuotes } from '../../util/text';
  import type { DimensionType, DimensionDataType } from '../../util/types';

  export let isOpen: boolean;

  const HEADER_ROW_NO = 10;
  const SELECT_DEFAULT_STYLE =
    'w-1/2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500';

  let contextMenu: ContextMenu;
  let files: FileList;
  let fileName: string;
  let headHeaderString = '';
  let headHeader: { title: string; type: DimensionType | null }[] = [];
  let headRowsString: string[] = [];
  let headRows: string[][] = [];
  let validUpload = true;
  let errorMessage = 'Upload valid CSV file.';
  let selectedColumn: number | null = null;
  let isLoading = false;

  let cellSeparator = ',';
  const cellSeparatorList = [
    { value: ',', name: 'Comma' },
    { value: ';', name: 'Semicolon' },
    { value: '\t', name: 'Tab' },
    { value: ' ', name: 'Space' },
    { value: 'other', name: 'Other' }
  ];
  let cellSeparatorOther = ',';

  let decimalSeparator = '.';
  const decimalSeparatorList = [
    { value: '.', name: 'Dot' },
    { value: ',', name: 'Comma' }
  ];

  let columnType: DimensionType;
  const columnTypeList = [
    { value: 'numerical', name: 'Numerical' },
    { value: 'categorical', name: 'Categorical' }
  ];

  $: if (!isOpen) {
    $parcoordIsInteractable = true;
  }

  $: if (files && files.length > 0) {
    readDatasetHead(files[0]);
    selectedColumn = null;
    validUpload = true;
  }

  $: if (
    cellSeparator &&
    cellSeparatorOther &&
    headHeaderString.length > 0 &&
    headRowsString.length > 0
  ) {
    const separator = cellSeparator === 'other' ? cellSeparatorOther : cellSeparator;
    headRows = headRowsString.map((row) => row.split(separator));

    headHeader = headHeaderString.split(separator).map((header, i) => ({
      title: header,
      type: isNumber(headRows[0][i]) ? 'numerical' : 'categorical'
    }));
  }

  async function readDatasetHead(file: File) {
    const reader = file.stream().getReader();
    headRowsString = [];
    headHeaderString = '';
    let decoder = new TextDecoder();
    let { value: chunk, done } = await reader.read();
    let textChunk = decoder.decode(chunk, { stream: true });
    let startIndex = 0;

    while (!done && headRowsString.length < HEADER_ROW_NO) {
      let endIndex = textChunk.indexOf('\n', startIndex);
      if (endIndex === -1) {
        ({ value: chunk, done } = await reader.read());
        textChunk += decoder.decode(chunk, { stream: !done });
        continue;
      }

      if (startIndex === 0) headHeaderString = textChunk.substring(startIndex, endIndex);
      else headRowsString.push(textChunk.substring(startIndex, endIndex));
      startIndex = endIndex + 1;

      if (headRowsString.length === HEADER_ROW_NO) break;
    }
  }

  async function importDataset() {
    if (!files || files.length === 0) {
      errorMessage = 'Upload valid CSV file.';
      validUpload = false;
      return;
    }

    if (cellSeparator === decimalSeparator) {
      errorMessage = 'Cell separator cannot be the same as decimal separator.';
      validUpload = false;
      return;
    }

    isLoading = true;
    const file = files[0];
    let text = await file.text();
    const parser = dsvFormat(cellSeparator);
    let dataset: DSVParsedArray<any> = parser.parse(text, autoType);

    const dimensions = Object.keys(dataset[0]);
    const dimensionTypeMap = new Map<string, DimensionDataType>(new Map());
    dimensions.forEach((dim: string) => {
      const dimData = dataset.map((d) => d[dim]);
      const longestString = dimData.reduce((longest, currentStr) => {
        currentStr = currentStr ?? '';
        return currentStr.toString().length > longest.toString().length ? currentStr : longest;
      }, '');
      if (isNumber(dataset[0][dim])) {
        const dimExtent: any = extent(dataset, (d: any) => +d[dim]);
        const maxNumberOfDecimals = max(dimData, (number: number) => {
          const numberOfDecimals = number?.toString().includes('.')
            ? number.toString().split('.')[1].length
            : 0;
          return numberOfDecimals;
        });
        dimensionTypeMap.set(dim, {
          type: 'numerical',
          min: dimExtent[0],
          max: dimExtent[1],
          numberOfDecimals: maxNumberOfDecimals ?? null,
          longestString: longestString ?? ''
        });
      } else
        dimensionTypeMap.set(dim, {
          type: 'categorical',
          min: null,
          max: null,
          numberOfDecimals: null,
          longestString: longestString ?? ''
        });
    });
    dimensionDataStore.set(dimensionTypeMap);
    localStorage.setItem('dimensionTypes', JSON.stringify(Array.from(dimensionTypeMap.entries())));

    datasetStore.set(dataset);
    localStorage.setItem('MVA_dataset', JSON.stringify(dataset));

    const labelDim = Object.keys(dataset[0])[0]; // Set first dimension as label
    labelDimension.set(labelDim);
    localStorage.setItem('labelDimension', labelDim);

    isLoading = false;
    validUpload = true;
    isOpen = false;
  }

  function checkValidUpload() {
    if (!validUpload) validUpload = true;
  }

  function selectColumn(i: number, calledFrom: 'click' | 'contextMenu'): void {
    selectedColumn = selectedColumn === i && calledFrom === 'click' ? null : i;
    columnType = headHeader[i].type ?? 'numerical';
  }

  function changeColumnType(idx: number | null, newColumnType: DimensionType | null = null): void {
    if (idx === null) return;
    if (newColumnType !== null) columnType = newColumnType;

    headHeader[idx].type = columnType;
  }
</script>

<ContextMenu bind:this={contextMenu} {changeColumnType} />
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
          bind:files
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
          on:change={checkValidUpload}
          items={cellSeparatorList}
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
          on:change={checkValidUpload}
          items={decimalSeparatorList}
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
        items={columnTypeList}
        placeholder=""
      />
    </div>
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">{errorMessage}</span></Helper>
    {/if}
    {#if headHeader.length > 0 && headRowsString.length > 0}
      <div class="w-full scrollable-div">
        <table id="dataset-header" class="w-full">
          <thead style="font-size: 14px;">
            <tr class="bg-gray-100 select-none hover:cursor-pointer">
              {#each headHeader as header, i}
                <th
                  class="px-1 {selectedColumn === i
                    ? 'bg-blue-200 hover:bg-blue-300'
                    : 'hover:bg-gray-200'} text-{header.type === 'numerical' ? 'right' : 'left'}"
                  on:click={() => selectColumn(i, 'click')}
                  on:contextmenu={(e) => {
                    selectColumn(i, 'contextMenu');
                    contextMenu.showContextMenu(e, i, header);
                  }}>{clearStringQuotes(header.title)}</th
                >
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each headHeader as header, i}
              <th class="px-1 {selectedColumn === i ? 'bg-blue-200' : ''}"
                >{capitalizeString(header.type ?? '')}</th
              >
            {/each}
            {#each headRows as row}
              <tr class="text-black" style="font-size: 12px;">
                {#each row as cell, i}
                  <td
                    class="px-1 {selectedColumn === i ? 'bg-blue-200' : ''} text-{headHeader[i]
                      .type === 'numerical'
                      ? 'right'
                      : 'left'}">{clearStringQuotes(cell)}</td
                  >
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    <div class="w-full flex justify-center">
      <Button class="w-1/2" on:click={importDataset}>Import Dataset</Button>
    </div>
  </form>
</Modal>

<style>
  table,
  th,
  td {
    border: 1px solid black;
    font-size: 0.9em;
  }

  .scrollable-div {
    scrollbar-width: thin;
    overflow-x: auto !important;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 12px;
  }
</style>
