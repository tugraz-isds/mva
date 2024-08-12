<script lang="ts">
  import Panel from './Panel.svelte';
  import { Pane, Splitpanes } from 'svelte-splitpanes';
  import { getPanelMinSize } from './util';
  import type { PanelType } from './types';

  export let panels: PanelType[];
  export let handleSwap: (title: string, e: Event) => void;
  export let startResize: () => void;
  export let endResize: () => void;
</script>

<Splitpanes horizontal dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={endResize}>
  <Pane minSize={20} size={55}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={endResize}>
      <Pane class="panel-{panels[0].id}" minSize={getPanelMinSize(panels[0].id)}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[0]} /></Pane
      >
      <Pane class="panel-{panels[1].id}" minSize={getPanelMinSize(panels[1].id)}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[1]} /></Pane
      >
      <Pane class="panel-{panels[2].id}" minSize={getPanelMinSize(panels[2].id)}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[2]} /></Pane
      >
    </Splitpanes>
  </Pane>
  <Pane minSize={20}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={endResize}>
      <Pane class="panel-{panels[3].id}" minSize={getPanelMinSize(panels[3].id)} size={20}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[3]} /></Pane
      >
      <Pane class="panel-{panels[4].id}" minSize={getPanelMinSize(panels[4].id)} size={30}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[4]} /></Pane
      >
      <Pane class="panel-{panels[5].id}" minSize={getPanelMinSize(panels[5].id)} size={50}
        ><Panel otherPanels={panels} {handleSwap} currPanel={panels[5]} /></Pane
      >
    </Splitpanes>
  </Pane>
</Splitpanes>
