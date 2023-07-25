<script lang="ts">
	import { Button, Modal, Label, Input, Fileupload } from 'flowbite-svelte';
	export let isOpen: boolean;

	function closeModal() {
		isOpen = false;
	}

	let fileuploadprops = {
		id: 'upload-input',
		class: 'block ml-2 w-3/4',
		accept: '.csv' //'.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel'
	};
</script>

<Modal bind:open={isOpen} on:closed={closeModal} size="xs" class="w-full">
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900">Import Dataset</h3>
		<div class="mb-6 flex items-center">
			<Label for="upload-input" class="w-1/5">Upload file:</Label>
			<Fileupload {...fileuploadprops} />
		</div>
		<div class="mb-6 flex items-center">
			<Label for="separator-input" class="w-1/5">Separator:</Label>
			<Input id="separator-input" defaultClass="block ml-2 w-1/5" size="sm" value="," />
		</div>
		<Button type="submit" class="w-full">Import Dataset</Button>
	</form>
</Modal>
