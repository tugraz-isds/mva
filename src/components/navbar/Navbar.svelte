<script lang="ts">
  import { Navbar, NavLi, NavUl, Dropdown, DropdownItem, Chevron } from 'flowbite-svelte';
  import ImportDatasetModal from './dataset-import/ImportDatasetModal.svelte';
  import { parcoordIsInteractable } from '../../stores/parcoord';

  let isImportDatasetModalOpen = false;

  function openModal() {
    isImportDatasetModalOpen = false;
    isImportDatasetModalOpen = true;
    $parcoordIsInteractable = false;
  }
</script>

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
        <DropdownItem on:click={openModal}>Import Dataset...</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
        <DropdownItem>Item 3</DropdownItem>
      </Dropdown>
      <Dropdown triggeredBy="#nav-settings" class="w-44 z-20">
        <DropdownItem>Item 1</DropdownItem>
        <DropdownItem>Item 2</DropdownItem>
        <DropdownItem>Item 3</DropdownItem>
      </Dropdown>
    </NavUl>
  </Navbar>
</div>

<ImportDatasetModal isOpen={isImportDatasetModalOpen} />
