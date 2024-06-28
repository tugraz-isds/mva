<script lang="ts">
  import { dimensionDataStore, invalidRowsStore } from '../../../stores/dataset';
  import { clearStringQuotes } from '../../../util/text';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { DimensionDataType } from '../../../util/types';
  import { onDestroy } from 'svelte';
  import { Modal } from 'flowbite-svelte';

  export let isOpen: boolean;

  let dimensionData: Map<string, DimensionDataType> = new Map();
  const unsubscribeDimensionData = dimensionDataStore.subscribe((value) => {
    dimensionData = value;
  });

  let invalidRows: DSVParsedArray<any>;
  let dimensions: string[];
  const unsubscribeInvalidRows = invalidRowsStore.subscribe((value) => {
    invalidRows = value as DSVParsedArray<any>;
    if (invalidRows.length !== 0) dimensions = Object.keys(invalidRows[0]);
  });

  onDestroy(() => {
    unsubscribeDimensionData();
    unsubscribeInvalidRows();
  });
</script>

<Modal bind:open={isOpen} size="xl">
  <div class="w-full scrollable-div">
    <h3 class="mb-4 text-xl font-medium text-gray-900">Invalid Rows</h3>
    <table id="invalid-rows" class="w-full">
      <thead class="text-sm">
        <tr class="bg-gray-100 select-none hover:cursor-pointer">
          {#each [...dimensionData] as [dim, dimData]}
            <th class="px-1 hover:bg-gray-200'} text-{dimData.type === 'numerical' ? 'right' : 'left'}"
              >{clearStringQuotes(dim)}</th
            >
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each invalidRows as row}
          <tr class="text-xs text-black">
            {#each dimensions as dim, i}
              <td
                class="px-1 text-{dimensionData.get(dimensions[i])?.type === 'numerical' ? 'right' : 'left'} {row[
                  dim
                ] === null
                  ? 'bg-red-100'
                  : ''}">{row[dim]}</td
              >
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
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
    height: 0.75rem;
  }
</style>
