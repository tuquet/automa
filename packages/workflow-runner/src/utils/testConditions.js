import { parseJSON } from './helpers.js';
import { conditionBuilder } from './shared.js';
import renderString from './renderString.js';

const isBoolStr = (str) => {
  if (str === 'true') return true;
  if (str === 'false') return false;
  return str;
};

const isNumStr = (str) => (Number.isNaN(+str) ? str : +str);

const comparisons = {
  eq: (a, b) => a === b,
  eqi: (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase(),
  nq: (a, b) => a !== b,
  gt: (a, b) => isNumStr(a) > isNumStr(b),
  gte: (a, b) => isNumStr(a) >= isNumStr(b),
  lt: (a, b) => isNumStr(a) < isNumStr(b),
  lte: (a, b) => isNumStr(a) <= isNumStr(b),
  cnt: (a, b) => String(a ?? '').includes(String(b ?? '')),
  cni: (a, b) => String(a ?? '').toLowerCase().includes(String(b ?? '').toLowerCase()),
  nct: (a, b) => !comparisons.cnt(a, b),
  nci: (a, b) => !comparisons.cni(a, b),
  stw: (a, b) => String(a ?? '').startsWith(String(b ?? '')),
  enw: (a, b) => String(a ?? '').endsWith(String(b ?? '')),
  rgx: (a, b) => {
    const match = String(b).match(/^\/(.*?)\/([gimy]*)$/);
    const regex = match ? new RegExp(match[1], match[2]) : new RegExp(String(b));
    return regex.test(String(a));
  },
  itr: (a) => Boolean(isBoolStr(a)),
  ifl: (a) => !isBoolStr(a),
};

const convertDataType = {
  string: (val) => `${val}`,
  number: (val) => +val,
  json: (val) => parseJSON(val, null),
  boolean: (val) => Boolean(isBoolStr(val)),
};

function cloneDeep(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  return JSON.parse(JSON.stringify(obj));
}

export default async function testConditions(conditionsArr, workflowData) {
  const result = {
    isMatch: false,
    replacedValue: {},
  };

  if (!conditionsArr || !Array.isArray(conditionsArr)) {
    return result;
  }

  async function getConditionItemValue({ type, data }) {
    if (type.startsWith('data')) {
      let dataPath = (data.dataPath || '').trim().replace('@', '.');
      const isInsideBrackets = dataPath.startsWith('{{') && dataPath.endsWith('}}');

      if (!isInsideBrackets) {
        dataPath = `{{${dataPath}}}`;
      }

      let dataExists = await renderString(
        dataPath,
        workflowData?.refData || {},
        workflowData?.isPopup || false
      );
      dataExists = Boolean(parseJSON(dataExists.value, false));

      return dataExists;
    }

    const copyData = cloneDeep(data || {});

    for (const key of Object.keys(copyData)) {
      const { value, list } = await renderString(
        copyData[key],
        workflowData?.refData || {},
        workflowData?.isPopup || false
      );

      copyData[key] = value ?? '';
      Object.assign(result.replacedValue, list);
    }

    if (type === 'value') {
      const regex = /^(json|string|number|boolean)::/;
      if (regex.test(copyData.value)) {
        const [dataType, value] = copyData.value.split(/::(.*)/s);
        return convertDataType[dataType] ? convertDataType[dataType](value) : value;
      }

      return copyData.value;
    }

    if (type.startsWith('code')) {
      let conditionValue;

      const newRefData = {};
      Object.keys(workflowData?.refData || {}).forEach((keyword) => {
        if (!copyData.code?.includes(keyword)) return;
        newRefData[keyword] = workflowData.refData[keyword];
      });

      if (workflowData?.checkCodeCondition) {
        conditionValue = await workflowData.checkCodeCondition({
          data: copyData,
          refData: newRefData,
          isPopup: workflowData?.isPopup,
        });
      }

      return conditionValue;
    }

    if (type.startsWith('element')) {
      if (workflowData?.sendMessage) {
        const conditionValue = await workflowData.sendMessage({
          type: 'condition-builder',
          data: {
            type,
            data: copyData,
          },
        });

        return conditionValue;
      }
    }

    return '';
  }

  async function checkConditions(items) {
    let conditionResult = true;
    const condition = {
      value: '',
      operator: '',
    };

    for (const { category, data, type } of items) {
      if (!conditionResult) return conditionResult;

      if (category === 'compare') {
        const typeConfig = conditionBuilder.compareTypes.find(
          ({ id }) => id === type
        );

        if (!typeConfig) {
          return conditionResult;
        }

        const { needValue } = typeConfig;

        if (!needValue) {
          conditionResult = comparisons[type] ? comparisons[type](condition.value) : false;
          return conditionResult;
        }

        condition.operator = type;
      } else if (category === 'value') {
        const conditionValue = await getConditionItemValue({ data, type });
        const valueConfig = conditionBuilder.valueTypes.find(
          ({ id }) => id === type
        );

        if (!valueConfig) {
          conditionResult = conditionValue;
        } else {
          const { compareable } = valueConfig;
          if (!compareable) {
            conditionResult = conditionValue;
          } else if (condition.operator) {
            conditionResult = comparisons[condition.operator]
              ? comparisons[condition.operator](condition.value, conditionValue)
              : false;

            condition.operator = '';
          }
        }

        condition.value = conditionValue;
      }
    }

    return conditionResult;
  }

  for (const { conditions } of conditionsArr) {
    if (result.isMatch) return result;

    let isAllMatch = false;

    if (Array.isArray(conditions)) {
      for (const { items } of conditions) {
        if (Array.isArray(items)) {
          isAllMatch = await checkConditions(items);
          if (!isAllMatch) break;
        }
      }
    }

    result.isMatch = isAllMatch;
  }

  return result;
}
