import {RULE_TYPE, METHOD_TYPE} from './utils';

export type Rule = {
  id: number;
  type: RULE_TYPE;
  method: METHOD_TYPE;
  from: string;
  customRegularExpression?: string;
};

export type SuggestionType = 'value' | 'unary' | 'binary' | 'string';

export type Suggestion = {
  type: SuggestionType;
  value: string;
  description?: string;
};
