import React from 'react';

import {t} from 'app/locale';
import Button from 'app/components/button';
import {IconAdd} from 'app/icons/iconAdd';

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

const DataPrivacyRulesPanelButtonAddRule = ({onClick, disabled}: Props) => (
  <Button
    disabled={disabled}
    icon={<IconAdd size="xs" />}
    onClick={onClick}
    size="small"
    priority="primary"
  >
    {t('Add Rule')}
  </Button>
);

export default DataPrivacyRulesPanelButtonAddRule;
