<script lang="ts">
  import Panel from './Panel.svelte';
  import type { PanelType } from './types';

  export let panels: PanelType[];
  export let handleSwap: (title: string, e: Event) => void;
</script>

<div class="panel-{panels[0].id} lower-row flex flex-row h-full w-full">
  <Panel otherPanels={panels} {handleSwap} currPanel={panels[0]} />
</div>
