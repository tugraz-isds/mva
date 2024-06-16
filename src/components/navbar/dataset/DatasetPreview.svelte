<script lang="ts">
  import { Select } from 'flowbite-svelte';
  import { COLUMN_TYPE_LIST } from './datasetUtil';
  import { clearStringQuotes } from '../../../util/text';
  import { isInternalDimension } from '../../../util/util';
  import type { DimensionType } from '../../../util/types';

  export let previewHeader: { title: string; type: DimensionType | null }[];
  export let previewRows: string[][];
</script>

<div class="w-full scrollable-div">
  <table id="dataset-header" class="w-full">
    <thead style="font-size: 14px;">
      {#each previewHeader as header}
        <th class="px-1 text-{header.type === 'numerical' ? 'right' : 'left'}">
          {#if isInternalDimension(header.title)}
            <Select
              class="w-20 h-full text-[12px] rounded m-0 flex items-center justify-center overflow-hidden leading-4 z-10 text-ellipsis p-0 pl-2"
              style="padding-right: 1.5rem !important;"
              size="sm"
              disabled
              placeholder="Internal"
            />
          {:else}
            <Select
              class="w-full max-w-28 h-full text-[12px] rounded m-0 flex items-center justify-center overflow-hidden leading-4 z-10 text-ellipsis p-0 pl-2"
              style="padding-right: 1.5rem !important;"
              size="sm"
              items={COLUMN_TYPE_LIST}
              bind:value={header.type}
              placeholder=""
            />
          {/if}
        </th>
      {/each}
      <tr class="bg-gray-100 select-none hover:cursor-pointer">
        {#each previewHeader as header}
          <th class="px-1 hover:bg-gray-200'} text-{header.type === 'numerical' ? 'right' : 'left'}"
            >{clearStringQuotes(header.title)}</th
          >
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each previewRows as row}
        <tr class="text-black" style="font-size: 12px;">
          {#each row as cell, i}
            <td class="px-1 text-{previewHeader[i].type === 'numerical' ? 'right' : 'left'}"
              >{clearStringQuotes(cell)}</td
            >
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

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
