<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Panel from './Panel.svelte';
  import { Pane, Splitpanes } from 'svelte-splitpanes';
  import { getDefaultPanelSizes, getPanelMinSize } from './util';
  import { panelsSizesStore, rowSizeStore } from '../../stores/panels';
  import type { PanelType } from './types';

  export let panels: PanelType[];
  export let handleSwap: (title: string, e: Event) => void;
  export let startResize: () => void;
  export let endResize: () => void;

  let panelsSizes: number[];
  const unsubscribePanelsSizes = panelsSizesStore.subscribe((value) => {
    panelsSizes = value;
  });

  let rowSize: number;
  const unsubscribeRowSize = rowSizeStore.subscribe((value) => {
    rowSize = value;
  });

  function resizeUpper(e: any) {
    panelsSizes[0] = e.detail[0].size;
    panelsSizes[1] = e.detail[1].size;
    panelsSizes[2] = e.detail[2].size;
    panelsSizesStore.set(panelsSizes);
    localStorage.setItem('panelsSizes', JSON.stringify(panelsSizes));

    endResize();
  }

  function resizeLower(e: any) {
    panelsSizes[3] = e.detail[0].size;
    panelsSizes[4] = e.detail[1].size;
    panelsSizesStore.set(panelsSizes);
    localStorage.setItem('panelsSizes', JSON.stringify(panelsSizes));

    endResize();
  }

  function resizeRow(e: any) {
    rowSize = e.detail[0].size;
    rowSizeStore.set(rowSize);
    localStorage.setItem('rowSize', JSON.stringify(rowSize));

    endResize();
  }

  onMount(() => {
    const panelsSizesStr = localStorage.getItem('panelsSizes');
    if (panelsSizesStr) panelsSizesStore.set(JSON.parse(panelsSizesStr));
    else panelsSizesStore.set(getDefaultPanelSizes(5));

    const rowSizeStr = localStorage.getItem('rowSize');
    if (rowSizeStr) rowSizeStore.set(JSON.parse(rowSizeStr));
    else rowSizeStore.set(55);
  });

  onDestroy(() => {
    unsubscribePanelsSizes();
    unsubscribeRowSize();
  });
</script>

<Splitpanes horizontal dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={resizeRow}>
  <Pane minSize={20} size={rowSize}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={resizeUpper}>
      <Pane class="panel-{panels[0].id}" minSize={getPanelMinSize(panels[0].id)} size={panelsSizes[0]}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[0]} /></Pane
      >
      <Pane class="panel-{panels[1].id}" minSize={getPanelMinSize(panels[1].id)} size={panelsSizes[1]}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[1]} /></Pane
      >
      <Pane class="panel-{panels[2].id}" minSize={getPanelMinSize(panels[2].id)} size={panelsSizes[2]}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[2]} /></Pane
      >
    </Splitpanes>
  </Pane>
  <Pane minSize={20}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={resizeLower}>
      <Pane class="panel-{panels[3].id}" minSize={getPanelMinSize(panels[3].id)} size={panelsSizes[3]}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[3]} /></Pane
      >
      <Pane class="panel-{panels[4].id}" minSize={getPanelMinSize(panels[4].id)} size={panelsSizes[4]}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[4]} /></Pane
      >
    </Splitpanes>
  </Pane>
</Splitpanes>
