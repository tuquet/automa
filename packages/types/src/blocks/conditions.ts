import type { BaseBlockData } from './common.js';
import type { SelectorType } from './interaction.js';

export interface RepeatTaskBlockData extends BaseBlockData {
  repeatFor?: string | number;
}

export interface ConditionRule {
  type: string;
  category?: string;
  data?: unknown;
  operator?: string;
  value?: unknown;
  [key: string]: unknown;
}

export interface ConditionPath {
  id: string;
  name?: string;
  conditions: ConditionRule[];
}

export interface ConditionsBlockData extends BaseBlockData {
  conditions?: ConditionPath[] | unknown[];
  retryConditions?: boolean;
  retryCount?: number;
  retryTimeout?: number;
}

export interface ElementExistsBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  tryCount?: number;
  timeout?: number;
  markEl?: boolean;
  throwError?: boolean;
}

export interface WhileLoopBlockData extends BaseBlockData {
  conditions?: unknown;
}

export interface LoopDataBlockData extends BaseBlockData {
  loopId?: string;
  maxLoop?: number;
  toNumber?: number;
  fromNumber?: number;
  startIndex?: number;
  loopData?: string;
  variableName?: string;
  referenceKey?: string;
  reverseLoop?: boolean;
  elementSelector?: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  resumeLastWorkflow?: boolean;
  loopThrough?:
    | 'data-columns'
    | 'custom-data'
    | 'numbers'
    | 'google-sheets'
    | 'elements';
}

export interface LoopElementsBlockData extends BaseBlockData {
  loopId?: string;
  selector: string;
  maxLoop?: string | number;
  reverseLoop?: boolean;
  actionElSelector?: string;
  findBy?: SelectorType;
  actionElMaxWaitTime?: number;
  actionPageMaxWaitTime?: number;
  loadMoreAction?: 'none' | 'click' | 'scroll';
  scrollToBottom?: boolean;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
}

export interface LoopBreakpointBlockData extends BaseBlockData {
  loopId?: string;
  clearLoop?: boolean;
}
