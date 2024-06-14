<script lang="ts">
  import ViewComponent from './View.svelte';
  import type { View } from './ViewType';
  import { Pane, Splitpanes } from 'svelte-splitpanes';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
</script>

<Splitpanes horizontal dblClickSplitter={false} theme="modern-theme">
  <Pane minSize={20} size={55}>
    <ViewComponent otherViews={views} {handleSwap} currView={views[0]} />
  </Pane>
  <Pane minSize={20}>
    <ViewComponent otherViews={views} {handleSwap} currView={views[1]} />
  </Pane>
</Splitpanes>
