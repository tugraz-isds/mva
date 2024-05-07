import { autoType, dsvFormat, type DSVParsedArray } from 'd3-dsv';
import { DEFAULT_PARTITION, isNumber } from '../../../util/util';
import { extent, max } from 'd3-array';
import type { DimensionDataType } from '../../../util/types';
import type { PartitionType } from '../../partitions/types';
import { hexStringToRgba, rgbaToHexString } from '../../../util/colors';

export const CELL_SEPARATOR_LIST = [
  { value: ',', name: 'Comma' },
  { value: ';', name: 'Semicolon' },
  { value: '\t', name: 'Tab' },
  { value: ' ', name: 'Space' },
  { value: 'other', name: 'Other' }
];
export const DECIMAL_SEPARATOR_LIST = [
  { value: '.', name: 'Dot' },
  { value: ',', name: 'Comma' }
];
export const COLUMN_TYPE_LIST = [
  { value: 'numerical', name: 'Numerical' },
  { value: 'categorical', name: 'Categorical' }
];
const PREVIEW_ROW_NO = 10;

export async function parseDatasetPreview(file: File) {
  const reader = file.stream().getReader();
  let previewHeaderString = '';
  const previewRowsString = [];
  const decoder = new TextDecoder();
  let { value: chunk, done } = await reader.read();
  let textChunk = decoder.decode(chunk, { stream: true });
  let startIndex = 0;

  while (!done && previewRowsString.length < PREVIEW_ROW_NO) {
    const endIndex = textChunk.indexOf('\n', startIndex);
    if (endIndex === -1) {
      ({ value: chunk, done } = await reader.read());
      textChunk += decoder.decode(chunk, { stream: !done });
      continue;
    }

    if (startIndex === 0) previewHeaderString = textChunk.substring(startIndex, endIndex);
    else previewRowsString.push(textChunk.substring(startIndex, endIndex));
    startIndex = endIndex + 1;

    if (previewRowsString.length === PREVIEW_ROW_NO) break;
  }

  return { previewHeaderString, previewRowsString };
}

function parsePartitions(
  dimensions: string[],
  dataset: DSVParsedArray<any>,
  partitionsMap: Map<string, PartitionType>,
  partitionsData: string[]
) {
  if (dimensions.includes('_partition')) {
    if (!dimensions.includes('_partition_color') || !dimensions.includes('_partition_shape'))
      throw new Error('Not all required partition columns are present.');

    dataset.forEach((row) => {
      if (partitionsMap.has(row._partition)) {
        const partition = partitionsMap.get(row._partition) as PartitionType;
        partition.size++;
        partitionsMap.set(row._partition, partition);
      } else {
        partitionsMap.set(row._partition, {
          size: 1,
          shape: row._partition_shape,
          color: hexStringToRgba(row._partition_color),
          visible: true
        });
      }
      partitionsData.push(row._partition);
    });

    if (!partitionsMap.has(DEFAULT_PARTITION)) {
      const partitionsMapNew: Map<string, PartitionType> = new Map([
        [
          DEFAULT_PARTITION,
          {
            size: 0,
            shape: 'circle',
            color: hexStringToRgba('#4146cb'),
            visible: true
          }
        ],
        ...Array.from(partitionsMap.entries())
      ]);
      partitionsMap = partitionsMapNew;
    }
  } else {
    partitionsMap.set(DEFAULT_PARTITION, {
      size: dataset.length,
      shape: 'circle',
      color: hexStringToRgba('#4146cb'),
      visible: true
    });
    partitionsData = Array(dataset.length).fill(DEFAULT_PARTITION);
  }

  return { partitionsMap, partitionsData };
}

export async function getCsvFromFile(files: FileList) {
  try {
    const file = files[0];
    const text = await file.text();
    return text;
  } catch {
    throw new Error('Upload valid CSV file.');
  }
}

export async function getCsvFromUrl(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const text = await response.text();
    return text;
  } catch {
    throw new Error('Dataset URL not valid.');
  }
}

export async function parseDataset(text: string, cellSeparator: string, decimalSeparator: string) {
  if (cellSeparator === decimalSeparator) throw new Error('Cell separator cannot be the same as decimal separator.');

  const parser = dsvFormat(cellSeparator);
  const dataset: DSVParsedArray<any> = parser.parse(text, autoType);

  let dimensions = Object.keys(dataset[0]);

  let partitionsMap: Map<string, PartitionType> = new Map();
  let partitionsData: string[] = [];
  ({ partitionsMap, partitionsData } = parsePartitions(dimensions, dataset, partitionsMap, partitionsData));

  dimensions = dimensions.filter((dim) => !dim.includes('_partition'));

  const shownDimensions = dimensions.map((dim) => ({ title: dim, visible: true }));
  const dimensionTypeMap = new Map<string, DimensionDataType>(new Map());
  dimensions.forEach((dim: string) => {
    const dimData = dataset.map((d) => d[dim]);
    const longestString = dimData.reduce((longest, currentStr) => {
      currentStr = currentStr ?? '';
      return currentStr.toString().length > longest.toString().length ? currentStr : longest;
    }, '');
    if (isNumber(dataset[0][dim])) {
      const dimExtent: any = extent(dataset, (d: any) => +d[dim]);
      const maxNumberOfDecimals = max(dimData, (number: number) => {
        const numberOfDecimals = number?.toString().includes('.') ? number.toString().split('.')[1].length : 0;
        return numberOfDecimals;
      });
      dimensionTypeMap.set(dim, {
        type: 'numerical',
        min: dimExtent[0],
        max: dimExtent[1],
        numberOfDecimals: maxNumberOfDecimals ?? null,
        longestString: longestString ?? '',
        active: true
      });
    } else
      dimensionTypeMap.set(dim, {
        type: 'categorical',
        min: null,
        max: null,
        numberOfDecimals: null,
        longestString: longestString ?? '',
        active: true
      });
  });

  const labelDim = Object.keys(dataset[0])[0]; // Set first dimension as label
  localStorage.setItem('labelDimension', labelDim);
  localStorage.setItem('tableVisibleDimensions', JSON.stringify(shownDimensions));
  localStorage.setItem('parcoordVisibleDimensions', JSON.stringify(shownDimensions));
  localStorage.setItem('dimensionTypes', JSON.stringify(Array.from(dimensionTypeMap.entries())));
  localStorage.setItem('MVA_dataset', JSON.stringify(dataset));

  return { dataset, shownDimensions, dimensionTypeMap, labelDim, partitionsMap, partitionsData };
}

export function exportDataset(
  dataset: DSVParsedArray<any>[],
  dimensions: string[],
  cellSeparator: string,
  decimalSeparator: string,
  dimensionData: Map<string, DimensionDataType>,
  exportPartitions: boolean,
  partitionsData: string[],
  partitions: Map<string, PartitionType>
) {
  const rows = dataset
    .map((row: any, i: number) => {
      const dimensionValues = dimensions
        .map((dim) => {
          const value = row[dim];
          if (dimensionData.get(dim)?.type === 'numerical' && decimalSeparator !== '.') {
            return value.toString().replace('.', decimalSeparator);
          }
          return value;
        })
        .join(cellSeparator);

      if (exportPartitions) {
        const partitionInfo = partitions.get(partitionsData[i]);
        return `${dimensionValues}${cellSeparator}${partitionsData[i]}${cellSeparator}${rgbaToHexString(
          partitionInfo?.color
        )}${cellSeparator}${partitionInfo?.shape}`;
      } else {
        return dimensionValues;
      }
    })
    .join('\n');

  const headers = exportPartitions
    ? [...dimensions, '_partition', '_partition_color', '_partition_shape'].join(cellSeparator)
    : dimensions.join(cellSeparator);

  const datasetString = `${headers}\n${rows}`;

  const datasetBlob = new Blob([datasetString], {
    type: 'text/csv'
  });
  const datasetUrl = URL.createObjectURL(datasetBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = datasetUrl;
  downloadLink.download = 'dataset.csv';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
