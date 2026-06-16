import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Alert, Box, Button, Collapse, IconButton } from '@mui/material';
import {
  Close,
  RefreshTwoTone,
  InfoOutlined,
  WarningAmberOutlined,
  ErrorOutlineOutlined
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { differenceInDays } from 'date-fns';
import { useUserViewMode } from '@/hooks/useUserViewMode';
import { licensingService } from '@/data/licensingService';
import {
  BranchSubscription,
  SubscriptionStatus
} from '@/types/Licensing.interface';

const STORAGE_KEY = 'subscriptionBannerDismissed';

const SubscriptionBanner = () => {
  const { t } = useTranslation();
  const { role: userRole, currentBranch } = useUserViewMode();
  const branchId = currentBranch?.id;

  const [subscription, setSubscription] = useState<BranchSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show for BRANCH_ADMIN
    if (userRole !== 'BRANCH_ADMIN' || !branchId) {
      setShouldShow(false);
      return;
    }

    // Check if dismissed today
    const dismissedDate = localStorage.getItem(STORAGE_KEY);
    const today = format(new Date(), 'yyyy-MM-dd');

    if (dismissedDate === today) {
      setShouldShow(false);
      return;
    }

    fetchSubscription();
  }, [userRole, branchId]);

  const fetchSubscription = async () => {
    if (!branchId) return;

    try {
      setLoading(true);
      const sub = await licensingService.getSubscription({ branchId });
      if (!sub) {
        setShouldShow(false);
        return;
      }

      setSubscription(sub);

      // Check if we should show banner (< 15 days or trial)
      const shouldDisplay = checkShouldDisplay(sub);
      setShouldShow(shouldDisplay);
      setOpen(shouldDisplay);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setShouldShow(false);
    } finally {
      setLoading(false);
    }
  };

  const checkShouldDisplay = (sub: BranchSubscription): boolean => {
    // Always show if in trial
    if (sub.status === SubscriptionStatus.TRIALING) {
      return true;
    }

    // Show if expired, cancelled, or past due
    if (
      sub.status === SubscriptionStatus.EXPIRED ||
      sub.status === SubscriptionStatus.CANCELLED ||
      sub.status === SubscriptionStatus.PAST_DUE
    ) {
      return true;
    }

    // Show if less than 15 days remaining
    if (sub.endDate) {
      const daysRemaining = differenceInDays(new Date(sub.endDate), new Date());
      return daysRemaining < 15;
    }

    return false;
  };

  const getDaysRemaining = (): number => {
    if (!subscription) return 0;

    // TRIALING durumunda trialEndsAt kullan
    if (
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.trialEndsAt
    ) {
      return Math.max(
        0,
        differenceInDays(new Date(subscription.trialEndsAt), new Date())
      );
    }

    // ACTIVE/PAST_DUE/diğer durumlar için endDate kullan
    if (subscription.endDate) {
      return Math.max(
        0,
        differenceInDays(new Date(subscription.endDate), new Date())
      );
    }

    return 0;
  };

  const getSeverity = (): 'success' | 'info' | 'warning' | 'error' => {
    if (!subscription) return 'info';

    const daysRemaining = getDaysRemaining();

    if (daysRemaining <= 2) return 'error';

    if (
      subscription.status === SubscriptionStatus.EXPIRED ||
      subscription.status === SubscriptionStatus.CANCELLED
    ) {
      return 'error';
    }

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      return 'warning';
    }

    // Orta kritik: 3-6 gün
    if (daysRemaining <= 6) return 'warning';

    // Uyarı: 7-14 gün (trial de dahil)
    if (daysRemaining <= 14) return 'info';

    return 'success';
  };

  const getMessage = (): string => {
    if (!subscription) return '';

    if (subscription.status === SubscriptionStatus.EXPIRED) {
      return t('licensing.subscription.banner.expired');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      return t('licensing.subscription.banner.cancelled');
    }

    if (subscription.status === SubscriptionStatus.PAST_DUE) {
      return t('licensing.subscription.banner.pastDue');
    }

    if (
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.trialEndsAt
    ) {
      const trialDays = differenceInDays(
        new Date(subscription.trialEndsAt),
        new Date()
      );
      return t('licensing.subscription.banner.trial', {
        days: Math.max(0, trialDays)
      });
    }

    const daysRemaining = getDaysRemaining();
    return t('licensing.subscription.banner.expiring', { days: daysRemaining });
  };

  const getIcon = () => {
    const severity = getSeverity();
    const iconProps = { fontSize: 'small' as const };

    switch (severity) {
      case 'error':
        return <ErrorOutlineOutlined {...iconProps} />;
      case 'warning':
        return <WarningAmberOutlined {...iconProps} />;
      case 'info':
        return <InfoOutlined {...iconProps} />;
      default:
        return <InfoOutlined {...iconProps} />;
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, format(new Date(), 'yyyy-MM-dd'));
  };

  const handleRenew = () => {
    // TODO: Integrate with PayTR when ready
    // For now, show tooltip "Coming soon"
  };

  const isUrgent = () => {
    if (!subscription) return false;
    const daysRemaining = getDaysRemaining();
    return (
      daysRemaining <= 2 ||
      subscription.status === SubscriptionStatus.EXPIRED ||
      subscription.status === SubscriptionStatus.CANCELLED ||
      subscription.status === SubscriptionStatus.PAST_DUE
    );
  };

  if (!shouldShow || loading) {
    return null;
  }

  const urgentState = isUrgent();
  const severity = getSeverity();
  const displaySeverity =
    urgentState && severity === 'error' ? 'warning' : severity;

  return (
    <Collapse in={open}>
      <Alert
        severity={displaySeverity}
        icon={false}
        action={
          !urgentState && (
            <Box display="flex" alignItems="center" gap={1}>
              <Button
                size="small"
                color="inherit"
                onClick={handleRenew}
                disabled
                startIcon={<RefreshTwoTone />}
                sx={{ opacity: 0.7, whiteSpace: 'nowrap' }}
              >
                {t('licensing.subscription.renew')}
              </Button>
              <IconButton size="small" color="inherit" onClick={handleDismiss}>
                <Close fontSize="small" />
              </IconButton>
            </Box>
          )
        }
        sx={{
          borderRadius: 0,
          py: 0.5,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          '& .MuiAlert-message': {
            py: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#fff',
            ...(urgentState && {
              fontWeight: 700,
              fontSize: '1rem'
            })
          },
          '& .MuiAlert-action': {
            py: 0,
            pl: 2,
            ml: 'auto',
            position: 'absolute',
            right: 5
          }
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          {getIcon()}
          {getMessage()}
        </Box>
      </Alert>
    </Collapse>
  );
};

export default SubscriptionBanner;
