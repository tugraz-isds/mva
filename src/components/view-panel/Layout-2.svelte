<script lang="ts">
  import type { MouseEventHandler } from 'svelte/elements';
  import ViewComponent from './View.svelte';
  import HorizontalDivider from './HorizontalDivider.svelte';
  import type { View } from './ViewType';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
  export let handleHorizontalMouseDown: MouseEventHandler<HTMLElement>;
</script>

<!-- Lower Row -->
<div class="lower-row flex flex-row" style="height: 90%;">
  <div class="view-{views[0].id}" style="width: {views[0].width}%;">
    <ViewComponent
      otherViews={views}
      {handleSwap}
      currView={views[0]}
      parentHeight={views[0].height}
    />
  </div>

  <HorizontalDivider id={3} {handleHorizontalMouseDown} />

  <div class="view-{views[1].id}" style="width: {views[1].width}%;">
    <ViewComponent
      otherViews={views}
      {handleSwap}
      currView={views[1]}
      parentHeight={views[1].height}
    />
  </div>
</div>
