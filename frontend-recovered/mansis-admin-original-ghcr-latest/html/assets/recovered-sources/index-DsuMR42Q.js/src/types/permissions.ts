export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete'
}

export const SUBJECTS = {
  User: 'User',
  Company: 'Company',
  Branch: 'Branch',
  Product: 'Product',
  Category: 'Category',
  Order: 'Order',
  Cart: 'Cart',
  Sale: 'Sale',
  Dashboard: 'Dashboard',
  ALL: 'all'
} as const;

export type Subject = keyof typeof SUBJECTS | 'all';
