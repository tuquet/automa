export function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

export function parseJSON(str: string, def: any): any {
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    return def;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function toCamelCase(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function objectHasKey(obj: any, key: any): boolean {
  if (!isObject(obj) && !Array.isArray(obj)) return false;
  return key in obj;
}

export function convertData(data: any, type: string): any {
  if (type === 'string') return String(data);
  if (type === 'number') return Number(data);
  if (type === 'boolean') return Boolean(data);
  if (type === 'array') return Array.isArray(data) ? data : [data];
  return data;
}

export async function waitTabLoaded(options: { tabId: number; ms: number }): Promise<void> {
  // Wait tab loaded handled by browserAdapter now, this is fallback
  await sleep(100);
}

export function clearCache(workflow: any): void {
  // Clear workflow cache
}
