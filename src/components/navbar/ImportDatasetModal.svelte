<script lang="ts">
	import { Button, Modal, Label, Input, Fileupload, Helper } from 'flowbite-svelte';
	import { csvParse, autoType, type DSVParsedArray } from 'd3';
	import { datasetStore, labelDimension } from '../../stores/dataset';

	export let isOpen: boolean;

	let files: FileList | undefined; // List of uploaded files
	let validUpload: boolean = true; // If false show error message
	let separator: string = ','; // Default separator

	let fileuploadprops = {
		id: 'upload-input',
		class: 'block ml-2 w-3/4',
		accept: '.csv' //'.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
	};

	function closeModal() {
		isOpen = false;
	}

	// Imports CSV files, parses and stores data into Svelte store
	async function importDataset() {
		if (files && files.length > 0) {
			const file = files[0];
			let text = await file.text();
			files = undefined;
			if (separator !== ',') text = text.replace(new RegExp(separator, 'g'), ',');
			const dataset: DSVParsedArray<any> = csvParse(text, autoType);

			datasetStore.set(dataset);
			localStorage.setItem('MVA_dataset', JSON.stringify(dataset));

			// Set first dimension as label
			const labelDim = Object.keys(dataset[0])[0];
			labelDimension.set(labelDim);
			localStorage.setItem('labelDimension', labelDim);

			validUpload = true;
			closeModal();
		} else validUpload = false;
	}
</script>

<Modal bind:open={isOpen} on:closed={closeModal} size="xs" class="w-full">
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900">Import Dataset</h3>
		<div class="mb-6 flex items-center">
			<Label for="upload-input" class="w-1/5">Upload file:</Label>
			<Fileupload bind:files {...fileuploadprops} />
		</div>
		<div class="mb-6 flex items-center">
			<Label for="separator-input" class="w-1/5">Separator:</Label>
			<Input
				id="separator-input"
				defaultClass="block ml-2 w-1/5"
				size="sm"
				bind:value={separator}
			/>
		</div>
		{#if !validUpload}
			<Helper color="red"><span class="font-medium">Upload valid CSV file.</span></Helper>
		{/if}
		<Button type="submit" class="w-full" on:click={importDataset}>Import Dataset</Button>
	</form>
</Modal>
