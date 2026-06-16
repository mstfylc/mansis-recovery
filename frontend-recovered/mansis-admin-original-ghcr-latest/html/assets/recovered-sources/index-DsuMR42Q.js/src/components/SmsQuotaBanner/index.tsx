import React, { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Alert, Box, Button, Collapse, IconButton } from '@mui/material';
import {
  Close,
  WarningAmberOutlined,
  ErrorOutlineOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { licensingService } from '@/data/licensingService';
import { SmsQuotaStatus } from '@/types/Licensing.interface';
import { useTranslation } from 'react-i18next';
import { useUserViewMode } from '@/hooks/useUserViewMode';

const SMS_BANNER_STORAGE_KEY = 'smsQuotaBannerDismissed';

export const SmsQuotaBanner: React.FC = () => {
  const [quotaStatus, setQuotaStatus] = useState<SmsQuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [shouldShow, setShouldShow] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { role: userRole, currentBranch } = useUserViewMode();
  const branchId = currentBranch?.id;

  const fetchSmsQuotaStatus = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!branchId) {
        setIsLoading(false);
        return;
      }

      const data = await licensingService.getSmsQuota({ branchId });
      if (!data || data.totalQuota === 0) {
        setShouldShow(false);
        setIsLoading(false);
        return;
      }

      setQuotaStatus(data);

      const percentageRemaining = (data.remaining / data.totalQuota) * 100;
      const shouldDisplay = data.remaining === 0 || percentageRemaining <= 10;
      setShouldShow(shouldDisplay);
      setOpen(shouldDisplay);
    } catch (error: any) {
      console.error('Failed to fetch SMS quota:', error);
      setShouldShow(false);
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (userRole !== 'BRANCH_ADMIN' || !branchId) {
      setShouldShow(false);
      return;
    }

    const dismissedDate = localStorage.getItem(SMS_BANNER_STORAGE_KEY);
    const today = format(new Date(), 'yyyy-MM-dd');

    if (dismissedDate === today) {
      setShouldShow(false);
      return;
    }

    fetchSmsQuotaStatus();
  }, [userRole, branchId, fetchSmsQuotaStatus]);

  const getSeverity = (): 'warning' | 'error' => {
    if (!quotaStatus) return 'warning';
    return quotaStatus.remaining === 0 ? 'error' : 'warning';
  };

  const getIcon = () => {
    const severity = getSeverity();
    const iconProps = { fontSize: 'small' as const };
    return severity === 'error' ? (
      <ErrorOutlineOutlined {...iconProps} />
    ) : (
      <WarningAmberOutlined {...iconProps} />
    );
  };

  const getMessage = (): string => {
    if (!quotaStatus) return '';

    if (quotaStatus.remaining === 0) {
      return t('sms.quota.banner.depleted');
    }

    const percentageRemaining = (
      (quotaStatus.remaining / quotaStatus.totalQuota) *
      100
    ).toFixed(1);

    return t('sms.quota.banner.low', {
      percentage: percentageRemaining,
      remaining: quotaStatus.remaining,
      total: quotaStatus.totalQuota
    });
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(
      SMS_BANNER_STORAGE_KEY,
      format(new Date(), 'yyyy-MM-dd')
    );
  };

  const isDepleted = quotaStatus?.remaining === 0;

  if (!shouldShow || isLoading) {
    return null;
  }

  const severity = getSeverity();

  return (
    <Collapse in={open}>
      <Alert
        severity={severity}
        icon={false}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              size="small"
              color="inherit"
              onClick={() => navigate('/settings/subscription')}
              sx={{ opacity: 0.7, whiteSpace: 'nowrap' }}
            >
              {t('sms.quota.buy.more')}
            </Button>
            {!isDepleted && (
              <IconButton size="small" color="inherit" onClick={handleDismiss}>
                <Close fontSize="small" />
              </IconButton>
            )}
          </Box>
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
            ...(isDepleted && {
              fontWeight: 700
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
