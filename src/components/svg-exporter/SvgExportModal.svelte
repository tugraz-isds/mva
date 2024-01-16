<script lang="ts">
	import { Button, Modal, Label, NumberInput, Checkbox } from 'flowbite-svelte';
	import xmlFormat from 'xml-formatter';

	export let isOpen: boolean;

	let numberOfDecimals: number = 6;
	let keepClasses: boolean = true;
	let svgString = '';

	export function setSvgString(svgStr: string) {
		svgString = svgStr;
	}

	function saveSVG() {
		// Trim decimal points to number of decimals
		svgString = svgString.replace(
			new RegExp(`\\d+\\.\\d{${numberOfDecimals + 1},}`, 'g'),
			(match) => `${Number(match).toFixed(numberOfDecimals)}`
		);

		// Remove classes if needed
		if (!keepClasses) {
			svgString = svgString.replaceAll(/class="[^"]*"/g, '');
		}

		// Remove redundant fields
		svgString = svgString
			.replaceAll('px', '')
			.replaceAll(' dy="0.32em"', '')
			.replaceAll(' opacity="1"', '');

		const stringSvgFormatted = xmlFormat(svgString, {
			indentation: '  ',
			collapseContent: true,
			lineSeparator: '\n'
		});

		const svgBlob = new Blob([stringSvgFormatted], {
			type: 'image/svg+xml;charset=utf-8'
		});
		const svgUrl = URL.createObjectURL(svgBlob);
		const downloadLink = document.createElement('a');

		downloadLink.href = svgUrl;
		downloadLink.download = 'parcoord.svg';
		document.body.appendChild(downloadLink);
		downloadLink.click();
		document.body.removeChild(downloadLink);

		isOpen = false;
	}

	function checkData() {
		numberOfDecimals = Math.max(0, Math.min(12, numberOfDecimals));
	}
</script>

<Modal bind:open={isOpen} size="xs" class="w-full">
	<form class="flex flex-col space-y-6" action="#">
		<h3 class="mb-4 text-xl font-medium text-gray-900">Export as SVG</h3>
		<div class="mb-6 flex items-center">
			<Label for="upload-input" class="w-1/3">Number of decimals:</Label>
			<NumberInput
				id="no-decimals-input"
				bind:value={numberOfDecimals}
				on:change={checkData}
				defaultClass="block ml-2 w-1/5"
				size="sm"
				min={0}
				max={12}
			/>
		</div>
		<div class="mb-6 flex items-center">
			<Label for="keep-classes-input" class="w-1/3">Keep CSS classes:</Label>
			<Checkbox class="ml-2" bind:checked={keepClasses} />
		</div>
		<Button type="submit" class="w-full" on:click={saveSVG}>Save SVG</Button>
	</form>
</Modal>
