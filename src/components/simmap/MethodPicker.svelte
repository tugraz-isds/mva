<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Select } from 'flowbite-svelte';
  import { simmapMethodStore } from '../../stores/simmap';
  import { datasetStore } from '../../stores/dataset';

  let simmapMethods = [
    { value: 'PCA', name: 'PCA' },
    { value: 'UMAP', name: 'UMAP' }
  ];

  const unsubscribeDataset = datasetStore.subscribe((value: any) => {
    if (value.length > 0) simmapMethodStore.set('PCA');
  });

  onDestroy(() => {
    unsubscribeDataset();
  });
</script>

<div class="flex flex-row w-full justify-center">
  <div class="flex flex-row w-1/2">
    <span class="mr-1/2" style="font-size: 14px;">Y:</span>
    <Select
      class="w-full"
      size="sm"
      items={simmapMethods}
      bind:value={$simmapMethodStore}
      placeholder=""
      style="height: 18px;
            padding: 0 16px 0 4px;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 12px;"
    />
  </div>
</div>
