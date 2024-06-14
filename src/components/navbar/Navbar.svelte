<script lang="ts">
  import { Navbar, NavLi, NavUl, Dropdown, DropdownItem, Chevron, Checkbox } from 'flowbite-svelte';
  import ExampleDatasets from './dataset/ExampleDatasets.svelte';
  import ImportDatasetModal from './dataset/ImportDatasetModal.svelte';
  import ExportDatasetModal from './dataset/ExportDatasetModal.svelte';
  import { isInteractableStore } from '../../stores/brushing';
  import { datasetStore } from '../../stores/dataset';
  import { partitionsStore } from '../../stores/partitions';
  import { activeViewsStore } from '../../stores/views';
  import type { View } from '../views/ViewType';

  let views: View[];
  activeViewsStore.subscribe((value) => {
    views = value;
  });

  let isFileDropdownOpen = false;
  let isSettingsDropdownOpen = false;
  let isImportDatasetModalOpen = false;
  let isExportDatasetModalOpen = false;

  function toggleViewVisibility(i: number) {
    views[i].visible = !views[i].visible;
    activeViewsStore.set(views);
  }

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

  function openFileDropdown() {
    isFileDropdownOpen = true;
  }

  function closeFileDropdown() {
    isFileDropdownOpen = false;
  }

  function openSettingsDropdown() {
    isSettingsDropdownOpen = true;
  }

  function closeSettingsDropdown() {
    isSettingsDropdownOpen = false;
  }

  function clearDataset() {
    localStorage.clear();
    datasetStore.set([]);
    partitionsStore.set(new Map());
    closeSettingsDropdown();
  }

  function refresh() {
    location.reload();
  }
</script>

<ImportDatasetModal isOpen={isImportDatasetModalOpen} />
<ExportDatasetModal isOpen={isExportDatasetModalOpen} />

<div class="h-[4%]">
  <Navbar let:hidden class="bg-sky-900 h-full p-0 flex-row cursor-pointer" navDivClass="h-full">
    <NavUl
      {hidden}
      ulClass="h-full flex flex-row p-0 m-0 md:space-x-8 md:mt-0 md:text-sm md:font-medium items-center"
      class="h-full"
    >
      <NavLi id="nav-file" on:click={openFileDropdown} class="cursor-pointer">
        <span class="text-white hover:text-blue-200"><Chevron aligned>File</Chevron></span>
      </NavLi>
      <Dropdown bind:open={isFileDropdownOpen} class="w-44 z-20">
        <ExampleDatasets {closeFileDropdown} />
        <DropdownItem on:click={openImportModal}>Import Dataset...</DropdownItem>
        <DropdownItem on:click={openExportModal}>Export Dataset...</DropdownItem>
      </Dropdown>
      <NavLi id="nav-views" class="cursor-pointer">
        <span class="text-white hover:text-blue-200"><Chevron aligned>Views</Chevron></span>
      </NavLi>
      <Dropdown triggeredBy="#nav-views" class="w-44 z-20">
        {#each views as view, i}
          <li
            class="font-medium py-2 px-4 text-sm hover:bg-gray-100 w-full text-left flex items-center justify-between"
          >
            <Checkbox checked={view.visible} on:change={() => toggleViewVisibility(i)}>{view.title}</Checkbox>
          </li>
        {/each}
      </Dropdown>
      <NavLi id="nav-settings" on:click={openSettingsDropdown}>
        <span class="text-white hover:text-blue-200"><Chevron aligned>Settings</Chevron></span>
      </NavLi>
      <Dropdown bind:open={isSettingsDropdownOpen} class="w-44 z-20">
        <DropdownItem on:click={clearDataset}>Clear Dataset</DropdownItem>
        <DropdownItem on:click={refresh}>Refresh Page</DropdownItem>
      </Dropdown>
      <NavLi>
        <span class="text-white hover:text-blue-200">Help</span>
      </NavLi>
    </NavUl>
  </Navbar>
</div>
