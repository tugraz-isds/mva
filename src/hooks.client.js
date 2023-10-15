import { datasetStore, labelDimension } from './stores/dataset';

// Read dataset from localStorage on app startup
const localDataset = localStorage.getItem('MVA_dataset');
localDataset && datasetStore.set(JSON.parse(localDataset));

const labelDim = localStorage.getItem('labelDimension');
labelDim && labelDimension.set(labelDim);
