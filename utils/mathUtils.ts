
// @ts-ignore: mathjs is loaded via CDN
const math = window.math;

// CIS Standard aliases for mathjs
const cisAliases = {
  tg: math.tan,
  ctg: (x: any) => math.divide(1, math.tan(x)),
  arctg: math.atan,
  arcctg: (x: any) => math.subtract(math.divide(math.pi, 2), math.atan(x)),
  lg: math.log10,
  sh: math.sinh,
  ch: math.cosh,
  th: math.tanh,
  cth: math.coth,
  ln: math.log,
};

export const evaluateFunction = (expression: string, x: number, params: Record<string, number>): number => {
  try {
    const scope = { x, ...params, ...cisAliases };
    return math.evaluate(expression, scope);
  } catch (e) {
    return NaN;
  }
};

export const getDerivativeExpression = (expression: string): string => {
  try {
    // 1. Стандартизация для mathjs
    let standardized = expression
      .replace(/tg/g, 'tan')
      .replace(/ctg/g, '(1/tan(x))')
      .replace(/arctg/g, 'atan')
      .replace(/lg/g, 'log10')
      .replace(/sh/g, 'sinh')
      .replace(/ch/g, 'cosh')
      .replace(/th/g, 'tanh');
    
    // 2. Конвертация nthRoot(x, n) в x^(1/n) для гарантированного дифференцирования
    // mathjs лучше справляется со степенями в символьном виде
    standardized = standardized.replace(/nthRoot\(([^,]+),\s*([^)]+)\)/g, '($1)^(1/($2))');

    const derivative = math.derivative(standardized, 'x');
    return derivative.toString();
  } catch (e) {
    console.error("Derivative calculation failed:", e);
    return 'Error';
  }
};

export const findSpecialPoints = (
  expression: string, 
  params: Record<string, number>, 
  range: [number, number],
  steps: number = 300
): { roots: any[], extrema: any[], yIntercept: any | null } => {
  const roots: any[] = [];
  const extrema: any[] = [];
  let yIntercept: any | null = null;

  const f = (xVal: number) => evaluateFunction(expression, xVal, params);
  const df = (xVal: number) => {
    const h = 0.0001;
    const yPlus = f(xVal + h);
    const yMinus = f(xVal - h);
    if (isNaN(yPlus) || isNaN(yMinus)) return NaN;
    return (yPlus - yMinus) / (2 * h);
  };

  const xStart = range[0];
  const xEnd = range[1];
  const dx = (xEnd - xStart) / steps;

  const y0 = f(0);
  if (!isNaN(y0) && isFinite(y0)) {
    yIntercept = { x: 0, y: y0, type: 'intercept', label: `(0, ${y0.toFixed(2)})` };
  }

  let prevY = f(xStart);
  let prevDf = df(xStart);

  for (let i = 1; i <= steps; i++) {
    const x = xStart + i * dx;
    const y = f(x);
    const currDf = df(x);

    if (prevY * y <= 0 && !isNaN(y) && !isNaN(prevY)) {
      const rootX = x - y * (dx / (y - prevY));
      if(Math.abs(f(rootX)) < 0.1) {
        roots.push({ x: rootX, y: 0, type: 'root', label: `x ≈ ${rootX.toFixed(2)}` });
      }
    }

    if (prevDf * currDf <= 0 && !isNaN(currDf) && !isNaN(prevDf)) {
      const extX = x - currDf * (dx / (currDf - prevDf));
      const extY = f(extX);
      if (!isNaN(extY) && isFinite(extY)) {
        extrema.push({ 
          x: extX, 
          y: extY, 
          type: 'extrema', 
          label: `${currDf < prevDf ? 'Max' : 'Min'}: (${extX.toFixed(2)}, ${extY.toFixed(2)})` 
        });
      }
    }

    prevY = y;
    prevDf = currDf;
  }

  return { roots, extrema, yIntercept };
};
