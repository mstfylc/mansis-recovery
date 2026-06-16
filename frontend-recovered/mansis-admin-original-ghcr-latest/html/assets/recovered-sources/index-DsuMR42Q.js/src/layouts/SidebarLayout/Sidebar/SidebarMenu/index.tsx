import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
  ListSubheader,
  alpha,
  Box,
  List,
  styled,
  Button,
  ListItem,
  Collapse,
  Tooltip
} from '@mui/material';
import { Link } from 'react-router-dom';
import { SidebarContext } from '@/contexts/SidebarContext';
import { tokenDecoder } from '@/utils/jwt';
import { useFeature } from '@/contexts/FeatureContext';
import { FeatureKey } from '@/types/Licensing.interface';

import {
  BrightnessLowTwoTone,
  MmsTwoTone,
  TableChartTwoTone,
  AccountCircleTwoTone,
  BallotTwoTone,
  BeachAccessTwoTone,
  EmojiEventsTwoTone,
  FilterVintageTwoTone,
  HowToVoteTwoTone,
  LocalPharmacyTwoTone,
  RedeemTwoTone,
  SettingsTwoTone,
  TrafficTwoTone,
  CheckBoxTwoTone,
  ChromeReaderModeTwoTone,
  WorkspacePremiumTwoTone,
  CameraFrontTwoTone,
  DisplaySettingsTwoTone,
  ShoppingBagTwoTone,
  Key,
  Inventory2TwoTone,
  CategoryTwoTone,
  LocalActivityTwoTone,
  LoyaltyTwoTone,
  AltRouteTwoTone,
  BusinessTwoTone,
  ExtensionTwoTone,
  ExpandLess,
  ExpandMore,
  FormatListBulletedTwoTone,
  AccountBalanceWalletTwoTone,
  FastfoodTwoTone,
  ComputerTwoTone,
  InventoryTwoTone,
  WarehouseTwoTone,
  MenuBookTwoTone,
  KitchenTwoTone,
  LockTwoTone,
  ReceiptLongTwoTone,
  SmsTwoTone,
  CardGiftcardTwoTone,
  StarsTwoTone,
  RocketLaunchTwoTone,
  NotificationsActiveTwoTone,
  EventSeatTwoTone
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const MenuWrapper = styled(Box)(
  ({ theme }) => `
  .MuiList-root {
    padding: ${theme.spacing(1, 0.5)};

    & > .MuiList-root {
      padding: 0 ${theme.spacing(0)} ${theme.spacing(1)};
    }
  }

    .MuiListSubheader-root {
      text-transform: uppercase;
      font-weight: bold;
      font-size: ${theme.typography.pxToRem(12)};
      color: ${theme.colors.alpha.trueWhite[50]};
      padding: ${theme.spacing(0, 2.5, 0, 2)};
      line-height: 1.4;
    }
`
);

const SubMenuWrapper = styled(Box)(
  ({ theme }) => `
    .MuiList-root {

      .MuiListItem-root {
        padding: 1px 0;

        .MuiBadge-root {
          position: absolute;
          right: ${theme.spacing(3.2)};

          .MuiBadge-standard {
            background: ${theme.colors.primary.main};
            font-size: ${theme.typography.pxToRem(10)};
            font-weight: bold;
            text-transform: uppercase;
            color: ${theme.palette.primary.contrastText};
          }
        }
    
        .MuiButton-root {
          display: flex;
          color: ${theme.colors.alpha.trueWhite[70]};
          background-color: transparent;
          width: 100%;
          justify-content: flex-start;
          padding: ${theme.spacing(1.2, 3, 1.2, 2)};

          .MuiButton-startIcon,
          .MuiButton-endIcon {
            transition: ${theme.transitions.create(['color'])};

            .MuiSvgIcon-root {
              font-size: inherit;
              transition: none;
            }
          }

          .MuiButton-startIcon {
            color: ${theme.colors.alpha.trueWhite[30]};
            font-size: ${theme.typography.pxToRem(20)};
            margin-right: ${theme.spacing(1)};
          }
          
          .MuiButton-endIcon {
            color: ${theme.colors.alpha.trueWhite[50]};
            margin-left: auto;
            opacity: .8;
            font-size: ${theme.typography.pxToRem(20)};
          }

          &.active,
          &:hover {
            background-color: ${alpha(theme.colors.alpha.trueWhite[100], 0.06)};
            color: ${theme.colors.alpha.trueWhite[100]};

            .MuiButton-startIcon,
            .MuiButton-endIcon {
              color: ${theme.colors.alpha.trueWhite[100]};
            }
          }
        }

        &.Mui-children {
          flex-direction: column;

          .MuiBadge-root {
            position: absolute;
            right: ${theme.spacing(7)};
          }
        }

        .MuiCollapse-root {
          width: 100%;

          .MuiList-root {
            padding: ${theme.spacing(1, 0)};
          }

          .MuiListItem-root {
            padding: 1px 0;

            .MuiButton-root {
              padding: ${theme.spacing(0.8, 3, 0.8, 2)};

              .MuiBadge-root {
                right: ${theme.spacing(3.2)};
              }

              &:before {
                content: ' ';
                background: ${theme.colors.alpha.trueWhite[100]};
                opacity: 0;
                transition: ${theme.transitions.create([
                  'transform',
                  'opacity'
                ])};
                width: 6px;
                height: 6px;
                transform: scale(0);
                transform-origin: center;
                border-radius: 20px;
                margin-right: ${theme.spacing(1.8)};
              }

              &.active,
              &:hover {

                &:before {
                  transform: scale(1);
                  opacity: 1;
                }
              }
            }
          }
        }
      }
    }
`
);

function SidebarMenu() {
  const { closeSidebar } = useContext(SidebarContext);
  const location = useLocation();
  const currentRoute = location.pathname;
  const isDev = false;
  const { t } = useTranslation();
  const { hasFeature } = useFeature();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [productOpen, setProductOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [licensingOpen, setLicensingOpen] = useState(false);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const decoded = tokenDecoder(token);
      setUserRole(decoded.role);
    }
  }, []);

  useEffect(() => {
    if (
      currentRoute === '/dashboards/memberships' ||
      currentRoute === '/dashboards/membership-plans'
    ) {
      setMembershipOpen(true);
    }
    if (
      currentRoute.startsWith('/management/products') ||
      currentRoute.startsWith('/management/company-products') ||
      currentRoute === '/dashboards/products'
    ) {
      setProductOpen(true);
    }
    if (
      currentRoute.startsWith('/management/loyalty') ||
      currentRoute.startsWith('/management/vouchers') ||
      currentRoute.startsWith('/management/stamp-cards')
    ) {
      setLoyaltyOpen(true);
    }
  }, [currentRoute]);
  const handleProductClick = () => {
    setProductOpen(!productOpen);
  };

  const handleMembershipClick = () => {
    setMembershipOpen(!membershipOpen);
  };

  const handleLicensingClick = () => {
    setLicensingOpen(!licensingOpen);
  };

  const handleLoyaltyClick = () => {
    setLoyaltyOpen(!loyaltyOpen);
  };

  // Helper function to check if a menu item should be visible based on role
  const shouldShowMenuItem = (menuItem: string): boolean => {
    if (!userRole) return false;

    if (userRole === 'SUPER_ADMIN') return true;

    if (userRole === 'COMPANY_ADMIN') {
      // Always hide companies
      if (['companies'].includes(menuItem)) return false;

      // Check if in Branch View mode (when branchId is selected)
      const token = localStorage.getItem('access_token');
      if (token) {
        const decoded = tokenDecoder(token);
        if (decoded.branchId) {
          // Branch View - hide branches, plans, subscriptions, sms-packages, loyalty-settings
          if (
            [
              'branches',
              'plans',
              'subscriptions',
              'sms-packages',
              'loyalty-settings'
            ].includes(menuItem)
          ) {
            return false;
          }
        }
      }

      return true;
    }

    if (userRole === 'BRANCH_ADMIN') {
      if (
        [
          'companies',
          'branches',
          'plans',
          'subscriptions',
          'adisyo',
          'loyalty-settings'
        ].includes(menuItem)
      )
        return false;
      return true;
    }

    return false;
  };

  const isFeatureLocked = (feature: FeatureKey): boolean => {
    if (userRole === 'SUPER_ADMIN') return false;

    // Admin view (no branch selected) - don't lock features for COMPANY_ADMIN
    const token = localStorage.getItem('access_token');
    if (token && userRole === 'COMPANY_ADMIN') {
      const decoded = tokenDecoder(token);
      if (!decoded.branchId) {
        return false; // Admin view - all features available
      }
    }

    return !hasFeature(feature);
  };

  return (
    <MenuWrapper>
      <List
        subheader={
          <ListSubheader disableSticky>{t('dashboards')}</ListSubheader>
        }
      >
        <SubMenuWrapper>
          <List>
            <ListItem>
              <Button
                component={Link}
                to="/"
                className={
                  currentRoute === '/' || currentRoute === '/dashboards/main'
                    ? 'active'
                    : ''
                }
                disableRipple
                onClick={closeSidebar}
                startIcon={<BrightnessLowTwoTone />}
              >
                {t('dashboard.main.title')}
              </Button>
            </ListItem>

            {(() => {
              const locked = isFeatureLocked(FeatureKey.ORDERS);
              return (
                <ListItem>
                  <Tooltip
                    title={locked ? t('feature.not.available') : ''}
                    placement="right"
                  >
                    <span style={{ width: '100%' }}>
                      <Button
                        {...(!locked && {
                          component: Link,
                          to: '/dashboards/orders'
                        })}
                        className={
                          currentRoute === '/dashboards/orders' ? 'active' : ''
                        }
                        disableRipple
                        onClick={locked ? undefined : closeSidebar}
                        startIcon={<ShoppingBagTwoTone />}
                        endIcon={
                          locked ? <LockTwoTone fontSize="small" /> : null
                        }
                        disabled={locked}
                        sx={{ opacity: locked ? 0.5 : 1 }}
                      >
                        {t('orders')}
                      </Button>
                    </span>
                  </Tooltip>
                </ListItem>
              );
            })()}

            {isDev && (
              <ListItem>
                <Button
                  component={Link}
                  to="/applications/messenger"
                  className={
                    currentRoute === '/applications/messenger' ? 'active' : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<MmsTwoTone />}
                >
                  Messenger
                </Button>
              </ListItem>
            )}

            {isDev && (
              <ListItem>
                <Button
                  component={Link}
                  to="/dashboards/tasks"
                  className={
                    currentRoute === '/dashboards/tasks' ? 'active' : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<BrightnessLowTwoTone />}
                >
                  {t('manage.tasks')}
                </Button>
              </ListItem>
            )}
          </List>
        </SubMenuWrapper>
      </List>
      <List
        subheader={
          <ListSubheader disableSticky>{t('management')}</ListSubheader>
        }
      >
        <SubMenuWrapper>
          <List>
            {isDev && (
              <ListItem>
                <Button
                  to="/management/transactions"
                  component={Link}
                  className={
                    currentRoute === '/management/transactions' ? 'active' : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<TableChartTwoTone />}
                >
                  Transactions List
                </Button>
              </ListItem>
            )}
            {shouldShowMenuItem('companies') && (
              <ListItem>
                <Button
                  to="/management/companies"
                  component={Link}
                  className={
                    currentRoute === '/management/companies' ? 'active' : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<BusinessTwoTone />}
                >
                  {t('company.management')}
                </Button>
              </ListItem>
            )}
            {shouldShowMenuItem('branches') && (
              <ListItem>
                <Button
                  to="/management/branches"
                  component={Link}
                  className={
                    currentRoute === '/management/branches' ? 'active' : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<AltRouteTwoTone />}
                >
                  {t('branch.management')}
                </Button>
              </ListItem>
            )}
            {(() => {
              const locked = isFeatureLocked(FeatureKey.USERS);
              return (
                <ListItem>
                  <Tooltip
                    title={locked ? t('feature.not.available') : ''}
                    placement="right"
                  >
                    <span style={{ width: '100%' }}>
                      <Button
                        {...(!locked && {
                          component: Link,
                          to: '/management/users'
                        })}
                        className={
                          currentRoute === '/management/users' ? 'active' : ''
                        }
                        disableRipple
                        onClick={locked ? undefined : closeSidebar}
                        startIcon={<AccountCircleTwoTone />}
                        endIcon={
                          locked ? <LockTwoTone fontSize="small" /> : null
                        }
                        disabled={locked}
                        sx={{ opacity: locked ? 0.5 : 1 }}
                      >
                        {t('user.management')}
                      </Button>
                    </span>
                  </Tooltip>
                </ListItem>
              );
            })()}

            <ListItem className="Mui-children">
              <Button
                onClick={handleProductClick}
                disableRipple
                startIcon={<Inventory2TwoTone />}
                endIcon={productOpen ? <ExpandLess /> : <ExpandMore />}
              >
                {t('product.management')}
              </Button>
              <Collapse in={productOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {[
                    {
                      feature: FeatureKey.PRODUCTS,
                      path: '/management/categories',
                      label: 'category.management',
                      icon: <CategoryTwoTone />
                    },
                    {
                      feature: FeatureKey.PRODUCTS,
                      path: '/management/products',
                      label: 'product.list',
                      icon: <FormatListBulletedTwoTone />
                    },
                    {
                      feature: FeatureKey.PRODUCTS,
                      path: '/management/company-products/menus',
                      label: 'menu.management',
                      icon: <FastfoodTwoTone />
                    }
                  ].map((item) => {
                    const locked = isFeatureLocked(item.feature);
                    return (
                      <Box component="div" sx={{ pl: 2 }} key={item.path}>
                        <Tooltip
                          title={locked ? t('feature.not.available') : ''}
                          placement="right"
                        >
                          <span>
                            <Button
                              className={
                                currentRoute === item.path ? 'active' : ''
                              }
                              {...(!locked && {
                                component: Link,
                                to: item.path
                              })}
                              disableRipple
                              onClick={locked ? undefined : closeSidebar}
                              startIcon={item.icon}
                              endIcon={
                                locked ? <LockTwoTone fontSize="small" /> : null
                              }
                              disabled={locked}
                              fullWidth
                              sx={{
                                justifyContent: 'flex-start',
                                py: 1,
                                opacity: locked ? 0.5 : 1
                              }}
                            >
                              {t(item.label)}
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    );
                  })}
                  {[
                    {
                      feature: FeatureKey.STOCK,
                      path: '/management/stock',
                      label: 'stock.management',
                      icon: <InventoryTwoTone />
                    },
                    {
                      feature: FeatureKey.WAREHOUSE,
                      path: '/management/warehouses',
                      label: 'warehouse.management',
                      icon: <WarehouseTwoTone />
                    },
                    {
                      feature: FeatureKey.RECIPE,
                      path: '/management/recipes',
                      label: 'recipes.management.title',
                      icon: <MenuBookTwoTone />
                    },
                    {
                      feature: FeatureKey.INGREDIENTS,
                      path: '/management/ingredients',
                      label: 'ingredients.management.title',
                      icon: <KitchenTwoTone />
                    }
                  ].map((item) => {
                    const locked = isFeatureLocked(item.feature);
                    return (
                      <Box component="div" sx={{ pl: 2 }} key={item.path}>
                        <Tooltip
                          title={locked ? t('feature.not.available') : ''}
                          placement="right"
                        >
                          <span>
                            <Button
                              className={
                                currentRoute === item.path ? 'active' : ''
                              }
                              {...(!locked && {
                                component: Link,
                                to: item.path
                              })}
                              disableRipple
                              onClick={locked ? undefined : closeSidebar}
                              startIcon={item.icon}
                              endIcon={
                                locked ? <LockTwoTone fontSize="small" /> : null
                              }
                              disabled={locked}
                              fullWidth
                              sx={{
                                justifyContent: 'flex-start',
                                py: 1,
                                opacity: locked ? 0.5 : 1
                              }}
                            >
                              {t(item.label)}
                            </Button>
                          </span>
                        </Tooltip>
                      </Box>
                    );
                  })}
                </List>
              </Collapse>
            </ListItem>

            {(() => {
              const locked = isFeatureLocked(FeatureKey.TABLE_MANAGEMENT);
              return (
                <ListItem>
                  <Tooltip
                    title={locked ? t('feature.not.available') : ''}
                    placement="right"
                  >
                    <span style={{ width: '100%' }}>
                      <Button
                        {...(!locked && {
                          component: Link,
                          to: '/management/table-management'
                        })}
                        className={
                          currentRoute === '/management/table-management'
                            ? 'active'
                            : ''
                        }
                        disableRipple
                        onClick={locked ? undefined : closeSidebar}
                        startIcon={<EventSeatTwoTone />}
                        endIcon={
                          locked ? <LockTwoTone fontSize="small" /> : null
                        }
                        disabled={locked}
                        sx={{ opacity: locked ? 0.5 : 1 }}
                      >
                        {t('table.management')}
                      </Button>
                    </span>
                  </Tooltip>
                </ListItem>
              );
            })()}

            {shouldShowMenuItem('campaigns') &&
              (() => {
                const locked = isFeatureLocked(FeatureKey.CAMPAIGNS);
                return (
                  <ListItem>
                    <Tooltip
                      title={locked ? t('feature.not.available') : ''}
                      placement="right"
                    >
                      <span style={{ width: '100%' }}>
                        <Button
                          {...(!locked && {
                            component: Link,
                            to: '/management/campaigns'
                          })}
                          className={
                            currentRoute === '/management/campaigns'
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          onClick={locked ? undefined : closeSidebar}
                          startIcon={<RedeemTwoTone />}
                          endIcon={
                            locked ? <LockTwoTone fontSize="small" /> : null
                          }
                          disabled={locked}
                          sx={{ opacity: locked ? 0.5 : 1 }}
                        >
                          {t('campaign.management')}
                        </Button>
                      </span>
                    </Tooltip>
                  </ListItem>
                );
              })()}

            {shouldShowMenuItem('notifications') &&
              (() => {
                const locked = isFeatureLocked(FeatureKey.NOTIFICATIONS);
                return (
                  <ListItem>
                    <Tooltip
                      title={locked ? t('feature.not.available') : ''}
                      placement="right"
                    >
                      <span style={{ width: '100%' }}>
                        <Button
                          {...(!locked && {
                            component: Link,
                            to: '/management/notifications'
                          })}
                          className={
                            currentRoute === '/management/notifications'
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          onClick={locked ? undefined : closeSidebar}
                          startIcon={<NotificationsActiveTwoTone />}
                          endIcon={
                            locked ? <LockTwoTone fontSize="small" /> : null
                          }
                          disabled={locked}
                          sx={{ opacity: locked ? 0.5 : 1 }}
                        >
                          {t('notification.management')}
                        </Button>
                      </span>
                    </Tooltip>
                  </ListItem>
                );
              })()}

            {(() => {
              const locked = isFeatureLocked(FeatureKey.MEMBERSHIPS);
              return (
                <ListItem className="Mui-children">
                  <Tooltip
                    title={locked ? t('feature.not.available') : ''}
                    placement="right"
                  >
                    <span style={{ width: '100%' }}>
                      <Button
                        onClick={locked ? undefined : handleMembershipClick}
                        disableRipple
                        startIcon={<LoyaltyTwoTone />}
                        endIcon={
                          locked ? <LockTwoTone fontSize="small" /> : undefined
                        }
                        {...(!locked && {
                          endIcon: membershipOpen ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )
                        })}
                        disabled={locked}
                        sx={{ opacity: locked ? 0.5 : 1 }}
                      >
                        {t('membership.management')}
                      </Button>
                    </span>
                  </Tooltip>
                  {!locked && (
                    <Collapse in={membershipOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        <Box component="div" sx={{ pl: 2 }}>
                          <Button
                            className={
                              currentRoute === '/management/memberships'
                                ? 'active'
                                : ''
                            }
                            to="/management/memberships"
                            disableRipple
                            onClick={closeSidebar}
                            component={Link}
                            startIcon={<LoyaltyTwoTone />}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                          >
                            {t('memberships')}
                          </Button>
                        </Box>
                        <Box component="div" sx={{ pl: 2 }}>
                          <Button
                            className={
                              currentRoute === '/management/membership-plans'
                                ? 'active'
                                : ''
                            }
                            to="/management/membership-plans"
                            disableRipple
                            onClick={closeSidebar}
                            component={Link}
                            startIcon={<WorkspacePremiumTwoTone />}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                          >
                            {t('membership.plans')}
                          </Button>
                        </Box>
                      </List>
                    </Collapse>
                  )}
                </ListItem>
              );
            })()}

            {(() => {
              const locked = isFeatureLocked(FeatureKey.ACTIVITIES);
              return (
                <ListItem>
                  <Tooltip
                    title={locked ? t('feature.not.available') : ''}
                    placement="right"
                  >
                    <span style={{ width: '100%' }}>
                      <Button
                        {...(!locked && {
                          component: Link,
                          to: '/management/activities'
                        })}
                        className={
                          currentRoute === '/management/activities'
                            ? 'active'
                            : ''
                        }
                        disableRipple
                        onClick={locked ? undefined : closeSidebar}
                        startIcon={<LocalActivityTwoTone />}
                        endIcon={
                          locked ? <LockTwoTone fontSize="small" /> : null
                        }
                        disabled={locked}
                        sx={{ opacity: locked ? 0.5 : 1 }}
                      >
                        {t('activity.management')}
                      </Button>
                    </span>
                  </Tooltip>
                </ListItem>
              );
            })()}

            {shouldShowMenuItem('finance') &&
              (() => {
                const locked = isFeatureLocked(FeatureKey.FINANCE);
                return (
                  <ListItem>
                    <Tooltip
                      title={locked ? t('feature.not.available') : ''}
                      placement="right"
                    >
                      <span style={{ width: '100%' }}>
                        <Button
                          {...(!locked && {
                            component: Link,
                            to: '/management/finance'
                          })}
                          className={
                            currentRoute === '/management/finance'
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          onClick={locked ? undefined : closeSidebar}
                          startIcon={<AccountBalanceWalletTwoTone />}
                          endIcon={
                            locked ? <LockTwoTone fontSize="small" /> : null
                          }
                          disabled={locked}
                          sx={{ opacity: locked ? 0.5 : 1 }}
                        >
                          {t('finance.title')}
                        </Button>
                      </span>
                    </Tooltip>
                  </ListItem>
                );
              })()}

            {(() => {
              const locked = isFeatureLocked(FeatureKey.MOBILE_LOYALTY);
              return (
                <ListItem className="Mui-children">
                  <Tooltip
                    title={locked ? t('feature.not.available') : ''}
                    placement="right"
                  >
                    <span style={{ width: '100%' }}>
                      <Button
                        onClick={!locked ? handleLoyaltyClick : undefined}
                        disableRipple
                        disabled={locked}
                        startIcon={<StarsTwoTone />}
                        endIcon={
                          locked ? (
                            <LockTwoTone fontSize="small" />
                          ) : loyaltyOpen ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          )
                        }
                        sx={{ opacity: locked ? 0.5 : 1 }}
                      >
                        {t('loyalty.management')}
                      </Button>
                    </span>
                  </Tooltip>
                  {!locked && (
                    <Collapse in={loyaltyOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {shouldShowMenuItem('loyalty-settings') && (
                          <Box component="div" sx={{ pl: 2 }}>
                            <Button
                              className={
                                currentRoute === '/management/loyalty'
                                  ? 'active'
                                  : ''
                              }
                              to="/management/loyalty"
                              disableRipple
                              onClick={closeSidebar}
                              component={Link}
                              startIcon={<StarsTwoTone />}
                              fullWidth
                              sx={{ justifyContent: 'flex-start', py: 1 }}
                            >
                              {t('loyalty.settings')}
                            </Button>
                          </Box>
                        )}
                        <Box component="div" sx={{ pl: 2 }}>
                          <Button
                            className={
                              currentRoute === '/management/loyalty/products'
                                ? 'active'
                                : ''
                            }
                            to="/management/loyalty/products"
                            disableRipple
                            onClick={closeSidebar}
                            component={Link}
                            startIcon={<LoyaltyTwoTone />}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                          >
                            {t('loyalty.products')}
                          </Button>
                        </Box>
                        <Box component="div" sx={{ pl: 2 }}>
                          <Button
                            className={
                              currentRoute === '/management/vouchers'
                                ? 'active'
                                : ''
                            }
                            to="/management/vouchers"
                            disableRipple
                            onClick={closeSidebar}
                            component={Link}
                            startIcon={<CardGiftcardTwoTone />}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                          >
                            {t('voucher.templates.title')}
                          </Button>
                        </Box>
                        <Box component="div" sx={{ pl: 2 }}>
                          <Button
                            className={
                              currentRoute === '/management/stamp-cards'
                                ? 'active'
                                : ''
                            }
                            to="/management/stamp-cards"
                            disableRipple
                            onClick={closeSidebar}
                            component={Link}
                            startIcon={<LocalActivityTwoTone />}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1 }}
                          >
                            {t('stampCard.title')}
                          </Button>
                        </Box>
                      </List>
                    </Collapse>
                  )}
                </ListItem>
              );
            })()}

            {shouldShowMenuItem('plans') && (
              <ListItem className="Mui-children">
                <Button
                  onClick={handleLicensingClick}
                  disableRipple
                  startIcon={<WorkspacePremiumTwoTone />}
                  endIcon={licensingOpen ? <ExpandLess /> : <ExpandMore />}
                >
                  {t('licensing.management')}
                </Button>
                <Collapse in={licensingOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <Box component="div" sx={{ pl: 2 }}>
                      {userRole === 'SUPER_ADMIN' && (
                        <Button
                          to="/management/plans"
                          component={Link}
                          className={
                            currentRoute === '/management/plans' ? 'active' : ''
                          }
                          disableRipple
                          onClick={closeSidebar}
                          startIcon={<WorkspacePremiumTwoTone />}
                          fullWidth
                          sx={{ justifyContent: 'flex-start', py: 1 }}
                        >
                          {t('licensing.plans.management')}
                        </Button>
                      )}
                      {(userRole === 'COMPANY_ADMIN' ||
                        userRole === 'SUPER_ADMIN') && (
                        <Button
                          to="/management/subscriptions"
                          component={Link}
                          className={
                            currentRoute === '/management/subscriptions'
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          onClick={closeSidebar}
                          startIcon={<ReceiptLongTwoTone />}
                          fullWidth
                          sx={{ justifyContent: 'flex-start', py: 1 }}
                        >
                          {t('licensing.subscription.management')}
                        </Button>
                      )}
                      {userRole === 'SUPER_ADMIN' && (
                        <Button
                          to="/management/sms-packages"
                          component={Link}
                          className={
                            currentRoute === '/management/sms-packages'
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          onClick={closeSidebar}
                          startIcon={<SmsTwoTone />}
                          fullWidth
                          sx={{ justifyContent: 'flex-start', py: 1 }}
                        >
                          {t('sms.package.management')}
                        </Button>
                      )}
                    </Box>
                  </List>
                </Collapse>
              </ListItem>
            )}

            {isDev && (
              <ListItem>
                <Button
                  to="/management/permissions"
                  component={Link}
                  className={
                    currentRoute === '/management/permissions' ? 'active' : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<Key />}
                >
                  {t('permission.management')}
                </Button>
              </ListItem>
            )}
          </List>
        </SubMenuWrapper>
      </List>
      {isDev && (
        <List subheader={<ListSubheader disableSticky>Accounts</ListSubheader>}>
          <SubMenuWrapper>
            <List>
              {isDev && (
                <ListItem>
                  <Button
                    to="/management/profile"
                    component={Link}
                    className={
                      currentRoute === '/management/profile' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<AccountCircleTwoTone />}
                  >
                    User Profile
                  </Button>
                </ListItem>
              )}
              <ListItem>
                <Button
                  component={Link}
                  to="/management/profile/settings"
                  className={
                    currentRoute === '/management/profile/settings'
                      ? 'active'
                      : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<DisplaySettingsTwoTone />}
                >
                  Account Settings
                </Button>
              </ListItem>
            </List>
          </SubMenuWrapper>
        </List>
      )}

      {isDev && (
        <>
          <List
            subheader={<ListSubheader disableSticky>Components</ListSubheader>}
          >
            <SubMenuWrapper>
              <List>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/buttons"
                    className={
                      currentRoute === '/components/buttons' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<BallotTwoTone />}
                  >
                    Buttons
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/modals"
                    className={
                      currentRoute === '/components/modals' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<BeachAccessTwoTone />}
                  >
                    Modals
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/accordions"
                    className={
                      currentRoute === '/components/accordions' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<EmojiEventsTwoTone />}
                  >
                    Accordions
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/tabs"
                    className={
                      currentRoute === '/components/tabs' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<FilterVintageTwoTone />}
                  >
                    Tabs
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/badges"
                    className={
                      currentRoute === '/components/badges' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<HowToVoteTwoTone />}
                  >
                    Badges
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/tooltips"
                    className={
                      currentRoute === '/components/tooltips' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<LocalPharmacyTwoTone />}
                  >
                    Tooltips
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/avatars"
                    className={
                      currentRoute === '/components/avatars' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<RedeemTwoTone />}
                  >
                    Avatars
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/components/cards"
                    className={
                      currentRoute === '/components/cards' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<SettingsTwoTone />}
                  >
                    Cards
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    to="/components/forms"
                    component={Link}
                    className={
                      currentRoute === '/components/forms' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<TrafficTwoTone />}
                  >
                    Forms
                  </Button>
                </ListItem>
              </List>
            </SubMenuWrapper>
          </List>
          <List
            subheader={<ListSubheader disableSticky>Extra Pages</ListSubheader>}
          >
            <SubMenuWrapper>
              <List>
                <ListItem>
                  <Button
                    component={Link}
                    to="/status/404"
                    className={currentRoute === '/status/404' ? 'active' : ''}
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<CheckBoxTwoTone />}
                  >
                    Error 404
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    to="/status/500"
                    component={Link}
                    className={currentRoute === '/status/500' ? 'active' : ''}
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<CameraFrontTwoTone />}
                  >
                    Error 500
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    component={Link}
                    to="/status/coming-soon"
                    className={
                      currentRoute === '/status/coming-soon' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<ChromeReaderModeTwoTone />}
                  >
                    Coming Soon
                  </Button>
                </ListItem>
                <ListItem>
                  <Button
                    to="/status/maintenance"
                    component={Link}
                    className={
                      currentRoute === '/status/maintenance' ? 'active' : ''
                    }
                    disableRipple
                    onClick={closeSidebar}
                    startIcon={<WorkspacePremiumTwoTone />}
                  >
                    Maintenance
                  </Button>
                </ListItem>
              </List>
            </SubMenuWrapper>
          </List>
        </>
      )}

      {shouldShowMenuItem('adisyo') && (
        <List
          subheader={
            <ListSubheader disableSticky>
              {t('integrations.title')}
            </ListSubheader>
          }
        >
          <SubMenuWrapper>
            <List>
              {(() => {
                const locked = isFeatureLocked(FeatureKey.INTEGRATIONS);
                return (
                  <ListItem>
                    <Tooltip
                      title={locked ? t('feature.not.available') : ''}
                      placement="right"
                    >
                      <span style={{ width: '100%' }}>
                        <Button
                          {...(!locked && {
                            component: Link,
                            to: '/integrations/adisyo'
                          })}
                          className={
                            currentRoute === '/integrations/adisyo'
                              ? 'active'
                              : ''
                          }
                          disableRipple
                          onClick={locked ? undefined : closeSidebar}
                          startIcon={<ExtensionTwoTone />}
                          endIcon={
                            locked ? <LockTwoTone fontSize="small" /> : null
                          }
                          disabled={locked}
                          sx={{ opacity: locked ? 0.5 : 1 }}
                        >
                          Adisyo
                        </Button>
                      </span>
                    </Tooltip>
                  </ListItem>
                );
              })()}
            </List>
          </SubMenuWrapper>
        </List>
      )}

      {userRole === 'SUPER_ADMIN' && (
        <List
          subheader={
            <ListSubheader disableSticky>{t('changelog.system')}</ListSubheader>
          }
        >
          <SubMenuWrapper>
            <List>
              <ListItem>
                <Button
                  to="/management/changelog"
                  component={Link}
                  className={
                    currentRoute === '/management/changelog' ? 'active' : ''
                  }
                  disableRipple
                  onClick={closeSidebar}
                  startIcon={<RocketLaunchTwoTone />}
                >
                  {t('changelog.management.title')}
                </Button>
              </ListItem>
            </List>
          </SubMenuWrapper>
        </List>
      )}

      <List subheader={<ListSubheader disableSticky>İndirmeler</ListSubheader>}>
        <SubMenuWrapper>
          <List>
            {(() => {
              const locked = isFeatureLocked(FeatureKey.DESKTOP_APP);
              return (
                <ListItem>
                  <Tooltip
                    title={locked ? t('feature.not.available') : ''}
                    placement="right"
                  >
                    <span style={{ width: '100%' }}>
                      <Button
                        {...(!locked && {
                          component: Link,
                          to: '/downloads/desktop-app'
                        })}
                        className={
                          currentRoute === '/downloads/desktop-app'
                            ? 'active'
                            : ''
                        }
                        disableRipple
                        onClick={locked ? undefined : closeSidebar}
                        startIcon={<ComputerTwoTone />}
                        endIcon={
                          locked ? <LockTwoTone fontSize="small" /> : null
                        }
                        disabled={locked}
                        sx={{ opacity: locked ? 0.5 : 1 }}
                      >
                        Masaüstü Uygulaması
                      </Button>
                    </span>
                  </Tooltip>
                </ListItem>
              );
            })()}
          </List>
        </SubMenuWrapper>
      </List>
    </MenuWrapper>
  );
}

export default SidebarMenu;
