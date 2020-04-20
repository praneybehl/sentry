import React from 'react';
import styled from '@emotion/styled';
import isEqual from 'lodash/isEqual';

import TextField from 'app/components/forms/textField';
import {t} from 'app/locale';
import space from 'app/styles/space';
import Alert from 'app/components/alert';
import ControlState from 'app/views/settings/components/forms/field/controlState';
import {addErrorMessage, addSuccessMessage} from 'app/actionCreators/indicator';

import DataPrivacyRulesPanelFormField from './dataPrivacyRulesPanelFormField';
import {EVENT_ID_FIELD_STATUS} from '../utils';

type EventId = {
  value: string;
  status?: EVENT_ID_FIELD_STATUS;
};

type Props = {
  onUpdateEventId: (eventId: string) => void;
  eventId: EventId;
  disabled?: boolean;
};

const loadEventIdStatus = (status?: EVENT_ID_FIELD_STATUS) => {
  switch (status) {
    case EVENT_ID_FIELD_STATUS.INVALID:
      addErrorMessage(t("That's not a valid event ID"));
      break;
    case EVENT_ID_FIELD_STATUS.ERROR:
      addErrorMessage(t('Something went wrong while fetching the suggestions'));
      break;
    case EVENT_ID_FIELD_STATUS.NOT_FOUND:
      addErrorMessage(t('Event ID not found in projects you have access to'));
      break;
    case EVENT_ID_FIELD_STATUS.LOADED:
      addSuccessMessage(
        t('Now the From (Selector) autocomplete is based on this event ID')
      );
      break;
    default:
  }
};

type State = {
  value: string;
  status?: EVENT_ID_FIELD_STATUS;
};

class DataPrivacyRulesPanelFormEventId extends React.Component<Props, State> {
  state = {
    value: this.props.eventId.value,
    status: this.props.eventId?.status,
  };

  componentDidUpdate(prevProps: Props) {
    if (!isEqual(prevProps.eventId, this.props.eventId)) {
      this.loadState();
    }
  }

  loadState = () => {
    this.setState(
      {
        ...this.props.eventId,
      },
      () => {
        this.loadStatus();
      }
    );
  };

  loadStatus = () => {
    loadEventIdStatus(this.state.status);
  };

  handleChange = (value: string) => {
    const eventId = value.replace(/-/g, '').trim();

    if (eventId !== this.state.value) {
      this.setState({
        value: eventId,
        status: undefined,
      });
    }
  };

  isEventIdValid = (): boolean => {
    const {value} = this.state;

    if (value && value.length !== 32) {
      this.setState({status: EVENT_ID_FIELD_STATUS.INVALID}, () => {
        this.loadStatus();
      });
      return false;
    }

    return true;
  };

  handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    event.preventDefault();

    if (this.isEventIdValid()) {
      this.props.onUpdateEventId(this.state.value);
    }
  };

  handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    event.persist();

    const {keyCode} = event;

    if (keyCode === 13 && this.isEventIdValid()) {
      this.props.onUpdateEventId(this.state.value);
    }
  };

  render() {
    const {disabled} = this.props;
    const {value, status} = this.state;

    return (
      <Alert type="warning">
        <DataPrivacyRulesPanelFormField
          label={t('Show suggestions according to the Event')}
          tooltipInfo={t('to do')}
        >
          <EventIdFieldWrapper>
            <StyledTextField
              name="eventId"
              disabled={disabled}
              value={value}
              placeholder={t('Paste event ID for better suggestions')}
              onChange={this.handleChange}
              onKeyDown={this.handleKeyDown}
              onBlur={this.handleBlur}
              showStatus={status !== EVENT_ID_FIELD_STATUS.LOADED}
            />
            <Status>
              {status === EVENT_ID_FIELD_STATUS.LOADING && <ControlState isSaving />}
              {status === EVENT_ID_FIELD_STATUS.INVALID && <ControlState error />}
              {status === EVENT_ID_FIELD_STATUS.ERROR && <ControlState error />}
              {status === EVENT_ID_FIELD_STATUS.NOT_FOUND && <ControlState error />}
            </Status>
          </EventIdFieldWrapper>
        </DataPrivacyRulesPanelFormField>
      </Alert>
    );
  }
}
export default DataPrivacyRulesPanelFormEventId;

const StyledTextField = styled(TextField)<{showStatus: boolean}>`
  flex: 1;
  font-weight: 400;
  input {
    height: 34px;
    padding-right: ${p => (p.showStatus ? space(4) : space(1.5))};
  }
  :first-child {
    margin-bottom: 0;
  }
`;

const Status = styled('div')`
  position: absolute;
  right: 0;
`;

const EventIdFieldWrapper = styled('div')`
  position: relative;
  display: flex;
  align-items: center;
`;
