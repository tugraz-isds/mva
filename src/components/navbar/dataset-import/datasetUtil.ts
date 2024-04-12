import { autoType, dsvFormat, type DSVParsedArray } from 'd3-dsv';
import type { DimensionDataType } from '../../../util/types';
import { isNumber } from '../../../util/util';
import { extent, max } from 'd3-array';

export const SELECT_DEFAULT_STYLE =
  'w-1/2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500';
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

export async function parseDataset(files: FileList, cellSeparator: string, decimalSeparator: string) {
  if (!files || files.length === 0) throw new Error('Upload valid CSV file.');
  if (cellSeparator === decimalSeparator) throw new Error('Cell separator cannot be the same as decimal separator.');

  const file = files[0];
  const text = await file.text();
  const parser = dsvFormat(cellSeparator);
  const dataset: DSVParsedArray<any> = parser.parse(text, autoType);

  const dimensions = Object.keys(dataset[0]);
  const tableDimensions = dimensions.map((dim) => ({ title: dim, visible: true }));
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
  localStorage.setItem('tableDimensions', JSON.stringify(tableDimensions));
  localStorage.setItem('dimensionTypes', JSON.stringify(Array.from(dimensionTypeMap.entries())));
  localStorage.setItem('MVA_dataset', JSON.stringify(dataset));

  return { dataset, tableDimensions, dimensionTypeMap, labelDim };
}
