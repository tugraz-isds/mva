<script lang="ts">
	import Navbar from '../components/Navbar.svelte';
	import SplomView from '../components/splom/SPLOMView.svelte';
	import ScatterplotView from '../components/scatterplot/ScatterplotView.svelte';
	import SimmapView from '../components/simmap/SimmapView.svelte';
	import TableView from '../components/table/TableView.svelte';
	import ParcoordView from '../components/parcoord/ParcoordView.svelte';

	import { Button } from 'flowbite-svelte';
</script>

<div class="app-container">
	<!-- Navbar -->
	<div class="navbar-container">
		<Navbar />
	</div>
	<Button class="!bg-blue-500">Blue Button</Button>
	<!-- Upper Row -->
	<div class="upper-row-container">
		<div class="splom-container"><SplomView /></div>
		<div class="scatterplot-container"><ScatterplotView /></div>
		<div class="simmap-container"><SimmapView /></div>
	</div>
	<!-- Lower Row -->
	<div class="lower-row-container">
		<div class="table-container"><TableView /></div>
		<div class="parcoord-container"><ParcoordView /></div>
	</div>
</div>

<style>
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}

	.app-container {
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		overflow: hidden;
	}

	.navbar-container {
		height: 5%;
	}

	.upper-row-container {
		height: 40%;
		display: flex;
	}

	.lower-row-container {
		height: 55%;
		border-top: 1px solid black;
		display: flex;
	}

	.splom-container,
	.scatterplot-container,
	.simmap-container {
		height: 100%;
		width: 33.33%;
		border-right: 1px solid black;
	}

	.table-container,
	.parcoord-container {
		height: 100%;
		border-right: 1px solid black;
	}

	.table-container {
		width: 33.33%;
	}

	.parcoord-container {
		width: 66.66%;
	}
</style>
