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
      <Pane class="view-{views[2].id}" minSize={getViewMinSize(views[2].id)}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[2]} /></Pane
      >
    </Splitpanes>
  </Pane>
  <Pane minSize={20}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme" on:resize={startResize} on:resized={endResize}>
      <Pane class="view-{views[3].id}" minSize={getViewMinSize(views[3].id)} size={20}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[3]} /></Pane
      >
      <Pane class="view-{views[4].id}" minSize={getViewMinSize(views[4].id)} size={30}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[4]} /></Pane
      >
      <Pane class="view-{views[5].id}" minSize={getViewMinSize(views[5].id)} size={50}
        ><ViewComponent otherViews={views} {handleSwap} currView={views[5]} /></Pane
      >
    </Splitpanes>
  </Pane>
</Splitpanes>
