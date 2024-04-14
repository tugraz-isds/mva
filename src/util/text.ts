export function getTextWidth(text: string, fontSize: number, fontFamily: string) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  context.font = `${fontSize}px ${fontFamily}`;

  const textWidth = context.measureText(text).width;
  return textWidth;
}

export function getTextWidthArray(textArray: string[], fontSize: number, fontFamily: string) {
  const textWidths = [];
  for (const text of textArray) {
    textWidths.push(getTextWidth(text, fontSize, fontFamily));
  }

  return Math.max(...textWidths);
}

export function calculateMaxLength(text: string, fontSize: number, fontFamily: string, maxWidth: number) {
  let maxLength = 0;

  for (let i = 0; i < text.length; i++) {
    const substring = text.substring(0, i + 1);
    const substringWidth = getTextWidth(substring, fontSize, fontFamily);

    if (substringWidth <= maxWidth - 20) maxLength = i + 1;
    else break;
  }

  return maxLength;
}

export function calculateMaxLengthArray(textArray: string[], fontSize: number, fontFamily: string, maxWidth: number) {
  const maxLengths = [];
  for (const text of textArray) {
    maxLengths.push(calculateMaxLength(text, fontSize, fontFamily, maxWidth));
  }

  return Math.max(...maxLengths);
}

export function getLongestString(arr: string[]) {
  if (arr.length === 0) return '';
  return arr.reduce(function (a, b) {
    return a.length > b.length ? a : b;
  });
}

export function clearStringQuotes(str: string) {
  return str.trim().replace(new RegExp('^"', 'g'), '').replace(new RegExp('"$', 'g'), '');
}

export function capitalizeString(str: string) {
  if (str.length === 0) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
