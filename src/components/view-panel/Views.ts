import type { View } from './ViewType';
import SplomComponent from '../splom/SPLOMComponent.svelte';
import ScatterplotComponent from '../scatterplot/ScatterplotComponent.svelte';
import SimmapComponent from '../simmap/SimmapComponent.svelte';
import TableComponent from '../table/TableComponent.svelte';
import ParcoordComponent from '../parcoord/ParcoordComponent.svelte';

export let views: View[] = [
	{
		id: 'splom',
		title: 'Scatterplot Matrix',
		width: 33,
		height: 55,
		component: SplomComponent
	},
	{
		id: 'scatterplot',
		title: 'Scatterplot',
		width: 33,
		height: 55,
		component: ScatterplotComponent
	},
	{
		id: 'simmap',
		title: 'Similarity Map',
		width: 33,
		height: 55,
		component: SimmapComponent
	},
	{
		id: 'table',
		title: 'Table',
		width: 33,
		height: 44.5,
		component: TableComponent
	},
	{
		id: 'parcoord',
		title: 'Parallel Coordinates',
		width: 66.66,
		height: 44.5,
		component: ParcoordComponent
	}
];
