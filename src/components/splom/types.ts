export type ScaleParamsType = {
  domain: [number, number];
  range: [number, number];
};

export type TaskType = {
  dimDataX: any[];
  dimDataY: any[];
  xScale: ScaleParamsType;
  yScale: ScaleParamsType;
  i: number;
  j: number;
};
