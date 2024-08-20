<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Panel from './Panel.svelte';
  import { rowSizeStore } from '../../stores/panels';
  import { Pane, Splitpanes } from 'svelte-splitpanes';
  import { getPanelMinSize } from './util';
  import type { PanelType } from './types';

  export let panels: PanelType[];
  export let handleSwap: (title: string, e: Event) => void;
  export let startResize: () => void;
  export let endResize: () => void;

  let rowSize: number;
  const unsubscribeRowSize = rowSizeStore.subscribe((value) => {
    rowSize = value;
  });

  function resizeRow(e: any) {
    rowSize = e.detail[0].size;
    rowSizeStore.set(rowSize);
    localStorage.setItem('rowSize', JSON.stringify(rowSize));

    endResize();
  }

  onMount(() => {
    const rowSizeStr = localStorage.getItem('rowSize');
    if (rowSizeStr) rowSizeStore.set(JSON.parse(rowSizeStr));
    else rowSizeStore.set(55);
  });

  onDestroy(() => {
    unsubscribeRowSize();
  });
</script>

<Splitpanes horizontal dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={resizeRow}>
  <Pane class="panel-{panels[0].id}" minSize={getPanelMinSize(panels[0].id)} size={rowSize}>
    <Panel otherPanels={panels} {handleSwap} currPanel={panels[0]} />
  </Pane>
  <Pane class="panel-{panels[1].id}" minSize={getPanelMinSize(panels[1].id)}>
    <Panel otherPanels={panels} {handleSwap} currPanel={panels[1]} />
  </Pane>
</Splitpanes>
