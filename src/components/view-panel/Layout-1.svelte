<script lang="ts">
  import ViewComponent from './View.svelte';
  import type { View } from './ViewType';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
</script>

<!-- Lower Row -->
<div class="lower-row flex flex-row" style="height: 90%;">
  <div class="view-{views[0].id}" style="width: 100%;">
    <ViewComponent
      otherViews={views}
      {handleSwap}
      currView={views[0]}
      parentHeight={views[0].height}
    />
  </div>
</div>
