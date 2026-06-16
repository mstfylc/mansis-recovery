import { createBrowserRouter, Navigate } from 'react-router-dom';
import BaseLayout from './layouts/BaseLayout';
import SidebarLayout from './layouts/SidebarLayout';

// Import status pages
import StatusMaintenance from './pages/status/maintenance';
import StatusComingSoon from './pages/status/coming-soon';
import Status500 from './pages/status/500';
import Status404 from './pages/404';

// Import auth pages
import Login from './pages/auth/login';
import ForgotPasswordPage from './pages/auth/forgot-password';
// import SetPassword from './pages/auth/set-password';

// Import dashboard pages
import DashboardMain from './pages/dashboards/main';
import TasksDashboard from './pages/dashboards/tasks';
import OrdersDashboard from './pages/dashboards/orders';
import ProductsDashboard from './pages/dashboards/products';
import CompanyMenuManagement from './pages/management/company-products/menus';
import CompanyProductDetail from './pages/management/company-products/detail';

// Import management pages
import UsersManagement from './pages/management/users';
import ActivitiesManagement from './pages/management/activities';
import ActivityDetails from './pages/management/activities/ActivityDetails';
import CategoriesManagement from './pages/management/categories';
import UserProfile from './pages/management/profile';
import AccountSettings from './pages/management/profile/settings';
import MembershipManagement from './pages/dashboards/memberships';
import MembershipPlansManagement from './pages/management/membership-plans';
import OrderDetails from './pages/dashboards/orders/OrderDetails';
import BranchManagement from './pages/management/branches';
import BranchDetails from './pages/management/branches/BranchDetails';
import CompanyManagement from './pages/management/companies';
import CampaignManagement from './pages/management/campaigns';
import CampaignDetails from './pages/management/campaigns/CampaignDetails';
import CampaignUsages from './pages/management/campaigns/CampaignUsages';
import AddCustomerData from './pages/management/campaigns/AddCustomerData';
import UserDetails from './pages/management/users/details/UserDetails';
import UserBranchManagement from './pages/management/users/branches/UserBranchManagement';
import CompanyProductSettings from './pages/management/company-products/settings';

import AdisyoIntegration from './pages/integrations/adisyo';
import DesktopApp from './content/Downloads';

import { AuthGuard } from './components/AuthGuard';
import FinanceManagement from './pages/management/finance';
import StockManagement from './pages/management/stock';
import StockHistoryPage from './pages/management/stock/history';
import WarehouseManagement from './pages/management/warehouses';
import WarehouseDetails from './pages/management/warehouses/WarehouseDetails';
import RecipeManagement from './pages/management/recipes';
import RecipeDetail from './pages/management/recipes/detail';
import IngredientManagement from './pages/management/ingredients';
import TableManagement from './pages/management/table-management';
import FloorPlanTables from './pages/management/table-management/FloorPlanTables';
import PlansManagement from './pages/management/plans';
import SubscriptionsManagement from './pages/management/subscriptions';
import SmsPackagesManagement from './pages/management/sms-packages';
import SubscriptionPage from './pages/settings/Subscription';
import LoyaltySettings from './pages/management/loyalty';
import LoyaltyProducts from './pages/management/loyalty/products';
import VoucherTemplates from './pages/management/vouchers';
import StampCardsManagement from './pages/management/stamp-cards';
import ChangelogManagement from './pages/management/changelog';
import NotificationCampaigns from './pages/management/notifications';
import CreateNotificationCampaign from './pages/management/notifications/CreateCampaign';
import NotificationCampaignDetail from './pages/management/notifications/CampaignDetail';
import NotificationTemplates from './pages/management/notifications/templates';
import NotificationInbox from './pages/notifications/inbox';

const router = createBrowserRouter([
  // Base routes that require BaseLayout
  {
    path: '/status',
    element: <BaseLayout />,
    children: [
      {
        path: '404',
        element: <Status404 />
      },
      {
        path: '500',
        element: <Status500 />
      },
      {
        path: 'coming-soon',
        element: <StatusComingSoon />
      },
      {
        path: 'maintenance',
        element: <StatusMaintenance />
      }
    ]
  },

  // Auth routes
  {
    path: '/auth',
    element: <BaseLayout />,
    children: [
      {
        path: 'login',
        element: <Login />
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />
      }
      // {
      //   path: 'set-password',
      //   element: <SetPassword />
      // }
    ]
  },

  // Main application routes with Sidebar - protected by AuthGuard
  {
    path: '/',
    element: (
      <AuthGuard>
        <SidebarLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <DashboardMain />
      },
      {
        path: 'dashboards',
        children: [
          {
            path: 'main',
            element: <DashboardMain />
          },
          {
            path: 'orders',
            children: [
              {
                index: true,
                element: <OrdersDashboard />
              },
              {
                path: ':orderId',
                element: <OrderDetails />
              }
            ]
          },
          {
            path: 'products',
            element: <ProductsDashboard />
          },
          {
            path: 'tasks',
            element: <TasksDashboard />
          }
        ]
      },
      {
        path: 'management',
        children: [
          {
            path: 'products',
            element: <ProductsDashboard />
          },
          {
            path: 'campaigns',
            children: [
              {
                index: true,
                element: <CampaignManagement />
              },
              {
                path: 'batch-customer-data',
                element: <AddCustomerData />
              },
              {
                path: ':campaignId',
                element: <CampaignDetails />
              },
              {
                path: ':campaignId/usages',
                element: <CampaignUsages />
              }
            ]
          },
          {
            path: 'companies',
            element: <CompanyManagement />
          },
          {
            path: 'users',
            children: [
              {
                index: true,
                element: <UsersManagement />
              },
              {
                path: 'details/:id',
                element: <UserDetails />
              },
              {
                path: ':id/branches',
                element: <UserBranchManagement />
              }
            ]
          },
          {
            path: 'branches',
            children: [
              {
                index: true,
                element: <BranchManagement />
              },
              {
                path: ':branchId',
                element: <BranchDetails />
              }
            ]
          },
          {
            path: 'activities',
            children: [
              {
                index: true,
                element: <ActivitiesManagement />
              },
              {
                path: ':activityId',
                element: <ActivityDetails />
              }
            ]
          },
          {
            path: 'memberships',
            element: <MembershipManagement />
          },
          {
            path: 'membership-plans',
            element: <MembershipPlansManagement />
          },
          {
            path: 'categories',
            element: <CategoriesManagement />
          },
          {
            path: 'company-products',
            children: [
              {
                path: 'settings',
                element: <CompanyProductSettings />
              },
              {
                path: 'menus',
                element: <CompanyMenuManagement />
              },
              {
                path: ':productId',
                element: <CompanyProductDetail />
              }
            ]
          },
          {
            path: 'finance',
            element: <FinanceManagement />
          },
          {
            path: 'stock',
            children: [
              {
                index: true,
                element: <StockManagement />
              },
              {
                path: ':stockId/history',
                element: <StockHistoryPage />
              }
            ]
          },
          {
            path: 'warehouses',
            children: [
              {
                index: true,
                element: <WarehouseManagement />
              },
              {
                path: ':id',
                element: <WarehouseDetails />
              }
            ]
          },
          {
            path: 'recipes',
            children: [
              {
                index: true,
                element: <RecipeManagement />
              },
              {
                path: ':recipeId',
                element: <RecipeDetail />
              }
            ]
          },
          {
            path: 'ingredients',
            element: <IngredientManagement />
          },
          {
            path: 'table-management',
            children: [
              {
                index: true,
                element: <TableManagement />
              },
              {
                path: ':floorPlanId',
                element: <FloorPlanTables />
              }
            ]
          },
          {
            path: 'plans',
            element: <PlansManagement />
          },
          {
            path: 'subscriptions',
            element: <SubscriptionsManagement />
          },
          {
            path: 'sms-packages',
            element: <SmsPackagesManagement />
          },
          {
            path: 'changelog',
            element: <ChangelogManagement />
          },
          {
            path: 'notifications',
            children: [
              {
                index: true,
                element: <NotificationCampaigns />
              },
              {
                path: 'create',
                element: <CreateNotificationCampaign />
              },
              {
                path: ':id',
                element: <NotificationCampaignDetail />
              },
              {
                path: 'templates',
                element: <NotificationTemplates />
              }
            ]
          },
          {
            path: 'loyalty',
            children: [
              {
                index: true,
                element: <LoyaltySettings />
              },
              {
                path: 'products',
                element: <LoyaltyProducts />
              }
            ]
          },
          {
            path: 'vouchers',
            element: <VoucherTemplates />
          },
          {
            path: 'stamp-cards',
            element: <StampCardsManagement />
          },
          {
            path: 'profile',
            children: [
              {
                index: true,
                element: <UserProfile />
              },
              {
                path: 'settings',
                element: <AccountSettings />
              }
            ]
          }
        ]
      },
      {
        path: 'settings',
        children: [
          {
            path: 'subscription',
            element: <SubscriptionPage />
          }
        ]
      },
      {
        path: 'integrations',
        children: [
          {
            path: 'adisyo',
            element: <AdisyoIntegration />
          }
        ]
      },
      {
        path: 'downloads',
        children: [
          {
            path: 'desktop-app',
            element: <DesktopApp />
          }
        ]
      },
      {
        path: 'notifications',
        children: [
          {
            path: 'inbox',
            element: <NotificationInbox />
          }
        ]
      }
    ]
  },

  // Fallback route
  {
    path: '*',
    element: <Navigate to="/status/404" replace />
  }
]);

export default router;
