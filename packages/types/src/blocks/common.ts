export type BlockCategory =
  | 'general'
  | 'browser'
  | 'interaction'
  | 'conditions'
  | 'data'
  | 'onlineServices'
  | 'package';

export interface BaseBlockData {
  disableBlock?: boolean;
  description?: string;
  [key: string]: unknown;
}

export interface TaskDefinition<TData extends BaseBlockData = BaseBlockData> {
  name: string;
  description?: string;
  icon?: string;
  category: BlockCategory;
  component?: string;
  editComponent?: string;
  disableEdit?: boolean;
  inputs: number;
  outputs: number;
  allowedInputs?: boolean;
  maxConnection?: number;
  refDataKeys?: string[];
  autocomplete?: string[];
  data: TData;
}
