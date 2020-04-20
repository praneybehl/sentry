import React from 'react';
import styled from '@emotion/styled';
import sortBy from 'lodash/sortBy';

import space from 'app/styles/space';
import {t} from 'app/locale';
import TextField from 'app/components/forms/textField';

import {
  RULE_TYPE,
  METHOD_TYPE,
  getRuleTypeSelectorFieldLabel,
  getMethodTypeSelectorFieldLabel,
} from '../utils';
import DataPrivacyRulesPanelSelectorField from './dataPrivacyRulesPanelFormSelectorField';
import DataPrivacyRulesPanelFormField from './dataPrivacyRulesPanelFormField';
import DataPrivacyRulesPanelFormSelectControl from './dataPrivacyRulesPanelFormSelectControl';
import DataPrivacyRulesPanelFormEventId from './dataPrivacyRulesPanelFormEventId';
import {Rule, Suggestion} from '../types';

type DataPrivacyRulesPanelFormEventIdProps = React.ComponentProps<
  typeof DataPrivacyRulesPanelFormEventId
>;

type Props = DataPrivacyRulesPanelFormEventIdProps & {
  selectorSuggestions: Array<Suggestion>;
  rule: Rule;
  onChange: (rule: Rule) => void;
  onUpdateEventId: (eventId: string) => void;
  disabled?: boolean;
};

type State = {
  errors: {
    [key: string]: string;
  };
};
class DataPrivacyRulesForm extends React.PureComponent<Props, State> {
  state: State = {
    errors: {},
  };

  componentDidUpdate(prevProps: Props) {
    if (prevProps.rule.from !== this.props.rule.from) {
      this.handleValidation('from')();
    }
  }

  handleChange = <T extends keyof Omit<Rule, 'id'>>(stateProperty: T, value: Rule[T]) => {
    const rule: Rule = {
      ...this.props.rule,
      [stateProperty]: value,
    };

    if (rule.type !== RULE_TYPE.PATTERN) {
      delete rule.customRegularExpression;
    }

    this.props.onChange({
      ...rule,
    });
  };

  handleValidation = <T extends keyof Omit<Rule, 'id'>>(field: T) => () => {
    const errors = {...this.state.errors};
    const isFieldValueEmpty = !this.props.rule[field];
    const fieldErrorAlreadyExist = errors[field];

    if (isFieldValueEmpty && fieldErrorAlreadyExist) {
      return;
    }

    if (isFieldValueEmpty && !fieldErrorAlreadyExist) {
      errors[field] = t('Field Required');
    }

    if (!isFieldValueEmpty && fieldErrorAlreadyExist) {
      delete errors[field];
    }

    this.setState({
      errors,
    });
  };

  render() {
    const {rule, disabled, selectorSuggestions, onUpdateEventId, eventId} = this.props;
    const {from, customRegularExpression, type, method} = rule;
    const {errors} = this.state;

    return (
      <Wrapper>
        <DataPrivacyRulesPanelFormEventId
          onUpdateEventId={onUpdateEventId}
          eventId={eventId}
        />
        <WrapperFields>
          <DataPrivacyRulesPanelFormField
            label={t('Redaction Method')}
            tooltipInfo={t('What to do')}
          >
            <DataPrivacyRulesPanelFormSelectControl
              placeholder={t('Select method')}
              name="method"
              options={sortBy(Object.values(METHOD_TYPE)).map(value => ({
                label: getMethodTypeSelectorFieldLabel(value),
                value,
              }))}
              value={method}
              onChange={({value}) => this.handleChange('method', value)}
              isDisabled={disabled}
            />
          </DataPrivacyRulesPanelFormField>
          <DataPrivacyRulesPanelFormField
            label={t('Rule Type')}
            tooltipInfo={t('What to look for')}
          >
            <DataPrivacyRulesPanelFormSelectControl
              placeholder={t('Select type')}
              name="type"
              options={sortBy(Object.values(RULE_TYPE)).map(value => ({
                label: getRuleTypeSelectorFieldLabel(value),
                value,
              }))}
              value={type}
              onChange={({value}) => this.handleChange('type', value)}
              isDisabled={disabled}
            />
          </DataPrivacyRulesPanelFormField>
          <DataPrivacyRulesPanelFormField
            label={t('From (Selector)')}
            tooltipInfo={t('Where to look')}
          >
            <DataPrivacyRulesPanelSelectorField
              onChange={(value: string) => {
                this.handleChange('from', value);
              }}
              value={from}
              onBlur={this.handleValidation('from')}
              selectorSuggestions={selectorSuggestions}
              error={errors.from}
              disabled={disabled}
            />
          </DataPrivacyRulesPanelFormField>
          {type === RULE_TYPE.PATTERN && (
            <DataPrivacyRulesPanelFormField
              label={t('Regex matches')}
              tooltipInfo={t('Custom Perl-style regex (PCRE)')}
              isFullWidth
            >
              <CustomRegularExpression
                name="customRegularExpression"
                placeholder={t('Enter custom regular expression')}
                onChange={(value: string) => {
                  this.handleChange('customRegularExpression', value);
                }}
                value={customRegularExpression}
                onBlur={this.handleValidation('customRegularExpression')}
                error={errors.customRegularExpression}
                disabled={disabled}
              />
            </DataPrivacyRulesPanelFormField>
          )}
        </WrapperFields>
      </Wrapper>
    );
  }
}

export default DataPrivacyRulesForm;

const Wrapper = styled('div')`
  padding: ${space(3)} ${space(2)} ${space(4)} ${space(2)};
  border-bottom: 1px solid ${p => p.theme.borderDark};
`;

const WrapperFields = styled('div')`
  display: grid;
  grid-gap: ${space(2)};
  grid-row-gap: ${space(3)};
  grid-template-columns: 1fr;
  @media (min-width: ${p => p.theme.breakpoints[0]}) {
    grid-template-columns: 200px 200px 1fr;
  }
`;

const CustomRegularExpression = styled(TextField)`
  font-size: ${p => p.theme.fontSizeSmall};
  height: 34px;
  input {
    height: 34px;
    font-family: ${p => p.theme.text.familyMono};
  }
  margin-bottom: 0;
`;
