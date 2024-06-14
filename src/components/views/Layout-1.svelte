<script lang="ts">
  import ViewComponent from './View.svelte';
  import type { View } from './ViewType';

  export let views: View[];
  export let handleSwap: (title: string, e: Event) => void;
</script>

<div class="lower-row flex flex-row h-full w-full">
  <ViewComponent otherViews={views} {handleSwap} currView={views[0]} />
</div>
