<script lang="ts">
	import Navbar from '../components/navbar/Navbar.svelte';
	import ViewPanel from '../components/view-panel/ViewPanel.svelte';
</script>

<div class="w-full h-full overflow-hidden">
	<Navbar />
	<ViewPanel />
</div>

<style lang="scss">
	:global(body) {
		font-family: 'Roboto', sans-serif;
	}
</style>
