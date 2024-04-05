import type { RgbaColor } from 'svelte-awesome-color-picker';

const COLOR_ACTIVE = 0x4169e1;
const COLOR_HOVERED = 0xef4444;
const COLOR_BRUSHED = 0xfb923c;
const COLOR_FILTERED = 0xcbd5e0;

const rgbaToHexNumber = (color: RgbaColor): number => {
  return (color.r << 16) | (color.g << 8) | color.b;
};

export { COLOR_ACTIVE, COLOR_HOVERED, COLOR_BRUSHED, COLOR_FILTERED, rgbaToHexNumber };
