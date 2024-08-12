export function getPanelMinSize(title: string) {
  if (title === 'parcoord') return 25;
  else if (title === 'partitions' || title === 'table') return 15;
  else return 20;
}
