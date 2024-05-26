<script lang="ts">
  import { Navbar, NavLi, NavUl, Dropdown, DropdownItem, Chevron, ChevronRight } from 'flowbite-svelte';
  import ExampleDatasets from './dataset/ExampleDatasets.svelte';
  import ImportDatasetModal from './dataset/ImportDatasetModal.svelte';
  import ExportDatasetModal from './dataset/ExportDatasetModal.svelte';
  import { isInteractableStore } from '../../stores/brushing';
  import { datasetStore } from '../../stores/dataset';
  import { partitionsStore } from '../../stores/partitions';

  let isFileDropdownOpen = false;
  let isImportDatasetModalOpen = false;
  let isExportDatasetModalOpen = false;

  function openImportModal() {
    isImportDatasetModalOpen = false;
    isImportDatasetModalOpen = true;
    $isInteractableStore = false;
  }

  function openExportModal() {
    isExportDatasetModalOpen = false;
    isExportDatasetModalOpen = true;
    $isInteractableStore = false;
  }

  function closeFileDropdown() {
    isFileDropdownOpen = false;
  }

  function clearDataset() {
    localStorage.clear();
    datasetStore.set([]);
    partitionsStore.set(new Map());
  }
</script>

<ImportDatasetModal isOpen={isImportDatasetModalOpen} />
<ExportDatasetModal isOpen={isExportDatasetModalOpen} />

<div style="height: 4.5%;">
  <Navbar let:hidden class="bg-sky-900 h-full p-0 flex-row" navDivClass="h-full">
    <NavUl
      {hidden}
      ulClass="h-full flex flex-row p-0 m-0 md:space-x-8 md:mt-0 md:text-sm md:font-medium items-center"
      class="h-full"
    >
      <NavLi id="nav-file" on:click={() => (isFileDropdownOpen = true)} class="cursor-pointer">
        <span class="text-white hover:text-blue-200"><Chevron aligned>File</Chevron></span>
      </NavLi>
      <Dropdown triggeredBy="#nav-file" bind:open={isFileDropdownOpen} class="w-44 z-20">
        <ExampleDatasets {closeFileDropdown} />
        <DropdownItem on:click={openImportModal}>Import Dataset...</DropdownItem>
        <DropdownItem on:click={openExportModal}>Export Dataset...</DropdownItem>
      </Dropdown>
      <NavLi id="nav-settings" href="#">
        <span class="text-white hover:text-blue-200"><Chevron aligned>Settings</Chevron></span>
      </NavLi>
      <Dropdown triggeredBy="#nav-settings" class="w-44 z-20">
        <DropdownItem on:click={clearDataset}>Clear Dataset</DropdownItem>
      </Dropdown>
      <NavLi href="#">
        <span class="text-white hover:text-blue-200">Help</span>
      </NavLi>
    </NavUl>
  </Navbar>
</div>
