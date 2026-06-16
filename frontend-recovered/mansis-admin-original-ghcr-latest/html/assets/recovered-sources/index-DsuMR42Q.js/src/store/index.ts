import * as userStore from '@/store/userStore';
import * as branchStore from '@/store/branchStore';
import * as orderStore from '@/store/orderStore';
import * as campaignStore from '@/store/campaignStore';

export const clearLegendState = () => {
  userStore.clear();
  branchStore.clear();
  orderStore.clear();
  campaignStore.clear();
};
