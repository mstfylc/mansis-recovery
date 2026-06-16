import { ReactElement } from 'react';
import Label from '@/components/Label';
import { useTranslation } from 'react-i18next';
import TicketStatusLabelComponent from './TicketStatusLabel';

export const TicketStatusLabel = TicketStatusLabelComponent;

interface StatusMap {
  [key: string]: {
    text: string;
    color:
      | 'black'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'warning'
      | 'success'
      | 'info';
  };
}

interface StatusLabelProps {
  status: string;
  customMap?: StatusMap;
}

const StatusLabel = ({ status, customMap }: StatusLabelProps): ReactElement => {
  const { t } = useTranslation();
  const defaultStatusMap: StatusMap = {
    DELETED: {
      text: t('deleted.capital'),
      color: 'error'
    },
    ACTIVE: {
      text: t('active.capital'),
      color: 'success'
    },
    PENDING: {
      text: t('pending.capital'),
      color: 'warning'
    },
    PASSIVE: {
      text: t('passive.capital'),
      color: 'info'
    }
  };

  if (!status) {
    return <Label color="black">-</Label>;
  }

  const map = customMap || defaultStatusMap;
  const statusConfig = map[status] || {
    text: status,
    color: 'secondary'
  };

  return <Label color={statusConfig.color}>{statusConfig.text}</Label>;
};

export default StatusLabel;
