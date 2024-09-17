<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { Navbar, NavLi, NavUl, Dropdown, DropdownItem, Chevron, Checkbox, Toast, Button } from 'flowbite-svelte';
  import { CheckCircleSolid, ExclamationCircleSolid } from 'flowbite-svelte-icons';
  import ExampleDatasets from './dataset/ExampleDatasets.svelte';
  import ImportDatasetModal from './dataset/ImportDatasetModal.svelte';
  import ExportDatasetModal from './dataset/ExportDatasetModal.svelte';
  import InvalidRows from './dataset/InvalidRows.svelte';
  import AboutModal from './AboutModal.svelte';
  import { isInteractableStore } from '../../stores/brushing';
  import { datasetStore, invalidRowsStore } from '../../stores/dataset';
  import { activePanelsStore, panelsSizesStore, rowSizeStore } from '../../stores/panels';
  import { getDefaultPanelSizes } from '../panels/util';
  import type { PanelType } from '../panels/types';

  let isFileDropdownOpen = false;
  let isSettingsDropdownOpen = false;
  let isImportDatasetModalOpen = false;
  let isExportDatasetModalOpen = false;
  let isInvalidRowsModalOpen = false;
  let isAboutModalOpen = false;

  let showSuccessToast = false;
  let showWarningToast = false;
  let isMounted = false;

  let panels: PanelType[];
  activePanelsStore.subscribe((value) => {
    panels = value;
  });

  let invalidRowsCount = 0;
  const unsubscribeInvalidRows = invalidRowsStore.subscribe((value) => {
    invalidRowsCount = value.length;

    if (!isMounted || $datasetStore.length === 0) return;

    if (invalidRowsCount === 0) {
      showSuccessToast = true;
      setTimeout(() => (showSuccessToast = false), 3000);
    } else {
      showWarningToast = true;
      setTimeout(() => (showWarningToast = false), 3000);
    }
  });

  function togglePanelVisibility(i: number) {
    panels[i].visible = !panels[i].visible;
    activePanelsStore.set(panels);
    localStorage.setItem(
      'activePanels',
      JSON.stringify(panels.filter((panel) => panel.visible).map((panel) => panel.id))
    );
    localStorage.removeItem('panelsSizes');
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

  function openAboutModal() {
    isAboutModalOpen = false;
    isAboutModalOpen = true;
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
    datasetStore.set([]);
    invalidRowsStore.set([]);
    closeSettingsDropdown();
  }

  function resetPanelSizes() {
    localStorage.removeItem('panelsSizes');
    localStorage.removeItem('rowSize');
    panelsSizesStore.set(getDefaultPanelSizes($activePanelsStore.filter((panel) => panel.visible).length));
    rowSizeStore.set(55);
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
<AboutModal isOpen={isAboutModalOpen} />

<div class="h-[4%]">
  <Navbar fluid class="bg-sky-900 h-full p-0" navDivClass="h-full flex flex-row justify-between">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div on:click={openAboutModal} class="flex md:order-2 items-center cursor-pointer text-sm font-medium">
      <span class="text-white hover:text-blue-200">About...</span>
    </div>
    <NavUl
      ulClass="h-full flex flex-row p-0 m-0 md:space-x-8 md:mt-0 md:text-sm md:font-medium items-center"
      class="h-full order-1"
    >
      <img src="mva-logo.svg" class="h-full" alt="MVA Logo" />
      <NavLi id="nav-file" on:click={openFileDropdown} class="cursor-pointer">
        <span class="text-white hover:text-blue-200"><Chevron aligned>File</Chevron></span>
      </NavLi>
      <Dropdown bind:open={isFileDropdownOpen} class="w-44 z-20">
        <ExampleDatasets {closeFileDropdown} />
        <DropdownItem on:click={openImportModal}>Import Dataset...</DropdownItem>
        {#if $datasetStore.length !== 0}<DropdownItem on:click={openExportModal}>Export Dataset...</DropdownItem> {/if}
      </Dropdown>
      <NavLi id="nav-panels" class="cursor-pointer">
        <span class="text-white hover:text-blue-200"><Chevron aligned>Panels</Chevron></span>
      </NavLi>
      <Dropdown triggeredBy="#nav-panels" class="w-44 z-20">
        {#each panels as panel, i}
          <li
            class="font-medium py-2 px-4 text-sm hover:bg-gray-100 w-full text-left flex items-center justify-between"
          >
            <Checkbox checked={panel.visible} on:change={() => togglePanelVisibility(i)} class="focus:ring-transparent"
              >{panel.title}</Checkbox
            >
          </li>
        {/each}
      </Dropdown>
      {#if $datasetStore.length !== 0}
        <NavLi id="nav-settings" on:click={openSettingsDropdown} class="cursor-pointer">
          <span class="text-white hover:text-blue-200"><Chevron aligned>Settings</Chevron></span>
        </NavLi>
        <Dropdown bind:open={isSettingsDropdownOpen} class="w-44 z-20">
          {#if invalidRowsCount !== 0}
            <DropdownItem on:click={openInvalidRowsModal}>View Invalid Rows...</DropdownItem>
          {/if}
          <DropdownItem on:click={resetPanelSizes}>Reset Panel Sizes</DropdownItem>
          <DropdownItem on:click={clearDataset}>Clear Dataset</DropdownItem>
        </Dropdown>
      {/if}
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
    <Button size="xs" class="ml-4 focus:ring-transparent" on:click={openInvalidRowsModal}>View</Button>
  </div>
</Toast>
