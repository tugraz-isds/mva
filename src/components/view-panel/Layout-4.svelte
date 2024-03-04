<script lang="ts">
  import type { MouseEventHandler } from 'svelte/elements';
  import ViewComponent from './View.svelte';
  import HorizontalDivider from './HorizontalDivider.svelte';
  import VerticalDivider from './VerticalDivider.svelte';
  import type { View } from './ViewType';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
  export let handleHorizontalMouseDown: MouseEventHandler<HTMLElement>;
  export let handleVerticalMouseDown: MouseEventHandler<HTMLElement>;

  views[0].width = 50;
  views[1].width = 50;
</script>

<!-- Upper Row -->
<div class="upper-row flex flex-row min-h-fit" style="height: {views[0].height}%;">
  <div class="view-{views[0].id}" style="width: {views[0].width}%;">
    <ViewComponent otherViews={views} {handleSwap} currView={views[0]} />
  </div>

  <HorizontalDivider id={1} {handleHorizontalMouseDown} />

  <div class="view-{views[1].id}" style="width: {views[1].width}%;">
    <ViewComponent otherViews={views} {handleSwap} currView={views[1]} />
  </div>
</div>

<!-- Draggable Vertical Divider -->
<VerticalDivider {handleVerticalMouseDown} />

<!-- Lower Row -->
<div class="lower-row flex flex-row" style="height: {views[3].height}%;">
  <div class="view-{views[2].id}" style="width: {views[2].width}%;">
    <ViewComponent otherViews={views} {handleSwap} currView={views[2]} />
  </div>

  <HorizontalDivider id={3} {handleHorizontalMouseDown} />

  <div class="view-{views[3].id}" style="width: {views[3].width}%;">
    <ViewComponent otherViews={views} {handleSwap} currView={views[3]} />
  </div>
</div>
