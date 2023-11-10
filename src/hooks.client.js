import { datasetStore, labelDimension, dimensionTypeStore } from './stores/dataset';

const localDataset = localStorage.getItem('MVA_dataset');
localDataset && datasetStore.set(JSON.parse(localDataset));

const labelDim = localStorage.getItem('labelDimension');
labelDim && labelDimension.set(labelDim);

const dimensionTypes = localStorage.getItem('dimensionTypes');
dimensionTypes && dimensionTypeStore.set(new Map(JSON.parse(dimensionTypes)));
