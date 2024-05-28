<script lang="ts">
  import { ChevronRight, DropdownItem, Dropdown, Spinner } from 'flowbite-svelte';
  import { EXAMPLE_DATASETS, getCsvFromUrl, parseDataset } from './datasetUtil';
  import { tableVisibleDimensionsStore } from '../../../stores/table';
  import { datasetStore, dimensionDataStore, labelDimension } from '../../../stores/dataset';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';
  import { parcoordVisibleDimensionsStore } from '../../../stores/parcoord';

  export let closeFileDropdown: () => void;

  let isLoading = false;
  let loadingIndex: number | null = null;

  async function importDataset(url: string, i: number) {
    try {
      isLoading = true;
      loadingIndex = i;
      const datasetText = await getCsvFromUrl(url);
      const { dataset, shownDimensions, dimensionTypeMap, labelDim, partitionsMap, partitionsData } =
        await parseDataset(datasetText, ',', '.');

      tableVisibleDimensionsStore.set(shownDimensions);
      parcoordVisibleDimensionsStore.set(shownDimensions);
      dimensionDataStore.set(dimensionTypeMap);
      datasetStore.set(dataset);
      labelDimension.set(labelDim);
      partitionsStore.set(partitionsMap);
      partitionsDataStore.set(partitionsData);
    } catch (error: any) {
      throw new Error('Error fetching example dataset');
    } finally {
      isLoading = false;
      loadingIndex = null;
      closeFileDropdown();
    }
  }
</script>

<DropdownItem class="flex items-center justify-between">
  Example Datasets<ChevronRight class="w-3 h-3 ms-2" />
</DropdownItem>
<Dropdown placement="right-start" class="w-40">
  {#each EXAMPLE_DATASETS as dataset, i}
    <DropdownItem on:click={() => importDataset(dataset.url, i)} class="flex justify-between items-center"
      >{dataset.title}
      {#if isLoading && loadingIndex === i}<Spinner size="4" />{/if}</DropdownItem
    >
  {/each}
</Dropdown>
