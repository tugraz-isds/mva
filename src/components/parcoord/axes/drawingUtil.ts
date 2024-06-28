import { axisLeft } from 'd3-axis';
import type { DimensionType } from '../../../util/types';
import {
  arrow_curved_down_icon,
  arrow_curved_up_icon,
  arrow_filter_down_hover_icon,
  arrow_filter_down_icon,
  arrow_filter_up_down_icon,
  arrow_filter_up_hover_icon,
  arrow_filter_up_icon,
  arrow_invert_down_icon,
  arrow_invert_up_icon,
  arrow_left_icon,
  arrow_right_icon,
  arrows_right_left_icon
} from '../../../util/icon-definitions';
import { getTextWidth } from '../../../util/text';
import type { BaseType, Selection } from 'd3-selection';

export const tickFormatter = (d: any, maxTickLength: number) => {
  let formattedTick = d.toString();
  formattedTick = formattedTick.substring(0, maxTickLength) + (formattedTick.length <= maxTickLength ? '' : '...');
  return formattedTick;
};

export function getAllTicks(domainValues: any, ticks: any) {
  if (ticks.indexOf(domainValues[0]) === -1) {
    if (((ticks[0] - domainValues[0]) * 100) / (domainValues[1] - domainValues[0]) < 10) ticks[0] = domainValues[0];
    else ticks.unshift(domainValues[0]);
  }
  if (ticks.indexOf(domainValues[1]) === -1) {
    if (((domainValues[1] - ticks[ticks.length - 1]) * 100) / (domainValues[1] - domainValues[0]) < 10)
      ticks[ticks.length - 1] = domainValues[1];
    else ticks.push(domainValues[1]);
  }
  return ticks;
}

export function getAxis(
  yScale: any,
  axisHeight: number,
  maxTickLength: number,
  dimType?: DimensionType,
  showLabels?: boolean
) {
  let axis;
  const domainValues = yScale.domain();
  if (dimType === 'numerical') {
    const ticks = yScale.ticks(5);
    getAllTicks(domainValues, ticks);
    axis = axisLeft(yScale).tickValues(showLabels ? ticks : []);
  } else {
    axis = axisLeft(yScale);
    const tickNumber = axisHeight / 10;
    const step = Math.ceil(domainValues.length / tickNumber);
    const tickValues = domainValues.filter((_: any, index: number) => index % step === 0);
    axis.tickValues(showLabels ? tickValues : []).tickFormat((d) => tickFormatter(d, maxTickLength));
  }

  return axis;
}

export function drawAxis(svg: Selection<BaseType, unknown, HTMLElement, any>, axis: any, x: number, y: number) {
  return svg.append('g').attr('class', 'parcoord-y-axis').attr('transform', `translate(${x}, ${y})`).call(axis);
}

export function drawAxisTitle(
  svg: Selection<BaseType, unknown, HTMLElement, any>,
  x: number,
  y: number,
  title: string,
  i: number,
  maxTitleLength: number,
  dimensionsLength: number,
  showCustomTooltip: (event: MouseEvent, axisTitle: string) => void,
  hideCustomTooltip: () => void,
  contextMenuAxes: any
) {
  const cursorString = getCursorSvgString(i, dimensionsLength);
  return svg
    .append('text')
    .attr('class', 'parcoord-axis-title')
    .attr('transform', `translate(${x}, ${y})`)
    .attr('font-size', '0.625rem')
    .style('text-anchor', 'middle')
    .style('cursor', `url("data:image/svg+xml;base64,${cursorString}, pointer`)
    .text(title.substring(0, maxTitleLength) + (title.length === maxTitleLength ? '' : '...'))
    .on('mouseenter', (e: MouseEvent) => showCustomTooltip(e, title))
    .on('mouseleave', hideCustomTooltip)
    .on('mousedown', hideCustomTooltip)
    .on('contextmenu', (e: MouseEvent) => contextMenuAxes.showContextMenu(e, i));
}

export function drawAxisInvertIcon(
  svg: Selection<BaseType, unknown, HTMLElement, any>,
  x: number,
  y: number,
  i: number,
  handleOnInvertAxesClick: (i: number) => void,
  inverted?: boolean
) {
  return svg
    .append('svg')
    .attr('class', 'parcoord-axis-invert cursor-pointer')
    .html(
      (inverted ? arrow_invert_down_icon : arrow_invert_up_icon).replace('<rect', '<rect fill="white" stroke="white"')
    )
    .attr('x', x)
    .attr('y', y)
    .attr('width', '1rem')
    .attr('height', '1rem')
    .attr('stroke', '#000')
    .attr('fill', '#000')
    .style(
      'cursor',
      `url("data:image/svg+xml;base64,${btoa(
        setSvgStyle(inverted ? arrow_curved_up_icon : arrow_curved_down_icon, 15, 15, '#000', '#f9f9f9')
      )}") 7 5, pointer`
    )
    .on('click', () => handleOnInvertAxesClick(i));
}

export function drawAxisUpperFilter(
  svg: Selection<BaseType, unknown, HTMLElement, any>,
  x: number,
  y: number,
  showFilter?: boolean
) {
  return svg
    .append('svg')
    .attr('class', 'parcoord-axis-filter-upper')
    .html(arrow_filter_down_icon)
    .attr('x', x)
    .attr('y', y)
    .attr('width', '1rem')
    .attr('height', '1rem')
    .attr('stroke', '#000')
    .attr('fill', 'rgba(255, 255, 100, 0.5)')
    .style('display', showFilter ? 'block' : 'none')
    .style(
      'cursor',
      `url("data:image/svg+xml;base64,${btoa(
        setSvgStyle(arrow_filter_down_hover_icon, 12, 12, '#000', '#f9f9f9')
      )}") 7 5, pointer`
    );
}

export function drawAxisLowerFilter(
  svg: Selection<BaseType, unknown, HTMLElement, any>,
  x: number,
  y: number,
  showFilter?: boolean
) {
  return svg
    .append('svg')
    .attr('class', 'parcoord-axis-filter-lower')
    .html(arrow_filter_up_icon)
    .attr('x', x)
    .attr('y', y)
    .attr('width', '1rem')
    .attr('height', '1rem')
    .attr('stroke', '#000')
    .attr('fill', 'rgba(255, 255, 100, 0.5)')
    .style('display', showFilter ? 'block' : 'none')
    .style(
      'cursor',
      `url("data:image/svg+xml;base64,${btoa(
        setSvgStyle(arrow_filter_up_hover_icon, 12, 12, '#000', '#f9f9f9')
      )}") 7 5, pointer`
    );
}

export function drawAxisUpperFilterValue(
  svg: Selection<BaseType, unknown, HTMLElement, any>,
  x: number,
  y: number,
  display: boolean,
  upperFilterValue: string
) {
  const group = svg
    .append('g')
    .attr('class', 'parcoord-axis-filter-upper-value')
    .attr('transform', `translate(${x}, ${y})`)
    .style('display', display ? 'none' : 'block');
  group
    .append('rect')
    .attr('class', 'parcoord-axis-filter-upper-value')
    .attr('width', getTextWidth(upperFilterValue, 10, 'sans-serif') + 8)
    .attr('height', 14)
    .attr('fill', 'lightgrey')
    .attr('stroke', 'black');
  group
    .append('text')
    .attr('font-size', '10')
    .attr('text-anchor', 'start')
    .attr('fill', 'black')
    .attr('x', 4)
    .attr('y', 10)
    .text(upperFilterValue);
  return group;
}

export function drawAxisLowerFilterValue(
  svg: Selection<BaseType, unknown, HTMLElement, any>,
  x: number,
  y: number,
  display: boolean,
  lowerFilterValue: string
) {
  const group = svg
    .append('g')
    .attr('class', 'parcoord-axis-filter-lower-value')
    .attr('transform', `translate(${x}, ${y})`)
    .style('display', display ? 'none' : 'block');
  group
    .append('rect')
    .attr('class', 'parcoord-axis-filter-lower-value')
    .attr('width', 30)
    .attr('height', 14)
    .attr('fill', 'lightgrey')
    .attr('stroke', 'black');
  group
    .append('text')
    .attr('font-size', '10')
    .attr('text-anchor', 'start')
    .attr('fill', 'black')
    .attr('x', 4)
    .attr('y', 10)
    .text(lowerFilterValue);
  return group;
}

export function drawAxisFilterRectangle(
  svg: Selection<BaseType, unknown, HTMLElement, any>,
  x: number,
  y: number,
  width: number,
  height: number,
  handleMouseEnter: () => void,
  handleMouseLeave: () => void,
  showMoveCursor: boolean,
  showFilter?: boolean
) {
  return svg
    .append('rect')
    .attr('class', 'parcoord-axis-filter-rect')
    .attr('width', width)
    .attr('height', height)
    .attr('y', y)
    .attr('fill', 'rgba(255, 255, 100, 0.2)')
    .attr('stroke', 'rgba(0, 0, 0, 0.25)')
    .attr('transform', `translate(${x}, 0)`)
    .style('display', showFilter ? 'block' : 'none')
    .style(
      'cursor',
      showMoveCursor
        ? `url("data:image/svg+xml;base64,${btoa(
            setSvgStyle(arrow_filter_up_down_icon, 12, 16, '#000', '#f9f9f9')
          )}") 7 5, pointer`
        : 'default'
    )
    .on('mouseenter', handleMouseEnter)
    .on('mouseleave', handleMouseLeave);
}

export function getAxisDomainValue(
  i: number,
  percentage: number,
  yScales: any,
  dimensions: string[],
  numberOfDecimals?: number | null
) {
  const axisDomain = yScales[dimensions[i]].domain();
  const axisRange = axisDomain[1] - axisDomain[0];
  return (axisDomain[0] + (1 - percentage) * axisRange).toFixed(numberOfDecimals);
}

export function setSvgStyle(svg: string, width: number, height: number, stroke: string, fill: string) {
  return svg.replace('<svg', `<svg width="${width}" height="${height}" stroke="${stroke}" fill="${fill}"`);
}

function getCursorSvgString(i: number, dimLength: number) {
  return i === 0
    ? `${btoa(setSvgStyle(arrow_right_icon, 14, 10, '#000', '#f9f9f9'))}") 7 5`
    : i === dimLength - 1
    ? `${btoa(setSvgStyle(arrow_left_icon, 14, 10, '#000', '#f9f9f9'))}") 7 5`
    : `${btoa(setSvgStyle(arrows_right_left_icon, 16, 16, '#000', '#f9f9f9'))}") 8 8`;
}
