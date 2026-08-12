const handlers: Record<string, (a: any, b: any) => boolean> = {
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '()': (a, b) => {
    if (typeof a === 'string' || Array.isArray(a)) {
      return a.includes(b);
    }
    return false;
  },
};

export default function compareBlockValue(type: string, valueA: any, valueB: any): boolean {
  const handler = handlers[type];
  if (handler) {
    return handler(valueA, valueB);
  }
  return false;
}

export { compareBlockValue };
