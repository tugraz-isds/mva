import type { View } from './types';
import SplomComponent from '../splom/SPLOMComponent.svelte';
import ScatterplotComponent from '../scatterplot/ScatterplotComponent.svelte';
import SimmapComponent from '../simmap/SimmapComponent.svelte';
import PartitionsComponent from '../partitions/PartitionsComponent.svelte';
import TableComponent from '../table/TableComponent.svelte';
import ParcoordComponent from '../parcoord/ParcoordComponent.svelte';

export const views: View[] = [
  {
    id: 'splom',
    title: 'Scatterplot Matrix',
    visible: true,
    component: SplomComponent
  },
  {
    id: 'scatterplot',
    title: 'Scatterplot',
    visible: true,
    component: ScatterplotComponent
  },
  {
    id: 'simmap',
    title: 'Similarity Map',
    visible: true,
    component: SimmapComponent
  },
  {
    id: 'partitions',
    title: 'Partitions',
    visible: true,
    component: PartitionsComponent
  },
  {
    id: 'table',
    title: 'Table',
    visible: true,
    component: TableComponent
  },
  {
    id: 'parcoord',
    title: 'Parallel Coordinates',
    visible: true,
    component: ParcoordComponent
  }
];
