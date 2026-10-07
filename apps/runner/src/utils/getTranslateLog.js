import { getBlocks } from '@/utils/getSharedData';
import dayjs from '@/lib/dayjs';
import { countDuration } from '@/utils/helper';
import { messageHasReferences } from '@/utils/shared';

const blocks = getBlocks();

function translateLog(log) {
  const copyLog = { ...log };
  const blockDefName = blocks[log.name]?.name || log.name || 'Block';

  if (['finish', 'stop'].includes(log.type)) {
    copyLog.name = log.type;
  } else {
    copyLog.name = blockDefName;
  }

  if (copyLog.message && messageHasReferences.includes(copyLog.message)) {
    copyLog.messageId = `${copyLog.message}`;
  }

  copyLog.message = log.message || '';

  return copyLog;
}

function getDataSnapshot(propsCtxData, refData) {
  if (!propsCtxData?.dataSnapshot) return;

  const data = propsCtxData.dataSnapshot;
  const getData = (key) => {
    const currentData = refData[key];
    if (typeof currentData !== 'string') return currentData;

    return data[currentData] ?? {};
  };

  refData.loopData = getData('loopData');
  refData.variables = getData('variables');
}

function getLogs(dataType, translatedLog, curStateCtxData) {
  let data = dataType === 'plain-text' ? '' : [];
  const getItemData = {
    'plain-text': ([
      timestamp,
      duration,
      status,
      name,
      description,
      message,
      ctxData,
    ]) => {
      data += `${timestamp}(${countDuration(
        0,
        duration || 0
      ).trim()}) - ${status} - ${name} - ${description} - ${message} - ${JSON.stringify(
        ctxData
      )} \n`;
    },
    json: ([
      timestamp,
      duration,
      status,
      name,
      description,
      message,
      ctxData,
    ]) => {
      data.push({
        timestamp,
        duration: countDuration(0, duration || 0).trim(),
        status,
        name,
        description,
        message,
        data: ctxData,
      });
    },
  };
  translatedLog.forEach((item, index) => {
    let logData = curStateCtxData;
    if (logData.ctxData) logData = logData.ctxData;

    const itemData = logData[item.id] || null;
    if (itemData) getDataSnapshot(curStateCtxData, itemData.referenceData);

    getItemData[dataType](
      [
        dayjs(item.timestamp || Date.now()).format('YYYY-MM-DD HH:mm:ss'),
        item.duration,
        item.type.toUpperCase(),
        item.name,
        item.description || 'NULL',
        item.message || 'NULL',
        itemData,
      ],
      index
    );
  });
  return data;
}

export default function (curState, dataType = 'plain-text') {
  const { logs: curStateHistory, ctxData: curStateCtxData } = curState;
  const translatedLog = curStateHistory.map(translateLog);
  const logs = getLogs(dataType, translatedLog, curStateCtxData);
  return logs;
}
