<script lang="ts">
	import { mdiChevronDown } from '@mdi/js';
	import IconButton, { Icon } from '@smui/icon-button';
	import { Svg } from '@smui/common';
</script>

<div class="navbar">
	<div class="dropdown">
		<div class="dropbtn" style="display: flex; align-items: center;">
			File
			<IconButton class="material-icons" size="button">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiChevronDown} />
				</Icon>
			</IconButton>
		</div>
		<div class="dropdown-content">
			<a href="#">Link 1</a>
			<a href="#">Link 2</a>
			<a href="#">Link 3</a>
		</div>
	</div>
	<div class="dropdown">
		<div class="dropbtn" style="display: flex; align-items: center;">
			Settings
			<IconButton class="material-icons" size="button">
				<Icon component={Svg} viewBox="0 0 24 24">
					<path fill="currentColor" d={mdiChevronDown} />
				</Icon>
			</IconButton>
		</div>
		<div class="dropdown-content">
			<a href="#">Link 1</a>
			<a href="#">Link 2</a>
			<a href="#">Link 3</a>
		</div>
	</div>
	<a href="#">Help</a>
</div>

<style lang="scss">
	@import '../theme/smui-theme';

	.navbar {
		overflow: hidden;
		background-color: $darkgray;
		height: 100%;
		display: flex;
		align-items: center;
	}

	.navbar a {
		float: left;
		font-size: 14px;
		color: white;
		text-align: center;
		padding: 14px 16px;
		text-decoration: none;
	}

	.navbar-icon {
		width: 2px;
	}

	.dropdown {
		float: left;
		overflow: hidden;
	}

	.dropdown .dropbtn {
		font-size: 14px;
		border: none;
		outline: none;
		color: white;
		padding: 4px 0px 4px 14px;
		background-color: inherit;
		font-family: inherit;
		margin: 0;
	}

	.navbar a:hover,
	.dropdown:hover .dropbtn {
		background-color: $blue4;
	}

	.dropdown-content {
		display: none;
		position: absolute;
		background-color: #f9f9f9;
		min-width: 160px;
		box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
		z-index: 1;
	}

	.dropdown-content a {
		float: none;
		color: black;
		padding: 12px 16px;
		text-decoration: none;
		display: block;
		text-align: left;
	}

	.dropdown-content a:hover {
		background-color: $blue1;
	}

	.dropdown:hover .dropdown-content {
		display: block;
	}
</style>
