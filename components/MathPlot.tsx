
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FunctionDef } from '../types';
import { evaluateFunction, findSpecialPoints } from '../utils/mathUtils';

interface MathPlotProps {
  functions: FunctionDef[];
  viewport: { x: [number, number], y: [number, number] };
}

const MathPlot: React.FC<MathPlotProps> = ({ functions, viewport }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3.scaleLinear().domain(viewport.x).range([0, width]);
    const yScale = d3.scaleLinear().domain(viewport.y).range([height, 0]);

    // Grid
    const g = svg.append("g");
    g.append("g")
      .attr("transform", `translate(0, ${yScale(0)})`)
      .call(d3.axisBottom(xScale).ticks(10).tickSize(-height).tickPadding(10))
      .selectAll(".tick line").attr("stroke", "#334155").attr("stroke-dasharray", "2,2");

    g.append("g")
      .attr("transform", `translate(${xScale(0)}, 0)`)
      .call(d3.axisLeft(yScale).ticks(10).tickSize(-width).tickPadding(10))
      .selectAll(".tick line").attr("stroke", "#334155").attr("stroke-dasharray", "2,2");

    svg.selectAll(".domain").remove();
    svg.selectAll(".tick text").attr("fill", "#94a3b8");

    const line = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .defined(d => !isNaN(d[1]) && isFinite(d[1]));

    const areaGen = d3.area<[number, number]>()
      .x(d => xScale(d[0]))
      .y0(yScale(0))
      .y1(d => yScale(d[1]))
      .defined(d => !isNaN(d[1]) && isFinite(d[1]));

    functions.filter(f => f.visible).forEach(fn => {
      const paramsMap = fn.parameters.reduce((acc, p) => ({ ...acc, [p.name]: p.value }), {});
      
      const points: [number, number][] = [];
      const samples = 400;
      const step = (viewport.x[1] - viewport.x[0]) / samples;
      for (let x = viewport.x[0]; x <= viewport.x[1]; x += step) {
        points.push([x, evaluateFunction(fn.expression, x, paramsMap)]);
      }

      // Integral Area
      if (fn.showIntegral && fn.integralRange) {
        const integralPoints = points.filter(p => p[0] >= fn.integralRange![0] && p[0] <= fn.integralRange![1]);
        svg.append("path")
          .datum(integralPoints)
          .attr("fill", fn.color)
          .attr("opacity", 0.2)
          .attr("d", areaGen);
      }

      // Main Function Line
      svg.append("path")
        .datum(points)
        .attr("fill", "none")
        .attr("stroke", fn.color)
        .attr("stroke-width", 3)
        .attr("d", line);

      // Tangent Line
      if (fn.showTangent && fn.tangentX !== undefined) {
        const x0 = fn.tangentX;
        const y0 = evaluateFunction(fn.expression, x0, paramsMap);
        
        // Numerical derivative for tangent slope
        const h = 0.0001;
        const slope = (evaluateFunction(fn.expression, x0 + h, paramsMap) - evaluateFunction(fn.expression, x0 - h, paramsMap)) / (2 * h);
        
        if (!isNaN(y0) && !isNaN(slope)) {
            const tangentLength = 4;
            const xStart = x0 - tangentLength;
            const xEnd = x0 + tangentLength;
            const yStart = y0 + slope * (xStart - x0);
            const yEnd = y0 + slope * (xEnd - x0);

            svg.append("line")
                .attr("x1", xScale(xStart)).attr("y1", yScale(yStart))
                .attr("x2", xScale(xEnd)).attr("y2", yScale(yEnd))
                .attr("stroke", "#fff")
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "5,3")
                .attr("opacity", 0.8);
            
            svg.append("circle")
                .attr("cx", xScale(x0)).attr("cy", yScale(y0))
                .attr("r", 4).attr("fill", "#fff");
        }
      }

      // Special Points
      const { roots, extrema, yIntercept } = findSpecialPoints(fn.expression, paramsMap, viewport.x);
      const allSpecial = [...roots, ...extrema, yIntercept].filter(p => p !== null);

      svg.selectAll(`.pt-${fn.id}`)
        .data(allSpecial)
        .enter()
        .append("g")
        .each(function(d) {
           const g = d3.select(this);
           g.append("circle")
            .attr("cx", xScale(d.x))
            .attr("cy", yScale(d.y))
            .attr("r", 5)
            .attr("fill", fn.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);

           // Label for roots
           if (d.type === 'root') {
               g.append("text")
                .attr("x", xScale(d.x))
                .attr("y", yScale(d.y) - 10)
                .attr("text-anchor", "middle")
                .attr("fill", "#fff")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .text(d.x.toFixed(2));
           }
        })
        .on("mouseenter", (event, d) => {
            svg.append("text").attr("id", "tooltip")
                .attr("x", xScale(d.x) + 10).attr("y", yScale(d.y) - 10)
                .attr("fill", "white").attr("font-size", "12px").text(d.label);
        })
        .on("mouseleave", () => svg.select("#tooltip").remove());

      // Limit visualization
      if (fn.showLimit && fn.limitX !== undefined) {
        const lx = fn.limitX;
        const ly = evaluateFunction(fn.expression, lx, paramsMap);
        if (!isNaN(ly)) {
           const limitG = svg.append("g");
           limitG.append("line")
             .attr("x1", xScale(lx)).attr("y1", 0)
             .attr("x2", xScale(lx)).attr("y2", height)
             .attr("stroke", "#fbbf24").attr("stroke-dasharray", "4,4");
           
           const arrowOffset = 1.0;
           limitG.append("path")
             .attr("d", d3.line()([[xScale(lx - arrowOffset), yScale(ly) + 10], [xScale(lx), yScale(ly)]]))
             .attr("stroke", "#fbbf24").attr("fill", "none").attr("marker-end", "url(#arrow)");
           
           limitG.append("circle")
             .attr("cx", xScale(lx)).attr("cy", yScale(ly)).attr("r", 6)
             .attr("fill", "none").attr("stroke", "#fbbf24").attr("stroke-width", 2);
        }
      }
    });

    // Arrow Marker
    svg.append("defs").append("marker")
      .attr("id", "arrow").attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
      .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "#fbbf24");

  }, [functions, viewport]);

  return (
    <div ref={containerRef} className="w-full h-full bg-[#0f172a] relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

export default MathPlot;
