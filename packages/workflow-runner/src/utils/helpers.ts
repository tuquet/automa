export function parseJSON(data: any, def: any): any {
  if (typeof data !== 'string') return data ?? def;
  try {
    return JSON.parse(data);
  } catch (error) {
    return def;
  }
}

export function isObject(obj: any): boolean {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

export function objectHasKey(obj: any, key: string | number): boolean {
  if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

export function toCamelCase(str: string, capitalize = false): string {
  if (!str) return '';
  const result = str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => {
    return index === 0 && !capitalize
      ? letter.toLowerCase()
      : letter.toUpperCase();
  });

  return result.replace(/\s+|[-]/g, '');
}

export function sleep(timeout = 500): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

export async function waitTabLoaded({ tabId, ms = 500 }: { tabId?: number; ms?: number } = {}): Promise<void> {
  return sleep(ms);
}

export function isXPath(str: string): boolean {
  if (!str) return false;
  const regex = /^([(/@]|id\()/;
  return regex.test(str);
}

export function convertData(data: any, type: string): any {
  if (type === 'any') return data;

  let result = data;

  switch (type) {
    case 'integer':
      result = typeof data !== 'number' ? +(String(data ?? '').replace(/\D+/g, '')) : data;
      break;
    case 'boolean':
      result = Boolean(data);
      break;
    case 'array':
      result = Array.from(data ?? []);
      break;
    case 'string':
      result = String(data ?? '');
      break;
    default:
  }

  return result;
}

export function convertArrObjTo2DArr(arr: any[]): any[][] {
  const keyIndex = new Map<string, number>();
  const values: any[][] = [[]];

  arr.forEach((obj) => {
    if (!isObject(obj)) return;
    const keys = Object.keys(obj);
    const row: any[] = [];

    keys.forEach((key) => {
      if (!keyIndex.has(key)) {
        keyIndex.set(key, keyIndex.size);
        values[0].push(key);
      }

      const value = obj[key];
      const rowIndex = keyIndex.get(key)!;
      row[rowIndex] = typeof value === 'object' ? JSON.stringify(value) : value;
    });

    values.push([...row]);
  });

  return values;
}

export function convert2DArrayToArrayObj(values: any[][]): any[] {
  if (!values || values.length === 0) return [];
  const copy = [...values];
  let keyIndex = 0;
  const keys: string[] = copy.shift() || [];
  const result: any[] = [];

  for (let columnIndex = 0; columnIndex < copy.length; columnIndex += 1) {
    const currentColumn: Record<string, any> = {};

    for (let rowIndex = 0; rowIndex < copy[columnIndex].length; rowIndex += 1) {
      let key = keys[rowIndex];

      if (!key) {
        keyIndex += 1;
        key = `_row${keyIndex}`;
        keys.push(key);
      }

      currentColumn[key] = copy[columnIndex][rowIndex];
    }

    result.push(currentColumn);
  }

  return result;
}
