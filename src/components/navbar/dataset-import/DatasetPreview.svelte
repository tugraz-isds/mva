<script lang="ts">
  import ContextMenu from './ContextMenu.svelte';
  import { capitalizeString, clearStringQuotes } from '../../../util/text';
  import type { DimensionType } from '../../../util/types';

  export let selectedColumn: number | null;
  export let previewHeader: { title: string; type: DimensionType | null }[];
  export let previewRows: string[][];
  export let changeColumnType: (idx: number | null, newColumnType: DimensionType | null) => void;
  export let selectColumn: (i: number, calledFrom: 'click' | 'contextMenu') => void;

  let contextMenu: ContextMenu;
</script>

<ContextMenu bind:this={contextMenu} {changeColumnType} />

<div class="w-full scrollable-div">
  <table id="dataset-header" class="w-full">
    <thead style="font-size: 14px;">
      <tr class="bg-gray-100 select-none hover:cursor-pointer">
        {#each previewHeader as header, i}
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
      {#each previewHeader as header, i}
        <th class="px-1 {selectedColumn === i ? 'bg-blue-200' : ''}"
          >{capitalizeString(header.type ?? '')}</th
        >
      {/each}
      {#each previewRows as row}
        <tr class="text-black" style="font-size: 12px;">
          {#each row as cell, i}
            <td
              class="px-1 {selectedColumn === i ? 'bg-blue-200' : ''} text-{previewHeader[i]
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
