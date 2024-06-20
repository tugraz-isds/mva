<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Navbar, NavLi, NavUl, Dropdown, DropdownItem, Chevron, Checkbox, Toast, Button } from 'flowbite-svelte';
  import { CheckCircleSolid, ExclamationCircleSolid } from 'flowbite-svelte-icons';
  import ExampleDatasets from './dataset/ExampleDatasets.svelte';
  import ImportDatasetModal from './dataset/ImportDatasetModal.svelte';
  import ExportDatasetModal from './dataset/ExportDatasetModal.svelte';
  import InvalidRows from './dataset/InvalidRows.svelte';
  import { isInteractableStore } from '../../stores/brushing';
  import { datasetStore, invalidRowsStore } from '../../stores/dataset';
  import { partitionsStore } from '../../stores/partitions';
  import { activeViewsStore } from '../../stores/views';
  import type { View } from '../views/ViewType';

  let isFileDropdownOpen = false;
  let isSettingsDropdownOpen = false;
  let isImportDatasetModalOpen = false;
  let isExportDatasetModalOpen = false;
  let isInvalidRowsModalOpen = false;

  let showSuccessToast = false;
  let showWarningToast = false;
  let isMounted = false;

  let views: View[];
  activeViewsStore.subscribe((value) => {
    views = value;
  });

  let invalidRowsCount = 0;
  const unsubscribeInvalidRows = invalidRowsStore.subscribe((value) => {
    invalidRowsCount = value.length;

    if (!isMounted) return;

    if (invalidRowsCount === 0) {
      showSuccessToast = true;
      setTimeout(() => (showSuccessToast = false), 3000);
    } else {
      showWarningToast = true;
      setTimeout(() => (showWarningToast = false), 3000);
    }
  });

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

  function openInvalidRowsModal() {
    showWarningToast = false;
    isInvalidRowsModalOpen = false;
    isInvalidRowsModalOpen = true;
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

  onMount(() => {
    isMounted = true;
  });

  onDestroy(() => {
    unsubscribeInvalidRows();
  });
</script>

<ImportDatasetModal isOpen={isImportDatasetModalOpen} />
<ExportDatasetModal isOpen={isExportDatasetModalOpen} />
<InvalidRows isOpen={isInvalidRowsModalOpen} />

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
        {#if invalidRowsCount !== 0}
          <DropdownItem on:click={openInvalidRowsModal}>View Invalid Rows...</DropdownItem>
        {/if}
        <DropdownItem on:click={clearDataset}>Clear Dataset</DropdownItem>
        <DropdownItem on:click={refresh}>Refresh Page</DropdownItem>
      </Dropdown>
      <NavLi>
        <span class="text-white hover:text-blue-200">Help</span>
      </NavLi>
    </NavUl>
  </Navbar>
</div>

<Toast color="green" bind:open={showSuccessToast} class="absolute top-1 left-1/2 transform translate-x-[-50%] z-50">
  <svelte:fragment slot="icon">
    <CheckCircleSolid class="w-5 h-5" />
  </svelte:fragment>
  Dataset imported successfully.
</Toast>

<Toast color="orange" bind:open={showWarningToast} class="absolute top-1 left-1/2 transform translate-x-[-50%] z-50">
  <svelte:fragment slot="icon">
    <ExclamationCircleSolid class="w-5 h-5" />
  </svelte:fragment>
  <div class="flex">
    <div>Dataset imported with <b>{invalidRowsCount}</b> invalid rows.</div>
    <Button size="xs" class="ml-4" on:click={openInvalidRowsModal}>View</Button>
  </div>
</Toast>
