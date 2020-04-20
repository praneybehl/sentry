import React from 'react';

import EmptyMessage from 'app/views/settings/components/emptyMessage';
import ButtonBar from 'app/components/buttonBar';
import Button from 'app/components/button';
import {t} from 'app/locale';

import DataPrivacyRulesPanelButtonAddRule from './dataPrivacyRulesPanelButtonAddRule';

const ADVANCED_DATASCRUBBING_LINK =
  'https://docs.sentry.io/data-management/advanced-datascrubbing/';

type Props = {
  onAddRule: () => void;
  disabled?: boolean;
};

const DataPrivacyRulesPanelEmpty = ({onAddRule, disabled}: Props) => (
  <EmptyMessage
    description={t("You don't have any saved data privacy rules yet!")}
    action={
      <ButtonBar gap={1.5}>
        <DataPrivacyRulesPanelButtonAddRule onClick={onAddRule} disabled={disabled} />
        <Button
          size="small"
          href={ADVANCED_DATASCRUBBING_LINK}
          target="_blank"
          disabled={disabled}
        >
          {t('Learn More')}
        </Button>
      </ButtonBar>
    }
  />
);

export default DataPrivacyRulesPanelEmpty;
export {ADVANCED_DATASCRUBBING_LINK};
