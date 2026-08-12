import handlerTrigger from './handlerTrigger.js';
import handlerConditions from './handlerConditions.js';
import handlerInsertData from './handlerInsertData.js';
import handlerLoopData from './handlerLoopData.js';
import handlerLoopBreakpoint from './handlerLoopBreakpoint.js';

export {
  handlerTrigger,
  handlerConditions,
  handlerInsertData,
  handlerLoopData,
  handlerLoopBreakpoint,
};

export const defaultBlocksHandler: Record<string, Function> = {
  trigger: handlerTrigger,
  Trigger: handlerTrigger,
  conditions: handlerConditions,
  Conditions: handlerConditions,
  insertData: handlerInsertData,
  'insert-data': handlerInsertData,
  InsertData: handlerInsertData,
  loopData: handlerLoopData,
  'loop-data': handlerLoopData,
  LoopData: handlerLoopData,
  loopBreakpoint: handlerLoopBreakpoint,
  'loop-breakpoint': handlerLoopBreakpoint,
  LoopBreakpoint: handlerLoopBreakpoint,
};

export default defaultBlocksHandler;
