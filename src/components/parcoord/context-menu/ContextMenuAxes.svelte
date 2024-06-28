<script lang="ts">
  import { ChevronRight, Dropdown, DropdownItem, DropdownDivider } from 'flowbite-svelte';
  import { CheckOutline } from 'flowbite-svelte-icons';
  import { dimensionDataStore } from '../../../stores/dataset';
  import { filtersArray, parcoordDimMetadata } from '../../../stores/parcoord';
  import { parcoordCustomAxisRanges, parcoordVisibleDimensionsStore } from '../../../stores/parcoord';
  import { isInteractableStore } from '../../../stores/brushing';
  import SetRangeModal from './SetRangeModal.svelte';
  import SetBinNoModal from './SetBinNoModal.svelte';
  import SetFilterModal from './SetFilterModal.svelte';
  import type Axes from '../axes/Axes.svelte';
  import type { MarginType } from '../../../util/types';
  import type { AxesFilterType } from '../types';

  export let axesComponent: Axes;
  export let dimensions: string[] = [];
  export let xScales: any;
  export let yScales: any;
  export let margin: MarginType;
  export let handleHideDimension: (idx: number) => void;
  export let calculateMarginLeft: () => void;

  let dimIndex: number;
  let dimension: string;
  let isSetRangeModalOpen = false,
    isSetBinNoModalOpen = false,
    isSetFilterModalOpen = false;
  let isContextMenuShown = false;
  let isFilterSet = false;

  let debounceTimeout: number;
  let menuStyle = '';
  const activeClass = 'font-medium py-0.5 px-0.5 text-xs hover:bg-gray-100';

  export function showContextMenu(event: MouseEvent, index: number) {
    event.preventDefault();
    $isInteractableStore = false;
    isContextMenuShown = true;
    dimIndex = index;
    dimension = dimensions[dimIndex];
    const axisFilter = $filtersArray.get(dimension) as AxesFilterType;
    isFilterSet = axisFilter.percentages.start !== 0 || axisFilter.percentages.end !== 1;
    const { clientX, clientY } = event;
    const clientXNew = clientX + 150 < window.innerWidth ? clientX : clientX - 150;
    menuStyle = `left: ${clientXNew}px; top: ${clientY}px;`;
  }

  export function hideContextMenu() {
    isContextMenuShown = false;
    $isInteractableStore = true;
  }

  function hideDimension() {
    const visibleDimensions = $parcoordVisibleDimensionsStore;
    visibleDimensions[visibleDimensions.findIndex((dim) => dim.title === dimension)].visible = false;
    parcoordVisibleDimensionsStore.set(visibleDimensions);
    handleHideDimension(dimIndex);
    hideContextMenu();
  }

  function invertDimension() {
    axesComponent.handleOnInvertAxesClick(dimIndex);
  }

  function handleShow(field: 'labels' | 'histograms' | 'filter' | 'filterValues') {
    const dimData = $parcoordDimMetadata;
    const currDimData = dimData.get(dimension);
    if (!currDimData) return;

    if (field === 'labels') {
      currDimData.showLabels = !currDimData.showLabels;
      dimIndex === 0 && calculateMarginLeft();
    } else if (field === 'histograms') {
      currDimData.showHistograms = !currDimData.showHistograms;
      const step = xScales[1] - xScales[0];
      if (dimIndex === dimensions.length - 1) margin.right = currDimData.showHistograms ? 10 + step / 2 : 40;
    } else if (field === 'filter') currDimData.showFilter = !currDimData.showFilter;
    else if (field === 'filterValues') currDimData.showFilterValues = !currDimData.showFilterValues;

    dimData.set(dimension, currDimData);
    parcoordDimMetadata.set(dimData);
    hideContextMenu();
  }

  function openSetRangeModal() {
    hideContextMenu();
    isSetRangeModalOpen = false;
    isSetRangeModalOpen = true;
    $isInteractableStore = false;
  }

  function resetDimensionRange() {
    const customRanges = $parcoordCustomAxisRanges;
    customRanges.set(dimension, null);
    $parcoordCustomAxisRanges = customRanges;

    const axisFilter = $filtersArray.get(dimension) as AxesFilterType;
    axisFilter.percentages = {
      start: 0,
      end: 1
    };
    $filtersArray.set(dimension, axisFilter);
  }

  function openSetFilterModal() {
    hideContextMenu();
    isSetFilterModalOpen = false;
    isSetFilterModalOpen = true;
    $isInteractableStore = false;
  }

  function resetFilter() {
    isFilterSet = false;
    axesComponent.resetAxisFilter(dimension);
    handleMouseLeave();
  }

  function openSetBinNoModal() {
    hideContextMenu();
    isSetBinNoModalOpen = false;
    isSetBinNoModalOpen = true;
    $isInteractableStore = false;
  }

  function handleMouseLeave() {
    debounceTimeout = setTimeout(() => {
      hideContextMenu();
    }, 100);
  }

  function handleMouseEnter() {
    clearTimeout(debounceTimeout);
  }
</script>

{#if isContextMenuShown}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="context-menu fixed bg-white border border-gray-300 p-1 w-32 z-10"
    style={menuStyle}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
  >
    <DropdownItem defaultClass={activeClass} on:click={hideDimension}>Hide Dimension</DropdownItem>
    <DropdownItem defaultClass={activeClass} on:click={invertDimension}>Invert Dimension</DropdownItem>
    <DropdownDivider />
    <DropdownItem id="parcoord-axis-context-menu" defaultClass="{activeClass} flex items-center justify-between">
      Show<ChevronRight class="w-3 h-3 ms-2" />
    </DropdownItem>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div on:mouseenter={() => ($isInteractableStore = false)} on:mouseleave={() => ($isInteractableStore = true)}>
      <Dropdown placement="right-start" class="p-1 w-32" triggeredBy="#parcoord-axis-context-menu">
        <DropdownItem defaultClass="{activeClass} flex items-center" class="w-28" on:click={() => handleShow('labels')}
          ><CheckOutline
            size="xs"
            class="ms-2 mr-2"
            style="visibility: {$parcoordDimMetadata.get(dimension)?.showLabels ? 'visible' : 'hidden'}"
          />Labels</DropdownItem
        >
        <DropdownItem
          defaultClass="{activeClass} flex items-center"
          class="w-28"
          on:click={() => handleShow('histograms')}
          ><CheckOutline
            size="xs"
            class="ms-2 mr-2"
            style="visibility: {$parcoordDimMetadata.get(dimension)?.showHistograms ? 'visible' : 'hidden'}"
          />Histogram</DropdownItem
        >
        <DropdownItem defaultClass="{activeClass} flex items-center" class="w-28" on:click={() => handleShow('filter')}
          ><CheckOutline
            size="xs"
            class="ms-2 mr-2"
            style="visibility: {$parcoordDimMetadata.get(dimension)?.showFilter ? 'visible' : 'hidden'}"
          />Filter</DropdownItem
        >
        {#if $dimensionDataStore.get(dimension)?.type === 'numerical'}
          <DropdownItem
            defaultClass="{activeClass} flex items-center"
            class="w-28"
            on:click={() => handleShow('filterValues')}
            ><CheckOutline
              size="xs"
              class="ms-2 mr-2"
              style="visibility: {$parcoordDimMetadata.get(dimension)?.showFilterValues ? 'visible' : 'hidden'}"
            />Filter Values</DropdownItem
          >{/if}
      </Dropdown>
    </div>
    {#if $dimensionDataStore.get(dimension)?.type === 'numerical'}
      <DropdownDivider />
      <DropdownItem defaultClass={activeClass} on:click={() => openSetRangeModal()}>Set Range...</DropdownItem>
    {/if}
    {#if $dimensionDataStore.get(dimension)?.type === 'numerical' && $parcoordCustomAxisRanges.get(dimension) !== null}
      <DropdownItem defaultClass={activeClass} on:click={() => resetDimensionRange()}>Reset Range</DropdownItem>
    {/if}
    {#if $dimensionDataStore.get(dimension)?.type === 'numerical' || isFilterSet}
      <DropdownDivider />
    {/if}
    {#if $dimensionDataStore.get(dimension)?.type === 'numerical'}
      <DropdownItem defaultClass={activeClass} on:click={() => openSetFilterModal()}>Set Filter...</DropdownItem>
    {/if}
    {#if isFilterSet}
      <DropdownItem defaultClass={activeClass} on:click={resetFilter}>Reset Filter</DropdownItem>
    {/if}
    {#if $dimensionDataStore.get(dimension)?.type === 'numerical'}
      <DropdownDivider />
      <DropdownItem defaultClass={activeClass} on:click={() => openSetBinNoModal()}>Set Bin Num...</DropdownItem>
    {/if}
  </div>
{/if}

<SetRangeModal isOpen={isSetRangeModalOpen} {dimension} {yScales} handleResetDimensionRange={resetDimensionRange} />

<SetBinNoModal isOpen={isSetBinNoModalOpen} {dimension} />

<SetFilterModal isOpen={isSetFilterModalOpen} {dimension} {yScales} />
