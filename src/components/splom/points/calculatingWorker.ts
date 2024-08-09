import { scaleLinear } from 'd3-scale';
import type { ScaleParamsType, TaskType } from '../types';

self.onmessage = function (message) {
  const { tasks, spacingX, spacingY, margin } = message.data;

  const points: any = [];

  tasks.forEach((task: TaskType) => {
    const xScale = calculateScale(task.xScale);
    const yScale = calculateScale(task.yScale);

    task.dimDataX.forEach((x, idx) => {
      let xPos = margin.left + spacingX * task.i + xScale(x);
      let yPos = margin.top + spacingY * task.j + yScale(task.dimDataY[idx]);
      points.push([xPos, yPos, 0]);
    });
  });

  postMessage({ points });
};

function calculateScale(scaleParams: ScaleParamsType) {
  return scaleLinear().domain(scaleParams.domain).range(scaleParams.range);
}
