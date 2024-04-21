import { datasetStore, labelDimension, dimensionDataStore } from './stores/dataset';
import { parcoordVisibleDimensionsStore } from './stores/parcoord';
import { partitionsDataStore, partitionsStore } from './stores/partitions';
import { tableVisibleDimensionsStore } from './stores/table';

const localDataset = localStorage.getItem('MVA_dataset');
localDataset && datasetStore.set(JSON.parse(localDataset));

const labelDim = localStorage.getItem('labelDimension');
labelDim && labelDimension.set(labelDim);

const dimensionTypes = localStorage.getItem('dimensionTypes');
dimensionTypes && dimensionDataStore.set(new Map(JSON.parse(dimensionTypes)));

const tableVisibleDimensions = localStorage.getItem('tableVisibleDimensions');
tableVisibleDimensions && tableVisibleDimensionsStore.set(JSON.parse(tableVisibleDimensions));

const parcoordVisibleDimensions = localStorage.getItem('parcoordVisibleDimensions');
parcoordVisibleDimensions && parcoordVisibleDimensionsStore.set(JSON.parse(parcoordVisibleDimensions));

const partitions = localStorage.getItem('partitions');
partitions && partitionsStore.set(new Map(JSON.parse(partitions)));

const partitionsData = localStorage.getItem('partitionsData');
partitionsData && partitionsDataStore.set(JSON.parse(partitionsData));
