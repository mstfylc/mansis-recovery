import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  CircularProgress,
  Chip,
  Button
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { userService } from '@/data/userService';
import { User } from '@/types/User.interface';
import { Role } from '@/enums/role';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import { formatCurrency } from '@/utils/formatters';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import PageHeader from '@/content/Management/Users/details/PageHeader';
import StatusLabel, { TicketStatusLabel } from '@/components/StatusLabel';
import { TopUp } from '@/types/TopUp.interface';
import { Order } from '@/types/Order.interface';
import { Ticket } from '@/types/Ticket.interface';
import { CampaignUserUsage } from '@/types/CampaignUserUsage.interface';
import { EmployeeAction } from '@/types/EmployeeAction.interface';
import { Wallet } from '@/types/Wallet.interface';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`
  };
}

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [campaignUsages, setCampaignUsages] = useState<CampaignUserUsage[]>([]);
  const [employeeActions, setEmployeeActions] = useState<EmployeeAction[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const { role: currentUserRole } = useUserViewMode();

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const userData = await userService.getById(Number(id));
        setUser(userData);

        if (userData.role === Role.CUSTOMER) {
          try {
            const walletData = await userService.getWallet(Number(id));
            setWallet(walletData as Wallet);
          } catch (error) {
            console.error('Error fetching wallet data:', error);
          }

          try {
            const topUpsData = await userService.getTopUps(Number(id));
            setTopUps(topUpsData as TopUp[]);
          } catch (error) {
            console.error('Error fetching top-ups data:', error);
          }

          try {
            const ordersData = await userService.getOrders(Number(id));
            setOrders(ordersData as Order[]);
          } catch (error) {
            console.error('Error fetching orders data:', error);
          }

          try {
            const ticketsData = await userService.getTickets(Number(id));
            setTickets(ticketsData as Ticket[]);
          } catch (error) {
            console.error('Error fetching tickets data:', error);
          }

          try {
            const campaignData = await userService.getCampaigns(Number(id));
            setCampaignUsages(campaignData as CampaignUserUsage[]);
          } catch (error) {
            console.error('Error fetching campaign data:', error);
          }
        } else if (
          userData.role === Role.EMPLOYEE ||
          userData.role === Role.BRANCH_ADMIN ||
          userData.role === Role.COMPANY_ADMIN
        ) {
          try {
            const actionsData = await userService.getActions(Number(id));
            setEmployeeActions(actionsData as EmployeeAction[]);
          } catch (error) {
            console.error('Error fetching employee actions:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box p={3}>
        <Typography variant="h4">{t('user.not.found')}</Typography>
      </Box>
    );
  }

  const renderTabs = () => {
    if (user.role === Role.CUSTOMER) {
      return [
        <Tab key="wallet" label={t('wallet.history')} {...a11yProps(0)} />,
        <Tab key="orders" label={t('orders')} {...a11yProps(1)} />,
        <Tab key="activities" label={t('activities')} {...a11yProps(2)} />,
        <Tab key="campaigns" label={t('campaign.usages')} {...a11yProps(3)} />
      ];
    } else {
      return [
        <Tab key="actions" label={t('employee.actions')} {...a11yProps(0)} />
      ];
    }
  };

  // Check if current user can manage branches
  const canManageBranches = () => {
    return (
      (currentUserRole === Role.SUPER_ADMIN ||
        currentUserRole === Role.COMPANY_ADMIN) &&
      user &&
      user.role === Role.BRANCH_ADMIN
    );
  };

  // Navigate to branch management page
  const handleManageBranches = () => {
    if (user) {
      navigate(`/management/users/${user.id}/branches`);
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${user.name} ${user.surname} - ${t('user.details')}`}</title>
      </Helmet>
      <PageTitleWrapper>
        <PageHeader user={user} />
      </PageTitleWrapper>
      <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  mb={2}
                >
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      mb: 2,
                      background: (theme) => theme.colors.primary.main
                    }}
                  >
                    {user.name.charAt(0)}
                    {user.surname.charAt(0)}
                  </Avatar>
                  <Typography variant="h4">
                    {user.name} {user.surname}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary">
                    {t(`roles.${user.role.toLowerCase()}`)}
                  </Typography>
                  <Box mt={1}>
                    <StatusLabel status={user.status} />
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    gutterBottom
                  >
                    {t('email')}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.email}
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    gutterBottom
                  >
                    {t('phone')}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {user.phone || '-'}
                  </Typography>

                  {user.userBranches && user.userBranches.length > 0 && (
                    <>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('branch')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {user.userBranches
                          .map((ub) => ub.branch?.name)
                          .join(', ')}
                      </Typography>
                    </>
                  )}

                  {!user.userBranches?.length && user.currentBranch && (
                    <>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('branch')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {user.currentBranch.name}
                      </Typography>
                    </>
                  )}

                  {user.company && (
                    <>
                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('company')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {user.company.name}
                      </Typography>
                    </>
                  )}

                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    gutterBottom
                  >
                    {t('created.at')}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDateToDayMonthYearTime(user.createdAt)}
                  </Typography>
                </Box>

                {user.role === Role.CUSTOMER && wallet && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography variant="h5" gutterBottom>
                        {t('wallet.information')}
                      </Typography>

                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('wallet.balance')}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        {formatCurrency(wallet.balance)} ₺
                      </Typography>

                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('points')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {wallet.points}
                      </Typography>

                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('login.streak')}
                      </Typography>

                      <Typography
                        variant="subtitle2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('free.count')}
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {wallet.freeCount}
                      </Typography>

                      {wallet.lastLogin && (
                        <>
                          <Typography
                            variant="subtitle2"
                            color="textSecondary"
                            gutterBottom
                          >
                            {t('last.login')}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {formatDateToDayMonthYearTime(wallet.lastLogin)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </>
                )}

                {canManageBranches() && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box display="flex" justifyContent="center" mt={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ManageAccountsIcon />}
                        onClick={handleManageBranches}
                      >
                        {t('manage.user.branches')}
                      </Button>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Tabs Section */}
          <Grid item xs={12} md={8}>
            <Card>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  aria-label="user details tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {renderTabs()}
                </Tabs>
              </Box>

              {user.role === Role.CUSTOMER ? (
                <div>
                  <TabPanel value={tabValue} index={0}>
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('date')}</TableCell>
                            <TableCell>{t('amount')}</TableCell>
                            <TableCell>{t('branch')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {topUps.length > 0 ? (
                            topUps.map((topUp, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {formatDateToDayMonthYearTime(
                                    topUp.createdAt
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography
                                    color="success.main"
                                    fontWeight="bold"
                                  >
                                    +{formatCurrency(topUp.amount)} ₺
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {topUp.branch?.name || '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} align="center">
                                <Typography variant="body1">
                                  {t('no.wallet.history')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TabPanel>

                  {/* Orders Tab */}
                  <TabPanel value={tabValue} index={1}>
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('order.id')}</TableCell>
                            <TableCell>{t('date')}</TableCell>
                            <TableCell>{t('discounted.price')}</TableCell>
                            <TableCell>{t('total')}</TableCell>
                            <TableCell>{t('payment.type')}</TableCell>
                            <TableCell>{t('branch')}</TableCell>
                            <TableCell>{t('status')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orders.length > 0 ? (
                            orders.map((order) => (
                              <TableRow key={order.id}>
                                <TableCell>#{order.id}</TableCell>
                                <TableCell>
                                  {formatDateToDayMonthYearTime(
                                    order.createdAt
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(order.netTotalPrice)} ₺
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(order.totalPrice)} ₺
                                </TableCell>
                                <TableCell>
                                  {t(
                                    `purchase.type.${order.purchaseType.toLowerCase()}`
                                  )}
                                </TableCell>
                                <TableCell>{order.branchName || '-'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={t(
                                      `order.status.${order.status.toLowerCase()}`
                                    )}
                                    color={
                                      order.status === 'PREPARING'
                                        ? 'warning'
                                        : order.status === 'READY'
                                          ? 'success'
                                          : order.status === 'DELIVERED'
                                            ? 'info'
                                            : order.status === 'CANCELED'
                                              ? 'error'
                                              : order.status === 'REFUNDED'
                                                ? 'secondary'
                                                : 'default'
                                    }
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography variant="body1">
                                  {t('no.orders')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TabPanel>

                  {/* Activities Tab */}
                  <TabPanel value={tabValue} index={2}>
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('activity')}</TableCell>
                            <TableCell>{t('activity.title')}</TableCell>
                            <TableCell>{t('branch')}</TableCell>
                            <TableCell>{t('date')}</TableCell>
                            <TableCell>{t('ticket.status')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tickets.length > 0 ? (
                            tickets.map((ticket, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {ticket.childActivity?.activity?.title || '-'}
                                </TableCell>
                                <TableCell>
                                  {ticket.childActivity?.title || '-'}
                                </TableCell>
                                <TableCell>
                                  {ticket.branch?.name || '-'}
                                </TableCell>
                                <TableCell>
                                  {formatDateToDayMonthYearTime(
                                    ticket.createdAt
                                  )}
                                </TableCell>
                                <TableCell>
                                  <TicketStatusLabel
                                    status={ticket.ticketUsageStatus}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                <Typography variant="body1">
                                  {t('no.activities')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TabPanel>

                  {/* Campaign Usages Tab */}
                  <TabPanel value={tabValue} index={3}>
                    <TableContainer component={Paper} elevation={0}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>{t('campaign')}</TableCell>
                            <TableCell>{t('total.usage')}</TableCell>
                            <TableCell>{t('remain')}</TableCell>
                            <TableCell>{t('purchase.type')}</TableCell>
                            <TableCell>{t('branch')}</TableCell>
                            <TableCell>{t('date')}</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {campaignUsages.length > 0 ? (
                            campaignUsages.map((usage) => (
                              <TableRow key={usage.id}>
                                <TableCell>
                                  {usage.campaign?.title || '-'}
                                </TableCell>
                                <TableCell>{usage.totalUsage}</TableCell>
                                <TableCell>{usage.remain}</TableCell>
                                <TableCell>
                                  {usage.purchaseType &&
                                    t(
                                      `purchase.type.${usage.purchaseType.toLowerCase()}`
                                    )}
                                </TableCell>
                                <TableCell>
                                  {usage.branch?.name || '-'}
                                </TableCell>
                                <TableCell>
                                  {formatDateToDayMonthYearTime(
                                    usage.createdAt
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography variant="body1">
                                  {t('no.campaign.usages')}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </TabPanel>
                </div>
              ) : (
                <TabPanel value={tabValue} index={0}>
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('action.type')}</TableCell>
                          <TableCell>{t('details')}</TableCell>
                          <TableCell>{t('branch')}</TableCell>
                          <TableCell>{t('date')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {employeeActions.length > 0 ? (
                          employeeActions.map((action, index) => (
                            <TableRow key={index}>
                              <TableCell>{action.type}</TableCell>
                              <TableCell>{action.details}</TableCell>
                              <TableCell>
                                {action.branch?.name || '-'}
                              </TableCell>
                              <TableCell>
                                {formatDateToDayMonthYearTime(action.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center">
                              <Typography variant="body1">
                                {t('no.employee.actions')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default UserDetails;
