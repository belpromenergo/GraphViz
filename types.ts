
export interface Parameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

export interface FunctionDef {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
  parameters: Parameter[];
  // Research tools
  showIntegral?: boolean;
  integralRange?: [number, number];
  showLimit?: boolean;
  limitX?: number;
  showDerivative?: boolean;
  showTangent?: boolean;
  tangentX?: number;
}

export interface Point {
  x: number;
  y: number;
  label?: string;
  type: 'root' | 'extrema' | 'intercept';
}
