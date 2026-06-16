import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  IconButton
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { user$ } from '@/store/userStore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ManualAdjustmentModal from '@/content/Management/Finance/ManualAdjustmentModal';
import NegativeLimitModal from '@/content/Management/Finance/NegativeLimitModal';
import BranchBalancesTable from '@/content/Management/Finance/BranchBalancesTable';
import TransactionsTable from '@/content/Management/Finance/TransactionsTable';
import { financeService } from '@/data/financeService';
import { AccountingLedgerEntry } from '@/types/AccountingLedger.interface';
import { Filters } from '@/types/Filters';

interface BranchSummary {
  branchId: number;
  branchName: string;
  companyId: number;
  currentBalance: number;
  lastTransactionDate: string | null;
}

const AccountingLedger: React.FC = () => {
  const { t } = useTranslation();
  const user = user$.get();

  const isCompanyAdmin = user?.role === 'COMPANY_ADMIN';
  const isBranchAdmin = user?.role === 'BRANCH_ADMIN';

  const [entries, setEntries] = useState<AccountingLedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);

  const getCurrentTimezone = () =>
    user$.currentBranch.get()?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [transactionFilters, setTransactionFilters] = useState<Filters>({
    page: 0,
    limit: 10,
    search: '',
    transactionType: undefined,
    startDate: undefined,
    endDate: undefined,
    timezone: getCurrentTimezone()
  });

  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesTotal, setBranchesTotal] = useState(0);
  const [branchesPage, setBranchesPage] = useState(0);
  const [branchesLimit, setBranchesLimit] = useState(10);
  const [branchesSearch, setBranchesSearch] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedBranchName, setSelectedBranchName] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustmentBranchId, setAdjustmentBranchId] = useState<number | null>(
    null
  );
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  const effectiveBranchId = isBranchAdmin
    ? (user.currentBranch?.id ?? null)
    : null;

  useEffect(() => {
    if (isBranchAdmin) {
      fetchLedger();
    } else if (isCompanyAdmin) {
      if (viewMode === 'list') {
        fetchBranches();
      } else if (viewMode === 'detail' && selectedBranchId) {
        fetchLedgerForBranch(selectedBranchId);
      }
    }
  }, [
    transactionFilters,
    effectiveBranchId,
    viewMode,
    branchesPage,
    branchesLimit,
    branchesSearch
  ]);

  const fetchBranches = async () => {
    setBranchesLoading(true);

    try {
      const result = await financeService.getAccountingLedgerBranchesSummary({
        page: branchesPage,
        limit: branchesLimit,
        search: branchesSearch
      });

      setBranches(result.items);
      setBranchesTotal(result.total);
    } catch (error: any) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchLedgerForBranch = async (branchId: number) => {
    setLoading(true);

    try {
      const result = await financeService.getAccountingLedgerEntries({
        page: transactionFilters.page || 0,
        limit: transactionFilters.limit || 10,
        branchId,
        startDate: transactionFilters.startDate,
        endDate: transactionFilters.endDate,
        timezone: transactionFilters.timezone,
        transactionType: transactionFilters.transactionType,
        search: transactionFilters.search
      });

      setEntries(result.items);
      setTotal(result.total);
      setCurrentBalance(result.currentBalance || 0);
    } catch (error: any) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    if (!effectiveBranchId && isBranchAdmin) {
      return;
    }

    setLoading(true);

    try {
      const result = await financeService.getAccountingLedgerEntries({
        page: transactionFilters.page || 0,
        limit: transactionFilters.limit || 10,
        branchId: effectiveBranchId ?? undefined,
        startDate: transactionFilters.startDate,
        endDate: transactionFilters.endDate,
        timezone: transactionFilters.timezone,
        transactionType: transactionFilters.transactionType,
        search: transactionFilters.search
      });

      setEntries(result.items);
      setTotal(result.total);
      setCurrentBalance(result.currentBalance);
    } catch (error: any) {
      console.error('Error fetching ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionFilterChange = (filters: Filters) => {
    setTransactionFilters(filters);
  };

  return (
    <Box>
      {/* COMPANY_ADMIN: Branch List View */}
      {isCompanyAdmin && viewMode === 'list' && (
        <BranchBalancesTable
          branches={branches}
          loading={branchesLoading}
          totalCount={branchesTotal}
          onFilterChange={(filters) => {
            if (filters.page !== undefined) setBranchesPage(filters.page);
            if (filters.limit !== undefined) setBranchesLimit(filters.limit);
            if (filters.search !== undefined) setBranchesSearch(filters.search);
          }}
          onViewDetails={(branchId, branchName) => {
            setSelectedBranchId(branchId);
            setSelectedBranchName(branchName);
            setViewMode('detail');
            setTransactionFilters({
              page: 0,
              limit: 10,
              search: '',
              transactionType: undefined,
              startDate: undefined,
              endDate: undefined,
              timezone: getCurrentTimezone()
            });
          }}
          onAddAdjustment={(branchId, branchName) => {
            setSelectedBranchId(branchId);
            setSelectedBranchName(branchName);
            setAdjustmentBranchId(branchId);
            setAdjustmentModalOpen(true);
          }}
          onSetLimit={(branchId) => {
            setSelectedBranchId(branchId);
            setLimitModalOpen(true);
          }}
          pageKey="branch-balances"
        />
      )}

      {/* COMPANY_ADMIN: Detail View - Selected Branch Transactions */}
      {isCompanyAdmin && viewMode === 'detail' && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <IconButton
                  onClick={() => {
                    setViewMode('list');
                    setSelectedBranchId(null);
                    setSelectedBranchName('');
                    setEntries([]);
                    setTransactionFilters({
                      page: 0,
                      limit: 10,
                      search: '',
                      transactionType: undefined,
                      startDate: undefined,
                      endDate: undefined,
                      timezone: getCurrentTimezone()
                    });
                  }}
                  sx={{ mr: 1 }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <AccountBalanceIcon color="primary" />
                <Typography variant="h4">
                  {selectedBranchName} - {t('finance.accounting.ledger')}
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                {(user?.role === 'COMPANY_ADMIN' ||
                  user?.role === 'SUPER_ADMIN') && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setAdjustmentBranchId(selectedBranchId);
                        setAdjustmentModalOpen(true);
                      }}
                      size="small"
                    >
                      {t('finance.accounting.manual.adjustment')}
                    </Button>

                    <Button
                      variant="outlined"
                      startIcon={<SettingsIcon />}
                      onClick={() => setLimitModalOpen(true)}
                      size="small"
                    >
                      {t('finance.accounting.negative.limit')}
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Card>

          <TransactionsTable
            entries={entries}
            loading={loading}
            totalCount={total}
            currentBalance={currentBalance}
            onFilterChange={handleTransactionFilterChange}
            pageKey="company-admin-transactions"
          />
        </Box>
      )}

      {/* BRANCH_ADMIN: Transaction List View */}
      {isBranchAdmin && (
        <Box>
          <Card sx={{ mb: 2 }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <AccountBalanceIcon color="primary" />
                <Typography variant="h4">
                  {t('finance.accounting.ledger')}
                </Typography>

                <Box sx={{ flexGrow: 1 }} />
              </Stack>
            </Box>
          </Card>

          <TransactionsTable
            entries={entries}
            loading={loading}
            totalCount={total}
            currentBalance={currentBalance}
            onFilterChange={handleTransactionFilterChange}
            pageKey="branch-admin-transactions"
          />
        </Box>
      )}

      <ManualAdjustmentModal
        open={adjustmentModalOpen}
        onClose={() => {
          setAdjustmentModalOpen(false);
          setAdjustmentBranchId(null);
        }}
        branchId={adjustmentBranchId || effectiveBranchId}
        onSuccess={() => {
          if (isBranchAdmin) {
            fetchLedger();
          } else if (isCompanyAdmin) {
            if (viewMode === 'detail' && selectedBranchId) {
              fetchLedgerForBranch(selectedBranchId);
            } else {
              fetchBranches();
            }
          }
          setAdjustmentModalOpen(false);
          setAdjustmentBranchId(null);
        }}
      />

      <NegativeLimitModal
        open={limitModalOpen}
        onClose={() => {
          setLimitModalOpen(false);
          setSelectedBranchId(null);
        }}
        branchId={selectedBranchId || effectiveBranchId}
        onSuccess={() => {
          setLimitModalOpen(false);
          setSelectedBranchId(null);
          if (isCompanyAdmin) {
            fetchBranches();
          }
        }}
      />
    </Box>
  );
};

export default AccountingLedger;
