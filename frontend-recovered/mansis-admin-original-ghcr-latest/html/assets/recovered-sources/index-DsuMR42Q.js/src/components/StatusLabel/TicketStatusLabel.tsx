import React from 'react';
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { TicketUsageStatus } from '@/enums/ticket-usage-status';
import { TicketUsageStatusLabels } from '@/enums/ticket-usage-status-labels';

interface TicketStatusLabelProps {
  status: TicketUsageStatus;
}

const TicketStatusLabel: React.FC<TicketStatusLabelProps> = ({ status }) => {
  const { t } = useTranslation();

  const getStatusColor = (status: TicketUsageStatus) => {
    switch (status) {
      case TicketUsageStatus.USED:
        return 'success';
      case TicketUsageStatus.NOT_USED:
        return 'primary';
      case TicketUsageStatus.EXPIRED:
        return 'warning';
      case TicketUsageStatus.CANCELED:
        return 'error';
      case TicketUsageStatus.REFUNDED:
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={t(TicketUsageStatusLabels[status])}
      color={getStatusColor(status)}
      size="small"
    />
  );
};

export default TicketStatusLabel;
