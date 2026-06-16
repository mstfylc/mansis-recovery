import { OrderStatus } from './order-status';

export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PREPARING]: 'order.status.preparing',
  [OrderStatus.READY]: 'order.status.ready',
  [OrderStatus.DELIVERED]: 'order.status.delivered',
  [OrderStatus.CANCELED]: 'order.status.canceled',
  [OrderStatus.REFUNDED]: 'order.status.refunded'
};
