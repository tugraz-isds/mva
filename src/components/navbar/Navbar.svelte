<script lang="ts">
  import { Navbar, NavLi, NavUl, Dropdown, DropdownItem, Chevron, ChevronRight } from 'flowbite-svelte';
  import ImportDatasetModal from './dataset/ImportDatasetModal.svelte';
  import ExportDatasetModal from './dataset/ExportDatasetModal.svelte';
  import { isInteractableStore } from '../../stores/brushing';

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
      <NavLi id="nav-file" class="cursor-pointer">
        <span class="text-white hover:text-blue-200"><Chevron aligned>File</Chevron></span>
      </NavLi>
      <NavLi id="nav-settings" href="#">
        <span class="text-white hover:text-blue-200"><Chevron aligned>Settings</Chevron></span>
      </NavLi>
      <NavLi href="#">
        <span class="text-white hover:text-blue-200">Help</span>
      </NavLi>
      <Dropdown triggeredBy="#nav-file" class="w-44 z-20">
        <DropdownItem class="flex items-center justify-between">
          Example Datasets<ChevronRight class="w-3 h-3 ms-2" />
        </DropdownItem>
        <Dropdown placement="right-start">
          <DropdownItem>Iris</DropdownItem>
          <DropdownItem>Penguins</DropdownItem>
        </Dropdown>
        <DropdownItem on:click={openImportModal}>Import Dataset...</DropdownItem>
        <DropdownItem on:click={openExportModal}>Export Dataset...</DropdownItem>
      </Dropdown>
      <Dropdown triggeredBy="#nav-settings" class="w-44 z-20">
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
        <DropdownItem>Item 3</DropdownItem>
      </Dropdown>
    </NavUl>
  </Navbar>
</div>
