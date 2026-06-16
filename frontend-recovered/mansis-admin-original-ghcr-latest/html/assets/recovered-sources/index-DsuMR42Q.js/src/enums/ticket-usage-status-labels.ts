import { TicketUsageStatus } from './ticket-usage-status';

export const TicketUsageStatusLabels: Record<TicketUsageStatus, string> = {
  [TicketUsageStatus.USED]: 'ticket.usage.used',
  [TicketUsageStatus.NOT_USED]: 'ticket.usage.not.used',
  [TicketUsageStatus.EXPIRED]: 'ticket.usage.expired',
  [TicketUsageStatus.CANCELED]: 'ticket.usage.canceled',
  [TicketUsageStatus.REFUNDED]: 'ticket.usage.refunded'
};
