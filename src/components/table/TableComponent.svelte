<script lang="ts">
  import { onDestroy } from 'svelte';
  import { ChevronDown, ChevronUp } from 'flowbite-svelte';
  import { datasetStore, dimensionDataStore } from '../../stores/dataset';
  import { linkingArray } from '../../stores/linking';
  import { brushedArray, hoveredArray, isInteractableStore } from '../../stores/brushing';
  import { tableVisibleDimensionsStore } from '../../stores/table';
  import { partitionsStore, partitionsDataStore } from '../../stores/partitions';
  import ContextMenuPartitions from '../partitions/ContextMenu.svelte';
  import ContextMenu from './ContextMenu.svelte';
  import Tooltip from '../tooltip/Tooltip.svelte';
  import { getLongestString, getTextWidth } from '../../util/text';
  import { ascending, descending } from 'd3-array';
  import type { DSVParsedArray } from 'd3-dsv';
  import type { DimensionDataType, TooltipType } from '../../util/types';
  import type { TableVisibleDimensionsType } from './types';
  import type { RgbaColor } from 'svelte-awesome-color-picker';
  import type { PartitionType } from '../partitions/types';

  let contextMenu: ContextMenu;
  let contextMenuPartitions: ContextMenuPartitions;

  let width: number, height: number;
  let rowShow: boolean[] = [];
  let hoveredLineIndex: number | null = null;
  let hoveredRowsIndices: Set<number> = new Set();
  let brushedRowsIndices: Set<number> = new Set();
  let rangeStart: number | null = null; // Selection range
  let sorting: { dim: string | null; direction: 'ASC' | 'DESC' };

  let tooltip: TooltipType = {
    visible: false,
    clientX: 0,
    clientY: 0,
    text: []
  };

  let dataset: DSVParsedArray<any>;

  let tableVisibleDimensions: TableVisibleDimensionsType[] = [];
  const unsubscribeTableVisibleDimensions = tableVisibleDimensionsStore.subscribe((value) => {
    tableVisibleDimensions = value;
  });

  let partitionsData: string[] = [];
  const unsubscribePartitionsData = partitionsDataStore.subscribe((value) => {
    partitionsData = value;
    dataset?.map((row, i) => (row._partition = partitionsData[i]));
  });

  let partitions: Map<string, PartitionType> = new Map();
  let longestPartition = '';
  const unsubscribePartitions = partitionsStore.subscribe((value) => {
    partitions = value;
    longestPartition = getLongestString([...partitions].filter(([_, value]) => value.size > 0).map(([key, _]) => key));
  });

  const unsubscribeDataset = datasetStore.subscribe((value) => {
    dataset = value as DSVParsedArray<any>;
    if (dataset?.length > 0) {
      dataset = dataset.map((item, i) => {
        return {
          _i: i,
          _partition: partitionsData[i],
          ...item
        };
      }) as DSVParsedArray<any>;

      tableVisibleDimensions?.unshift({ title: '_partition', visible: true });
      tableVisibleDimensions?.unshift({ title: '_i', visible: true });

      sorting = { dim: '_i', direction: 'ASC' };
    }
  });

  const unsubscribeLinking = linkingArray.subscribe((value) => {
    if (dataset?.length > 0) {
      rowShow = value;
    }
  });

  const unsubscribeBrushing = brushedArray.subscribe((value) => {
    if (dataset?.length > 0) brushedRowsIndices = value;
  });

  const unsubscribeHovered = hoveredArray.subscribe((value) => {
    hoveredRowsIndices = value;
  });

  function handleRowClick(event: MouseEvent, index: number, _i: number) {
    if (!rowShow[_i]) return;
    if (hoveredLineIndex === null) return;

    if (event.ctrlKey) {
      // Toggle the selection of individual items with Ctrl key
      if (brushedRowsIndices.has(hoveredLineIndex)) {
        brushedRowsIndices.delete(hoveredLineIndex);
      } else {
        brushedRowsIndices.add(hoveredLineIndex);
      }
    } else if (event.shiftKey) {
      // Select a range of items with Shift key
      if (rangeStart !== null) {
        const tempStart = Math.min(rangeStart, index);
        const tempEnd = Math.max(rangeStart, index);
        brushedRowsIndices.clear();
        for (let i = tempStart; i <= tempEnd; i++) {
          brushedRowsIndices.add(dataset[i]._i);
        }
      } else {
        brushedRowsIndices.clear();
        brushedRowsIndices.add(hoveredLineIndex);
        rangeStart = index;
      }
    } else {
      // Select a single item without Ctrl or Shift
      if (brushedRowsIndices.size === 1 && brushedRowsIndices.has(hoveredLineIndex)) brushedRowsIndices.clear();
      else {
        brushedRowsIndices.clear();
        brushedRowsIndices.add(hoveredLineIndex);
        rangeStart = index;
      }
    }

    brushedArray.set(brushedRowsIndices);
    window.getSelection()?.removeAllRanges(); // Remove selection from text
  }

  function handleMouseEnter(index: number) {
    if (!rowShow[index] || !$isInteractableStore) return;
    hoveredLineIndex = index;
    hoveredArray.set(new Set([hoveredLineIndex]));
  }

  function handleMouseLeave(index: number) {
    if (!rowShow[index]) return;
    hoveredArray.set(new Set());
    hoveredLineIndex = null;
    hoveredRowsIndices.clear();
  }

  function sortDataset(dim: string) {
    if (sorting.dim === dim) sorting.direction = sorting.direction === 'ASC' ? 'DESC' : 'ASC';
    else sorting.direction = 'ASC';
    sorting.dim = dim;

    dataset = dataset.sort((a, b) => {
      return sorting.direction === 'ASC' ? ascending(a[dim], b[dim]) : descending(a[dim], b[dim]);
    });
  }

  function showTooltip(e: MouseEvent, dim: string) {
    if (!$isInteractableStore) return;
    tooltip = {
      visible: true,
      clientX: e.clientX,
      clientY: e.clientY,
      text: [dim]
    };
  }

  function hideTooltip() {
    tooltip = {
      visible: false,
      clientX: 0,
      clientY: 0,
      text: []
    };
  }

  function formatCell(value: string, dimIndex: number) {
    const dimData = $dimensionDataStore.get(tableVisibleDimensions[dimIndex].title);
    if (!dimData || dimData.type === 'categorical') return value;
    return parseFloat(value).toFixed(dimData.numberOfDecimals ?? undefined);
  }

  function getHeaderLength(title: string, longestPartition: string) {
    if (title === '_i') return (dataset.length - 1).toString();
    else if (title === '_partition') {
      return longestPartition;
    } else return $dimensionDataStore.get(title)?.longestString ?? '';
  }

  function getHeaderClass(dimData?: DimensionDataType) {
    return `text-${dimData === undefined || dimData.active ? 'black' : 'gray-400'}`;
  }

  function getCellClass(dimTitle: string, rowShow: boolean, dimData?: DimensionDataType) {
    return `px-1 text-${dimData?.type === 'numerical' || dimTitle === '_i' ? 'right' : 'left'} text-${
      (dimTitle === '_i' || dimTitle === '_partition' || dimData?.active) && rowShow ? 'black' : 'gray-400'
    }`;
  }

  function getPartitionColor(title: string, color?: RgbaColor) {
    return title === '_partition' ? `background-color: rgba(${color?.r}, ${color?.g}, ${color?.b}, 0.25)` : '';
  }

  onDestroy(() => {
    unsubscribeDataset();
    unsubscribeLinking();
    unsubscribeBrushing();
    unsubscribeHovered();
    unsubscribeTableVisibleDimensions();
    unsubscribePartitionsData();
    unsubscribePartitions();
  });
</script>

<ContextMenu bind:this={contextMenu} />
<ContextMenuPartitions bind:this={contextMenuPartitions} />

{#if dataset?.length > 0 && rowShow?.length > 0}
  <div class="w-full h-full" bind:clientWidth={width} bind:clientHeight={height}>
    <div class="w-full scrollable-div" style="height: {height - 20}px;">
      <table id="table-canvas" class="w-full table-fixed border-separate border-spacing-0">
        <thead style="font-size: 14px;">
          <tr class="bg-gray-100 select-none whitespace-nowrap px-1 hover:bg-gray-200 hover:cursor-pointer">
            {#each tableVisibleDimensions as dim}
              {#if dim.visible}
                <th
                  on:click={() => sortDataset(dim.title)}
                  on:mouseenter={(e) => showTooltip(e, dim.title)}
                  on:mouseleave={hideTooltip}
                  on:contextmenu={(e) => contextMenu.showContextMenu(e, dim.title)}
                  class={getHeaderClass($dimensionDataStore.get(dim.title))}
                  style="font-size: 12px; overflow: hidden; width: {getTextWidth(
                    getHeaderLength(dim.title, longestPartition),
                    12,
                    'sans-serif'
                  ) + 8}px;"
                >
                  <div
                    class="flex flex-col text-{$dimensionDataStore.get(dim.title)?.type === 'numerical' ||
                    dim.title === '_i'
                      ? 'right'
                      : 'left'}"
                  >
                    {#if dim.title === sorting.dim}
                      {#if sorting.direction === 'ASC'}
                        <ChevronDown class="self-center" size="8" />
                      {:else}
                        <ChevronUp class="self-center" size="8" />
                      {/if}
                    {:else}
                      <ChevronUp class="self-center invisible" size="8" />
                    {/if}
                    <span>{dim.title}</span>
                  </div></th
                >
              {/if}
            {/each}
          </tr>
        </thead>
        <tbody on:contextmenu={contextMenuPartitions.showContextMenu}>
          {#each dataset as row, index}
            <tr
              class={hoveredLineIndex === row._i || hoveredRowsIndices.has(row._i)
                ? 'bg-red-500'
                : brushedRowsIndices.has(row._i) && rowShow[row._i]
                ? 'bg-orange-400'
                : ''}
              on:mouseenter={() => handleMouseEnter(row._i)}
              on:mouseleave={() => handleMouseLeave(row._i)}
              on:click={(e) => handleRowClick(e, index, row._i)}
            >
              {#each tableVisibleDimensions as dim, i}
                {#if dim.visible}
                  <td
                    class={getCellClass(dim.title, rowShow[row._i], $dimensionDataStore.get(dim.title))}
                    style="font-size: 12px; {getPartitionColor(
                      dim.title,
                      partitions.get(partitionsData[row._i])?.color
                    )}">{dim.title === '_partition' ? partitionsData[row._i] : formatCell(row[dim.title], i)}</td
                  >
                {/if}
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="flex items-center" style="font-size: 12px;">
      {dataset.length} records | {brushedRowsIndices.size} selected |
    </div>
  </div>
{:else}
  <div class="w-full h-full"><span>No data available.</span></div>
{/if}

<Tooltip data={tooltip} color="bg-gray-300" />

<style>
  table,
  th,
  td {
    font-size: 0.9em;
  }

  table th {
    border-top: 1px solid black;
  }

  table td,
  table th {
    border-bottom: 1px solid black;
    border-right: 1px solid black;
  }

  table th:first-child,
  table td:first-child {
    border-left: 1px solid black;
  }

  thead {
    position: sticky;
    border: 2px solid black;
    top: 0;
  }

  .scrollable-div {
    scrollbar-width: thin;
    overflow-x: auto !important;
  }

  .scrollable-div::-webkit-scrollbar {
    height: 12px;
  }
</style>
