export function getPanelMinSize(title: string) {
  if (title === 'parcoord') return 25;
  else if (title === 'partitions' || title === 'table') return 15;
  else return 20;
}

export function getDefaultPanelSizes(numPanels: number) {
  switch (numPanels) {
    case 3:
      return [50, 50];
    case 4:
      return [50, 50, 50, 50];
    case 5:
      return [33.33, 33.33, 33.33, 50, 50];
    case 6:
      return [33.33, 33.33, 33.33, 20, 30, 50];
    default:
      return [33.33, 33.33, 33.33, 20, 30, 50];
  }
}
