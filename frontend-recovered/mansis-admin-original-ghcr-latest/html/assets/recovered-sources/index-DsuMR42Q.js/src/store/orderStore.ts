import { OrderStatus } from '@/enums/order-status';
import { PurchaseType } from '@/enums/purchase-type';
import { Order } from '@/types/Order.interface';
import { observable } from '@legendapp/state';

export const order$ = observable<Order>({
  id: -1,
  userName: '',
  userSurname: '',
  branchName: '',
  createdAt: new Date(),
  purchaseType: PurchaseType.CASH,
  products: [],
  totalAmount: 0,
  status: OrderStatus.PREPARING,
  branchId: -1,
  userId: -1,
  companyName: '',
  employeeName: '',
  employeeSurname: '',
  totalPrice: 0,
  netTotalPrice: 0,
  pointsSpent: undefined,
  earnedPoints: undefined
});

export const setOrder = async (orderData: Partial<Order>) => {
  order$.set((prevState) => ({
    ...prevState,
    ...orderData
  }));
};

export const clear = () => {
  order$.set({
    id: -1,
    userName: '',
    userSurname: '',
    branchName: '',
    createdAt: new Date(),
    purchaseType: PurchaseType.CASH,
    products: [],
    totalAmount: 0,
    status: OrderStatus.PREPARING,
    branchId: -1,
    userId: -1,
    companyName: '',
    employeeName: '',
    employeeSurname: '',
    totalPrice: 0,
    netTotalPrice: 0,
    pointsSpent: undefined,
    earnedPoints: undefined
  });
};
