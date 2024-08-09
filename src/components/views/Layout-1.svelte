<script lang="ts">
  import ViewComponent from './View.svelte';
  import type { View } from './types';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
</script>

<div class="view-{views[0].id} lower-row flex flex-row h-full w-full">
  <ViewComponent otherViews={views} {handleSwap} currView={views[0]} />
</div>
