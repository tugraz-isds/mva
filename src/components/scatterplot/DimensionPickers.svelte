<script lang="ts">
  import { Select } from 'flowbite-svelte';
  let selected: string;
  let countries = [
    { value: 'us', name: 'United States' },
    { value: 'ca', name: 'Canada' },
    { value: 'fr', name: 'France' }
  ];
</script>

<div class="flex flex-row w-full">
  <div class="flex flex-row w-full">
    <span class="mr-1/2" style="font-size: 14px;">X:</span>
    <Select
      class="mt-2 w-1/2"
      size="sm"
      items={countries}
      bind:value={selected}
      placeholder=""
      style="height: 18px;
            padding: 0 4px 0 4px;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: '0.5em'};"
    />
  </div>
  <div class="flex flex-row w-full">
    <span class="mr-1/2" style="font-size: 14px;">Y:</span>
    <Select
      class="mt-2 w-1/2"
      size="sm"
      items={countries}
      bind:value={selected}
      placeholder=""
      style="height: 18px;
            padding: 0 4px 0 4px;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: '0.5em'};"
    />
  </div>
</div>
