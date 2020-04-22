import React from 'react';
import Modal from 'react-bootstrap/lib/Modal';
import styled from '@emotion/styled';
import omit from 'lodash/omit';
import {css} from '@emotion/core';

import space from 'app/styles/space';
import Button from 'app/components/button';
import ButtonBar from 'app/components/buttonBar';
import {t} from 'app/locale';
import {defined} from 'app/utils';

import DataPrivacyRulesPanelForm from './dataPrivacyRulesPanelForm/dataPrivacyRulesPanelForm';
import {RULE_TYPE, METHOD_TYPE} from './utils';

const DEFAULT_RULE_FROM_VALUE = '';

type DataPrivacyRulesPanelFormProps = React.ComponentProps<
  typeof DataPrivacyRulesPanelForm
>;

type Rule = DataPrivacyRulesPanelFormProps['rule'];

type Props = Pick<
  DataPrivacyRulesPanelFormProps,
  'selectorSuggestions' | 'onUpdateEventId' | 'disabled' | 'eventId'
> &
  Partial<Pick<DataPrivacyRulesPanelFormProps, 'rule'>> & {
    onSaveRule: (rule: Rule) => void;
    onClose: () => void;
    onDeleteRule?: (rulesToBeDeleted: Array<Rule['id']>) => void;
  };

type State = {
  rule: Rule;
  isFormValid: boolean;
};

class DataPrivacyRulesPanelRuleModal extends React.Component<Props, State> {
  state = {
    rule: {
      id: defined(this.props.rule?.id) ? this.props.rule?.id! : -1,
      type: this.props.rule?.type || RULE_TYPE.CREDITCARD,
      method: this.props.rule?.method || METHOD_TYPE.MASK,
      from: this.props.rule?.from || DEFAULT_RULE_FROM_VALUE,
      customRegularExpression: this.props.rule?.customRegularExpression,
    },
    isFormValid: false,
  };

  handleDeleteRule = (ruleId: Rule['id']) => () => {
    const {onDeleteRule, onClose} = this.props;

    if (onDeleteRule && defined(ruleId)) {
      onDeleteRule([ruleId]);
    }
    onClose();
  };

  handleChange = (updatedRule: Rule) => {
    this.setState(
      {
        rule: updatedRule,
      },
      () => {
        this.handleValidate();
      }
    );
  };

  handleValidate = () => {
    const {rule} = this.state;

    const ruleKeys = Object.keys(omit(rule, 'id'));
    const isFormValid = !ruleKeys.find(ruleKey => !rule[ruleKey]);

    this.setState({
      isFormValid,
    });
  };

  handleSave = () => {
    const {rule} = this.state;
    const {onSaveRule, onClose} = this.props;

    onSaveRule(rule);
    onClose();
  };

  render() {
    const {onClose, disabled, selectorSuggestions, onUpdateEventId, eventId} = this.props;
    const {rule, isFormValid} = this.state;

    const hasDeleteButton = rule?.id !== -1;

    return (
      <StyledModal
        show
        animation={false}
        onHide={onClose}
        hasDeleteButton={hasDeleteButton}
      >
        <Modal.Header closeButton>
          {t(`Data Privacy Rules - ${hasDeleteButton ? 'Edit' : 'Add'} Rule`)}
        </Modal.Header>
        <ModalContent>
          <DataPrivacyRulesPanelForm
            onChange={this.handleChange}
            selectorSuggestions={selectorSuggestions}
            rule={rule}
            disabled={disabled}
            onUpdateEventId={onUpdateEventId}
            eventId={eventId}
          />
          <Footer>
            {hasDeleteButton && (
              <Button
                disabled={disabled}
                onClick={this.handleDeleteRule(rule.id)}
                size="small"
                priority="danger"
              >
                {t('Delete')}
              </Button>
            )}
            <StyledButtonBar gap={1.5}>
              <Button disabled={disabled} onClick={onClose} size="small">
                {t('Cancel')}
              </Button>
              <Button
                disabled={disabled || !isFormValid}
                onClick={this.handleSave}
                size="small"
                priority="primary"
              >
                {t('Save')}
              </Button>
            </StyledButtonBar>
          </Footer>
        </ModalContent>
      </StyledModal>
    );
  }
}

export default DataPrivacyRulesPanelRuleModal;

const ModalContent = styled(Modal.Body)`
  flex: 1;
  margin: 0 -30px -30px -30px;
`;

const Footer = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: ${space(2)};
  padding: ${space(1)} ${space(2)};
  position: relative;
`;

const StyledButtonBar = styled(ButtonBar)`
  justify-content: flex-end;
`;

const StyledModal = styled(Modal, {
  shouldForwardProp: prop => prop !== 'hasDeleteButton',
})<{hasDeleteButton?: boolean}>`
  .modal-dialog {
    width: calc(100% - ${space(4)});
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) !important;
    margin: 0;
    @media (min-width: ${p => p.theme.breakpoints[2]}) {
      width: 900px;
    }
  }
  .modal-header {
    margin-bottom: 0;
    padding: ${space(3)} ${space(2)};
  }
  .close {
    outline: none;
  }

  ${p =>
    p.hasDeleteButton &&
    css`
      ${Footer} {
        grid-template-columns: auto 1fr;
      }
    `}
`;
