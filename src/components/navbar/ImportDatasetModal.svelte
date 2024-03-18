<script lang="ts">
  import { Button, Modal, Label, Input, Fileupload, Helper } from 'flowbite-svelte';
  import { extent, max } from 'd3-array';
  import { autoType, csvParse, type DSVParsedArray } from 'd3-dsv';
  import { datasetStore, labelDimension, dimensionDataStore } from '../../stores/dataset';
  import { parcoordIsInteractable } from '../../stores/parcoord';
  import type { DimensionDataType } from '../../util/types';

  export let isOpen: boolean;

  const HEADER_ROW_NO = 10;

  $: if (!isOpen) {
    $parcoordIsInteractable = true;
  }

  let files: FileList;
  let headHeader = '';
  let headRows: string[] = [];
  let validUpload = true;
  let separator = ',';

  $: if (files?.length > 0) {
    readHead(files[0]);
  }

  async function readHead(file: File) {
    const reader = file.stream().getReader();
    headRows = [];
    headHeader = '';
    let decoder = new TextDecoder();
    let { value: chunk, done } = await reader.read();
    let textChunk = decoder.decode(chunk, { stream: true });
    let startIndex = 0;

    while (!done && headRows.length < HEADER_ROW_NO + 1) {
      let endIndex = textChunk.indexOf('\n', startIndex);
      if (endIndex === -1) {
        ({ value: chunk, done } = await reader.read());
        textChunk += decoder.decode(chunk, { stream: !done });
        continue;
      }

      if (startIndex === 0) headHeader = textChunk.substring(startIndex, endIndex);
      else headRows.push(textChunk.substring(startIndex, endIndex));
      startIndex = endIndex + 1;

      if (headRows.length === HEADER_ROW_NO + 1) break;
    }

    console.log(headHeader);
    console.log(headRows);
  }

  async function importDataset() {
    if (files?.length === 0) return;

    const file = files[0];
    let text = await file.text();
    if (separator !== ',') text = text.replace(new RegExp(separator, 'g'), ',');
    let dataset: DSVParsedArray<any> = csvParse(text, autoType);

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

    validUpload = true;
    isOpen = false;
  }

  // Helper function that returns whether item is a number
  function isNumber(item: any) {
    if (typeof item === 'number') return true;
    if (typeof item === 'string') return !isNaN(+item);
    return false;
  }
</script>

<Modal bind:open={isOpen} size="xs" class="w-full">
  <form class="flex flex-col space-y-6">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Import Dataset</h3>
    <div class="mb-6 flex items-center">
      <Label for="upload-input" class="w-1/5">Upload File:</Label>
      <Fileupload bind:files id="upload-input" class="block ml-2 w-3/4" accept=".csv" />
    </div>
    <div class="mb-6 flex items-center">
      <Label for="separator-input" class="w-1/5">Cell Separator:</Label>
      <Input
        id="separator-input"
        defaultClass="block ml-2 w-1/5"
        size="sm"
        bind:value={separator}
      />
    </div>
    {#if !validUpload}
      <Helper color="red"><span class="font-medium">Upload valid CSV file.</span></Helper>
    {/if}
    <div class="bg-red-100 w-full scrollable-div">
      <table id="dataset-header" class="w-full">
        <thead style="font-size: 14px;">
          <tr>
            {#each headHeader.split(separator) as header}
              <th>{header}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each headRows as row}
            <tr class="text-black px-1" style="font-size: 12px;">
              {#each row.split(separator) as cell}
                <td>{cell}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <Button type="submit" class="w-full" on:click={importDataset}>Import Dataset</Button>
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
    border-top: 1px solid black;
    scrollbar-width: thin;
    overflow-x: auto !important;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 12px;
  }
</style>
