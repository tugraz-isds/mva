<script lang="ts">
  import { Button, Modal } from 'flowbite-svelte';
  import { isInteractableStore } from '../../stores/brushing';

  export let isOpen: boolean;

  $: if (!isOpen) $isInteractableStore = true;
</script>

<Modal bind:open={isOpen} size="xs">
  <div class="mb-4">
    <h3 class="text-xl font-medium text-gray-900">About MVA</h3>
  </div>

  <div>
    <span class="font-medium">The Multidimensional Visual Analyser (MVA)</span> is an open-source web application for visually
    exploring and analyzing multidimensional datasets.
  </div>

  <div>
    Source code is available
    <a class="text-primary-700" href="https://github.com/tugraz-isds/mva" target="_blank">here</a>.
  </div>

  <div>Current version: v0.1.0-alpha</div>

  <div class="w-full flex justify-center">
    <Button
      on:click={() => {
        isOpen = false;
      }}
      class="focus:ring-transparent">OK</Button
    >
  </div>
</Modal>
