<script lang="ts">
  import { ChevronRight, DropdownItem, Dropdown, Spinner } from 'flowbite-svelte';
  import { getCsvFromUrl, parseDataset } from './datasetUtil';
  import { tableVisibleDimensionsStore } from '../../../stores/table';
  import { datasetStore, dimensionDataStore, labelDimension } from '../../../stores/dataset';
  import { partitionsDataStore, partitionsStore } from '../../../stores/partitions';
  import { parcoordVisibleDimensionsStore } from '../../../stores/parcoord';

  export let closeFileDropdown: () => void;

  let isLoading = false;

  async function importDataset() {
    try {
      isLoading = true;
      const datasetText = await getCsvFromUrl(
        'https://raw.githubusercontent.com/tugraz-isds/mva/main/example-datasets/iris.csv'
      );
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
      closeFileDropdown();
    }
  }
</script>

<DropdownItem class="flex items-center justify-between">
  Example Datasets<ChevronRight class="w-3 h-3 ms-2" />
</DropdownItem>
<Dropdown placement="right-start" class="w-24">
  <DropdownItem on:click={importDataset} class="flex justify-between items-center"
    >Iris
    {#if isLoading}<Spinner size="4" />{/if}</DropdownItem
  >
</Dropdown>
