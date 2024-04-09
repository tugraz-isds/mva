import { range } from 'd3-array';

export const DEFAULT_PARTITION = 'Default';

// Helper function to reorder an array
export function reorderArray(arr: any[], fromIndex: number, toIndex: number) {
  const result = [...arr];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

// Helper function that returns whether item is a number
export function isNumber(item: any) {
  if (typeof item === 'number') return true;
  if (typeof item === 'string') return !isNaN(+item);
  return false;
}

// Helper function to compare 2 sets
export function areSetsEqual(set1: Set<number>, set2: Set<number>) {
  return set1.size === set2.size && [...set1].every((value) => set2.has(value));
}

export function isOffscreenCanvasSupported(canvas: HTMLCanvasElement) {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  let supportOffScreenWebGL = 'transferControlToOffscreen' in canvas;

  // If it's Safari, then check the version because Safari < 17 doesn't support OffscreenCanvas with a WebGL context
  if (isSafari) {
    const versionMatch = navigator.userAgent.match(/version\/(\d+)/i);
    const safariVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
    supportOffScreenWebGL = safariVersion >= 17;
  }

  return supportOffScreenWebGL;
}

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => ReturnType<T> | undefined) => {
  let prev = 0;
  return (...args: Parameters<T>) => {
    const now = new Date().getTime();
    if (now - prev > delay) {
      prev = now;
      return func(...args);
    }
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let debounceTimer: number | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export function generateEvenlySpacedNumbers(min: number, max: number, n: number, isInverted: boolean) {
  return isInverted
    ? range(0, n).map((i) => max + (i / n) * (min - max))
    : range(0, n).map((i) => min + (i / n) * (max - min));
}
