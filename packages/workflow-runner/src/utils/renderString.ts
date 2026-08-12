import objectPath from 'object-path';
import { parseJSON } from './helpers.js';

export interface RenderStringResult {
  list: Record<string, any>;
  value: any;
}

const refKeys: Record<string, string> = {
  table: 'table',
  dataColumn: 'table',
  dataColumns: 'table',
};

function extractStrFunction(str: string) {
  const trimmed = str.trim();
  const extractedStr = /^\$\s*(\w+)\s*\(([\s\S]*)\)$/.exec(trimmed);

  if (!extractedStr) return null;
  const { 1: name, 2: funcParams } = extractedStr;
  const rawParams = funcParams.trim();
  if (!rawParams) {
    return { name, params: [] };
  }

  const params = rawParams
    .split(/,(?=(?:[^'"\\"\\']*['"][^'"]*['"\\"\\'])*[^'"]*$)/)
    .map((param) => param.trim());

  return { name, params };
}

const builtInFunctions: Record<string, (...args: any[]) => any> = {
  date(...args: any[]) {
    let dateFormat = 'YYYY-MM-DD';
    let date = new Date();
    if (args.length === 1 && args[0]) {
      dateFormat = args[0];
    } else if (args.length >= 2) {
      date = new Date(args[0]);
      dateFormat = args[1];
    }
    if (isNaN(date.getTime())) date = new Date();
    if (dateFormat === 'timestamp') return date.getTime();
    if (dateFormat === 'relative') return 'just now';

    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    const YYYY = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const DD = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());

    return dateFormat
      .replace(/YYYY/g, String(YYYY))
      .replace(/MM/g, MM)
      .replace(/DD/g, DD)
      .replace(/hh/g, hh)
      .replace(/mm/g, mm)
      .replace(/ss/g, ss);
  },
  randint(min = 0, max = 100) {
    const minNum = +min || 0;
    const maxNum = +max || 100;
    return Math.round(Math.random() * (maxNum - minNum) + minNum);
  },
  getLength(val: any) {
    const parsed = parseJSON(val, val);
    return parsed?.length ?? 0;
  },
  slice(val: any, start?: any, end?: any) {
    const target = parseJSON(val, val);
    if (!target || typeof target.slice !== 'function') return target;
    const s = isNaN(+start) ? 0 : +start;
    const e = isNaN(+end) ? target.length : +end;
    return target.slice(s, e);
  },
  randData(str: any) {
    if (Array.isArray(str)) {
      return str[Math.floor(Math.random() * str.length)];
    }
    return String(str || '');
  },
  toLowerCase(val: any) {
    return String(val || '').toLowerCase();
  },
  toUpperCase(val: any) {
    return String(val || '').toUpperCase();
  },
  stringify(val: any) {
    return JSON.stringify(val);
  },
};

export function keyParser(key: string, data: Record<string, any>) {
  let [dataKey, path] = key.split(/[@.](.+)/);
  dataKey = refKeys[dataKey] ?? dataKey;

  if (!path) return { dataKey, path: '' };

  if (dataKey !== 'table') {
    if (dataKey === 'loopData' && !path.endsWith('.$index')) {
      const pathArr = path.split('.');
      pathArr.splice(1, 0, 'data');
      path = pathArr.join('.');
    }
    return { dataKey, path };
  }

  const [firstPath, restPath] = path.split(/\.(.+)/);
  const tableData = data.table || [];

  if (firstPath === '$last') {
    const lastIndex = Math.max(0, tableData.length - 1);
    path = `${lastIndex}.${restPath || ''}`;
  } else if (!restPath) {
    path = `0.${firstPath}`;
  } else if (isNaN(+firstPath)) {
    path = `0.${firstPath}.${restPath}`;
  }

  path = path.replace(/\.$/, '');

  return { dataKey: 'table', path };
}

function resolveParam(p: string, refData: Record<string, any>): any {
  const trimmed = p.trim();
  if (!trimmed) return '';

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return trimmed.slice(1, -1);
  }

  const NOT_JSON = Symbol('NOT_JSON');
  const parsed = parseJSON(trimmed, NOT_JSON);
  if (parsed !== NOT_JSON) {
    return parsed;
  }

  const { dataKey, path } = keyParser(trimmed, refData);
  const targetObj = refData[dataKey];
  if (targetObj !== undefined && targetObj !== null) {
    if (path) {
      const val = objectPath.get(targetObj, path);
      if (val !== undefined) return val;
    } else {
      return targetObj;
    }
  }

  return trimmed;
}

export async function renderString(
  str: any,
  refData: Record<string, any> = {},
  isPopup = false
): Promise<RenderStringResult> {
  if (!str || typeof str !== 'string') {
    return { list: {}, value: str ?? '' };
  }

  const hasMustacheTag = /\{\{([\s\S]*?)\}\}/.test(str);
  if (!hasMustacheTag) {
    return { list: {}, value: str };
  }

  const replaceList: Record<string, any> = {};
  const trimmedStr = str.trim();
  const tagMatches = Array.from(trimmedStr.matchAll(/\{\{([\s\S]*?)\}\}/g));
  const isSingleTag = tagMatches.length === 1 && tagMatches[0][0] === trimmedStr;
  let singleTagResult: any = undefined;

  const renderedValue = str.replace(/\{\{([\s\S]*?)\}\}/g, (match, rawKey) => {
    let key = rawKey.trim();
    if (!key) return '';

    let result: any = undefined;
    const isFunc = extractStrFunction(key);

    if (isFunc && builtInFunctions[isFunc.name]) {
      const params = isFunc.params.map((p) => resolveParam(p, refData));
      result = builtInFunctions[isFunc.name](...params);
    } else {
      const { dataKey, path } = keyParser(key, refData);
      const targetObj = refData[dataKey];

      if (targetObj !== undefined && targetObj !== null) {
        if (path) {
          result = objectPath.get(targetObj, path);
        } else {
          result = targetObj;
        }
      }

      if (result === undefined) {
        result = match;
      }
    }

    replaceList[match] = typeof result === 'object' ? JSON.stringify(result) : String(result);

    if (isSingleTag) {
      singleTagResult = result;
    }

    return typeof result === 'object' ? JSON.stringify(result) : String(result);
  });

  return {
    list: replaceList,
    value: isSingleTag && singleTagResult !== undefined ? singleTagResult : renderedValue,
  };
}

export default renderString;

