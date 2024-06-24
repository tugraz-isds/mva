import type { RgbaColor } from 'svelte-awesome-color-picker';

const COLOR_ACTIVE = 0x4146cb;
const COLOR_HOVERED = 0xef4444;
const COLOR_BRUSHED = 0xfb923c;
const COLOR_FILTERED = 0xcbd5e0;

const rgbaToHexNumber = (color: RgbaColor): number => {
  return (color.r << 16) | (color.g << 8) | color.b;
};

const rgbaToHexString = (color?: RgbaColor): string => {
  if (!color) return '';
  const rHex = color.r.toString(16).padStart(2, '0');
  const gHex = color.g.toString(16).padStart(2, '0');
  const bHex = color.b.toString(16).padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
};

const hexStringToRgba = (hex: string): RgbaColor => {
  hex = hex.replace(/^#/, '');
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 6) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else throw new Error('Invalid hex string format. Expected #RRGGBB or #RRGGBBAA.');

  return { r, g, b, a: 255 };
};

export {
  COLOR_ACTIVE,
  COLOR_HOVERED,
  COLOR_BRUSHED,
  COLOR_FILTERED,
  rgbaToHexNumber,
  rgbaToHexString,
  hexStringToRgba
};
