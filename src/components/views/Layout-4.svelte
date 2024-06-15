<script lang="ts">
  import ViewComponent from './View.svelte';
  import { Pane, Splitpanes } from 'svelte-splitpanes';
  import { getViewMinSize } from './util';
  import type { View } from './ViewType';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
</script>

<Splitpanes horizontal dblClickSplitter={false} theme="modern-theme">
  <Pane minSize={20} size={55}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme">
      <Pane minSize={getViewMinSize(views[0].id)}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[0]} /></Pane
      >
      <Pane minSize={getViewMinSize(views[1].id)}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[1]} /></Pane
      >
    </Splitpanes>
  </Pane>
  <Pane minSize={20}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme">
      <Pane minSize={getViewMinSize(views[2].id)}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[2]} /></Pane
      >
      <Pane minSize={getViewMinSize(views[3].id)}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[3]} /></Pane
      >
    </Splitpanes>
  </Pane>
</Splitpanes>
