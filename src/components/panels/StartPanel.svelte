<script lang="ts">
  import { Button, Chevron, Dropdown, DropdownItem, Spinner, Helper } from 'flowbite-svelte';
  import ImportDatasetModal from '../navbar/dataset/ImportDatasetModal.svelte';
  import { EXAMPLE_DATASETS, getCsvFromUrl, parseDataset } from '../../components/navbar/dataset/datasetUtil';
  import { datasetStore, dimensionDataStore, invalidRowsStore, labelDimension } from '../../stores/dataset';
  import { tableVisibleDimensionsStore } from '../../stores/table';
  import { parcoordVisibleDimensionsStore } from '../../stores/parcoord';
  import { partitionsDataStore, partitionsStore } from '../../stores/partitions';

  let isLoading = false;
  let loadingIndex: number | null = null;
  let isExampleDatasetsOpen: boolean = false;
  let isImportDatasetModalOpen = false;

  function openImportModal() {
    isImportDatasetModalOpen = false;
    isImportDatasetModalOpen = true;
  }

  function closeExampleDatasets() {
    isExampleDatasetsOpen = false;
  }

  async function importExampleDataset(url: string, i: number) {
    try {
      isLoading = true;
      loadingIndex = i;
      const datasetText = await getCsvFromUrl(url);
      const { dataset, shownDimensions, dimensionTypeMap, labelDim, partitionsMap, partitionsData, invalidRows } =
        await parseDataset(datasetText, 'csv', ',', '.');

      tableVisibleDimensionsStore.set(shownDimensions);
      parcoordVisibleDimensionsStore.set(shownDimensions);
      dimensionDataStore.set(dimensionTypeMap);
      datasetStore.set(dataset);
      labelDimension.set(labelDim);
      partitionsStore.set(partitionsMap);
      partitionsDataStore.set(partitionsData);
      invalidRowsStore.set(invalidRows);

      localStorage.setItem(
        'datasetDescription',
        `${url.split('/').pop()} (${dataset.length} records with ${dimensionTypeMap.size} dimensions)`
      );
    } catch (error: any) {
      throw new Error('Error fetching example dataset');
    } finally {
      isLoading = false;
      loadingIndex = null;
      closeExampleDatasets();
    }
  }

  function importPreviousDataset() {
    const localDataset = localStorage.getItem('MVA_dataset');
    localDataset && datasetStore.set(JSON.parse(localDataset));

    const labelDim = localStorage.getItem('labelDimension');
    labelDim && labelDimension.set(labelDim);

    const dimensionTypes = localStorage.getItem('dimensionTypes');
    dimensionTypes && dimensionDataStore.set(new Map(JSON.parse(dimensionTypes)));

    const tableVisibleDimensions = localStorage.getItem('tableVisibleDimensions');
    tableVisibleDimensions && tableVisibleDimensionsStore.set(JSON.parse(tableVisibleDimensions));

    const parcoordVisibleDimensions = localStorage.getItem('parcoordVisibleDimensions');
    parcoordVisibleDimensions && parcoordVisibleDimensionsStore.set(JSON.parse(parcoordVisibleDimensions));

    const partitions = localStorage.getItem('partitions');
    partitions && partitionsStore.set(new Map(JSON.parse(partitions)));

    const partitionsData = localStorage.getItem('partitionsData');
    partitionsData && partitionsDataStore.set(JSON.parse(partitionsData));

    const invalidRows = localStorage.getItem('invalidRows');
    invalidRows && invalidRowsStore.set(JSON.parse(invalidRows));
  }
</script>

<div class="mt-16 flex flex-col gap-2 items-center justify-center">
  <span class="text-base font-semibold">Import a Dataset</span>
  {#if localStorage.getItem('MVA_dataset')}
    <div class="flex w-full">
      <div class="flex flex-col flex-grow justify-start items-end p-2">
        <Button class="focus:ring-transparent">Example Datasets <Chevron aligned /></Button>
        <Dropdown bind:open={isExampleDatasetsOpen}>
          {#each EXAMPLE_DATASETS as dataset, i}
            <DropdownItem
              on:click={() => importExampleDataset(dataset.url, i)}
              class="flex justify-between items-center"
              >{dataset.title}
              {#if isLoading && loadingIndex === i}<Spinner size="4" />{/if}</DropdownItem
            >
          {/each}
        </Dropdown>
        <Helper class="invisible">{localStorage.getItem('datasetDescription')}</Helper>
      </div>
      <div class="flex flex-none items-start p-2">
        <Button class="focus:ring-transparent" on:click={openImportModal}>Import Custom</Button>
      </div>
      <div class="flex flex-col flex-grow p-2">
        <div class="flex-shrink-0">
          <Button class="focus:ring-transparent" on:click={importPreviousDataset}>Import Previous</Button>
          <Helper class="mt-2">{localStorage.getItem('datasetDescription')}</Helper>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center w-full">
      <div class="p-2">
        <Button class="focus:ring-transparent">Example Datasets <Chevron aligned /></Button>
        <Dropdown bind:open={isExampleDatasetsOpen}>
          {#each EXAMPLE_DATASETS as dataset, i}
            <DropdownItem
              on:click={() => importExampleDataset(dataset.url, i)}
              class="flex justify-between items-center"
              >{dataset.title}
              {#if isLoading && loadingIndex === i}<Spinner size="4" />{/if}</DropdownItem
            >
          {/each}
        </Dropdown>
      </div>
      <div class="p-2">
        <Button class="focus:ring-transparent" on:click={openImportModal}>Import Custom</Button>
      </div>
    </div>
  {/if}
</div>

<ImportDatasetModal isOpen={isImportDatasetModalOpen} />
