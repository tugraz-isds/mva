<script lang="ts">
  import ViewComponent from './View.svelte';
  import type { View } from './ViewType';
  import { Pane, Splitpanes } from 'svelte-splitpanes';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
</script>

<Splitpanes horizontal dblClickSplitter={false} theme="modern-theme">
  <Pane minSize={20} size={55}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme">
      <Pane><ViewComponent otherViews={views} {handleSwap} currView={views[0]} /></Pane>
      <Pane><ViewComponent otherViews={views} {handleSwap} currView={views[1]} /></Pane>
    </Splitpanes>
  </Pane>
  <Pane minSize={20}>
    <Splitpanes dblClickSplitter={false} theme="modern-theme">
      <Pane><ViewComponent otherViews={views} {handleSwap} currView={views[2]} /></Pane>
      <Pane><ViewComponent otherViews={views} {handleSwap} currView={views[3]} /></Pane>
    </Splitpanes>
  </Pane>
</Splitpanes>
