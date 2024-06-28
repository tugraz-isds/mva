<script lang="ts">
  import ViewComponent from './View.svelte';
  import { Pane, Splitpanes } from 'svelte-splitpanes';
  import { getViewMinSize } from './util';
  import type { View } from './ViewType';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
  export let startResize: () => void;
  export let endResize: () => void;
</script>

<Splitpanes horizontal dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={endResize}>
  <Pane minSize={20} size={55}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={endResize}>
      <Pane class="view-{views[0].id}" minSize={getViewMinSize(views[0].id)}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[0]} /></Pane
      >
      <Pane class="view-{views[1].id}" minSize={getViewMinSize(views[1].id)}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[1]} /></Pane
      >
    </Splitpanes>
  </Pane>
  <Pane class="view-{views[2].id}" minSize={20}>
    <ViewComponent otherViews={views} {handleSwap} currView={views[2]} />
  </Pane>
</Splitpanes>
