import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Avatar,
  Checkbox,
  Divider,
  Tooltip,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  AddCircleTwoTone,
  RemoveCircleTwoTone,
  StorefrontTwoTone,
  CheckCircle,
  RadioButtonUnchecked,
  ExpandMore,
  ExpandLess,
  AddBusinessTwoTone,
  DeleteTwoTone,
  InventoryTwoTone,
  SearchTwoTone,
  CategoryTwoTone
} from '@mui/icons-material';
import ProductCategoryPickerModal from '@/components/dialogs/ProductCategoryPickerModal';
import { useTranslation } from 'react-i18next';
import { stampCardService } from '@/data/stampCardService';
import { Branch } from '@/types/Branch.interface';
import {
  StampCard,
  StampCardBranch,
  BranchProductItem
} from '@/types/StampCard.interface';

interface StampCardBranchProductsProps {
  stampCard: StampCard;
  branches: Branch[];
  fixedBranchId?: number;
  canManage: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const StampCardBranchProducts = ({
  stampCard,
  branches,
  fixedBranchId,
  canManage,
  onSuccess,
  onError
}: StampCardBranchProductsProps) => {
  const { t } = useTranslation();

  // Enrolled branches
  const [enrolledBranches, setEnrolledBranches] = useState<StampCardBranch[]>(
    []
  );
  const [loadingBranches, setLoadingBranches] = useState(false);

  // Branch enrollment dialog
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedBranchesToEnroll, setSelectedBranchesToEnroll] = useState<
    Set<number>
  >(new Set());

  // Expanded branch for product management
  const [expandedBranchId, setExpandedBranchId] = useState<number | null>(
    fixedBranchId || null
  );

  // Product states per branch
  const [branchProducts, setBranchProducts] = useState<BranchProductItem[]>([]);
  const [enrolledProductIds, setEnrolledProductIds] = useState<Set<number>>(
    new Set()
  );
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set()
  );

  // Per-branch enrolled product counts (live, updates on add/remove)
  const [branchProductCounts, setBranchProductCounts] = useState<
    Map<number, number>
  >(new Map());

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Category picker
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  // ============================================
  // BRANCH ENROLLMENT
  // ============================================

  const fetchEnrolledBranches = useCallback(async () => {
    try {
      setLoadingBranches(true);
      const result = await stampCardService.getEnrolledBranches(
        stampCard.companyId,
        stampCard.id
      );
      setEnrolledBranches(result?.branches || []);
    } catch {
      // Fallback: stampCard.branches zaten dolu gelebilir
      if (stampCard.branches) {
        setEnrolledBranches(stampCard.branches);
      }
    } finally {
      setLoadingBranches(false);
    }
  }, [stampCard]);

  useEffect(() => {
    fetchEnrolledBranches();
  }, [fetchEnrolledBranches]);

  // Auto-expand for fixedBranchId (branch admin)
  useEffect(() => {
    if (fixedBranchId) {
      setExpandedBranchId(fixedBranchId);
    }
  }, [fixedBranchId]);

  const enrolledBranchIds = new Set(enrolledBranches.map((b) => b.branchId));

  const unenrolledBranches = branches.filter(
    (b) => !enrolledBranchIds.has(b.id)
  );

  const handleOpenEnrollDialog = () => {
    setSelectedBranchesToEnroll(new Set());
    setEnrollDialogOpen(true);
  };

  const handleToggleBranchEnroll = (branchId: number) => {
    setSelectedBranchesToEnroll((prev) => {
      const next = new Set(prev);
      if (next.has(branchId)) {
        next.delete(branchId);
      } else {
        next.add(branchId);
      }
      return next;
    });
  };

  const handleEnrollBranches = async () => {
    if (selectedBranchesToEnroll.size === 0) return;
    try {
      await stampCardService.enrollBranches(
        stampCard.companyId,
        stampCard.id,
        Array.from(selectedBranchesToEnroll)
      );
      onSuccess(
        t('stampCard.branches.enroll.success', {
          count: selectedBranchesToEnroll.size
        })
      );
      setEnrollDialogOpen(false);
      fetchEnrolledBranches();
    } catch {
      onError(t('stampCard.branches.enroll.error'));
    }
  };

  const handleUnenrollBranch = async (branchId: number) => {
    try {
      await stampCardService.unenrollBranch(
        stampCard.companyId,
        stampCard.id,
        branchId
      );
      onSuccess(t('stampCard.branches.unenroll.success'));
      if (expandedBranchId === branchId) {
        setExpandedBranchId(null);
        setBranchProducts([]);
        setEnrolledProductIds(new Set());
        setSelectedProducts(new Set<number>());
      }
      fetchEnrolledBranches();
    } catch {
      onError(t('stampCard.branches.unenroll.error'));
    }
  };

  // ============================================
  // PRODUCT MANAGEMENT PER BRANCH
  // ============================================

  const fetchBranchProducts = useCallback(
    async (branchId: number) => {
      try {
        setLoadingProducts(true);

        // Şubeye özel ürünleri getir (override'ları dahil)
        const productsResult = await stampCardService.getBranchProducts(
          branchId,
          {
            status: 'ACTIVE',
            isForSale: true,
            limit: 1000
          }
        );

        // Bu şubenin kampanyaya eklediği ürünleri getir
        const enrolledResult = await stampCardService.getEnrolledProducts(
          stampCard.companyId,
          stampCard.id,
          branchId
        );

        const allProducts = productsResult?.items || [];
        const enrolled = new Set<number>(
          (enrolledResult?.products || []).map(
            (p: { companyProductId: number }) => p.companyProductId
          )
        );

        setBranchProducts(
          allProducts.map((p) => ({
            ...p,
            isEnrolled: enrolled.has(p.id)
          }))
        );
        setEnrolledProductIds(enrolled);
        setSelectedProducts(new Set<number>());

        // Update per-branch count
        setBranchProductCounts((prev) => {
          const next = new Map(prev);
          next.set(branchId, enrolled.size);
          return next;
        });
      } catch {
        onError(t('stampCard.products.error.fetch'));
      } finally {
        setLoadingProducts(false);
      }
    },
    [stampCard, t, onError]
  );

  const handleToggleBranch = (branchId: number) => {
    if (expandedBranchId === branchId) {
      setExpandedBranchId(null);
      setBranchProducts([]);
      setEnrolledProductIds(new Set());
      setSelectedProducts(new Set<number>());
    } else {
      setExpandedBranchId(branchId);
      fetchBranchProducts(branchId);
    }
  };

  useEffect(() => {
    if (expandedBranchId) {
      fetchBranchProducts(expandedBranchId);
    }
  }, [expandedBranchId, fetchBranchProducts]);

  const handleToggleProduct = (productId: number) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const notEnrolled = branchProducts
      .filter((p) => !enrolledProductIds.has(p.id))
      .map((p) => p.id);
    setSelectedProducts(new Set(notEnrolled));
  };

  const handleDeselectAll = () => {
    setSelectedProducts(new Set<number>());
  };

  const handleAddProducts = async () => {
    if (!expandedBranchId || selectedProducts.size === 0) return;

    const productIds = Array.from(selectedProducts).filter(
      (id) => !enrolledProductIds.has(id)
    );
    if (productIds.length === 0) return;

    try {
      setLoadingProducts(true);
      await stampCardService.addProducts(
        stampCard.companyId,
        stampCard.id,
        expandedBranchId,
        productIds
      );
      onSuccess(
        t('stampCard.products.add.success', { count: productIds.length })
      );
      fetchBranchProducts(expandedBranchId);
    } catch {
      onError(t('stampCard.products.error.add'));
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleRemoveProducts = async () => {
    if (!expandedBranchId || selectedProducts.size === 0) return;

    const productIds = Array.from(selectedProducts).filter((id) =>
      enrolledProductIds.has(id)
    );
    if (productIds.length === 0) return;

    try {
      setLoadingProducts(true);
      await stampCardService.removeProducts(
        stampCard.companyId,
        stampCard.id,
        expandedBranchId,
        productIds
      );
      onSuccess(
        t('stampCard.products.remove.success', { count: productIds.length })
      );
      fetchBranchProducts(expandedBranchId);
    } catch {
      onError(t('stampCard.products.error.remove'));
    } finally {
      setLoadingProducts(false);
    }
  };

  const selectedNotEnrolledCount = Array.from(selectedProducts).filter(
    (id) => !enrolledProductIds.has(id)
  ).length;
  const selectedEnrolledCount = Array.from(selectedProducts).filter((id) =>
    enrolledProductIds.has(id)
  ).length;

  // Filtered products by search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return branchProducts;
    const q = searchQuery.trim().toLowerCase();
    return branchProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [branchProducts, searchQuery]);

  // Filter enrolled branches for branch admin
  const visibleBranches = useMemo(() => {
    if (fixedBranchId) {
      return enrolledBranches.filter((b) => b.branchId === fixedBranchId);
    }
    return enrolledBranches;
  }, [enrolledBranches, fixedBranchId]);

  // Handle category picker product selection
  const handleCategoryProductsSelected = async (productIds: number[]) => {
    if (!expandedBranchId || productIds.length === 0) return;

    const newProductIds = productIds.filter(
      (id) => !enrolledProductIds.has(id)
    );
    if (newProductIds.length === 0) {
      setCategoryPickerOpen(false);
      return;
    }

    try {
      setLoadingProducts(true);
      await stampCardService.addProducts(
        stampCard.companyId,
        stampCard.id,
        expandedBranchId,
        newProductIds
      );
      onSuccess(
        t('stampCard.products.add.success', { count: newProductIds.length })
      );
      setCategoryPickerOpen(false);
      fetchBranchProducts(expandedBranchId);
    } catch {
      onError(t('stampCard.products.error.add'));
    } finally {
      setLoadingProducts(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 1,
          gap: 1,
          flexWrap: 'wrap'
        }}
      >
        <StorefrontTwoTone color="primary" />
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {t('stampCard.branches.title')}
        </Typography>
        {canManage && !fixedBranchId && unenrolledBranches.length > 0 && (
          <Button
            variant="contained"
            size="small"
            startIcon={<AddBusinessTwoTone />}
            onClick={handleOpenEnrollDialog}
          >
            {t('stampCard.branches.enroll')}
          </Button>
        )}
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('stampCard.branches.description')}
      </Typography>

      {/* Loading */}
      {loadingBranches && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No enrolled branches */}
      {!loadingBranches && visibleBranches.length === 0 && (
        <Alert severity="info">{t('stampCard.branches.noData')}</Alert>
      )}

      {/* Enrolled branches list */}
      {!loadingBranches && visibleBranches.length > 0 && (
        <List disablePadding>
          {visibleBranches.map((enrolled) => {
            const isExpanded = expandedBranchId === enrolled.branchId;
            const branchProductCount = branchProductCounts.has(
              enrolled.branchId
            )
              ? branchProductCounts.get(enrolled.branchId)!
              : (stampCard.products?.filter(
                  (p) => p.branchId === enrolled.branchId
                ).length ?? 0);

            return (
              <Box key={enrolled.id} sx={{ mb: 1 }}>
                <ListItem
                  sx={{
                    bgcolor: isExpanded
                      ? 'action.selected'
                      : 'background.default',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                  secondaryAction={
                    canManage && !fixedBranchId ? (
                      <Tooltip title={t('stampCard.branches.unenroll')}>
                        <IconButton
                          edge="end"
                          color="error"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnenrollBranch(enrolled.branchId);
                          }}
                        >
                          <DeleteTwoTone fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : undefined
                  }
                >
                  <ListItemIcon
                    sx={{ minWidth: 36, cursor: 'pointer' }}
                    onClick={() => handleToggleBranch(enrolled.branchId)}
                  >
                    {isExpanded ? <ExpandLess /> : <ExpandMore />}
                  </ListItemIcon>
                  <ListItemText
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleToggleBranch(enrolled.branchId)}
                    primary={enrolled.branch.name}
                    secondary={
                      <Chip
                        icon={<InventoryTwoTone />}
                        label={`${branchProductCount} ${t('stampCard.products.enrolled')}`}
                        size="small"
                        variant="outlined"
                        color={branchProductCount > 0 ? 'success' : 'default'}
                        sx={{ mt: 0.5, height: 22, fontSize: '0.75rem' }}
                      />
                    }
                  />
                </ListItem>

                {/* Expanded: Products */}
                <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                  <Box
                    sx={{
                      pl: 2,
                      pr: 1,
                      py: 2,
                      borderLeft: '2px solid',
                      borderColor: 'primary.main',
                      ml: 2,
                      mt: 0.5
                    }}
                  >
                    {loadingProducts && (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}

                    {!loadingProducts && branchProducts.length === 0 && (
                      <Alert severity="info" sx={{ mb: 1 }}>
                        {t('stampCard.products.noData')}
                      </Alert>
                    )}

                    {!loadingProducts && branchProducts.length > 0 && (
                      <>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            mb: 1.5,
                            flexWrap: 'wrap',
                            alignItems: 'center'
                          }}
                        >
                          <Chip
                            label={`${enrolledProductIds.size} / ${branchProducts.length} ${t('stampCard.products.enrolled')}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                          />
                          {canManage && (
                            <>
                              <Button size="small" onClick={handleSelectAll}>
                                {t('select.all')}
                              </Button>
                              <Button size="small" onClick={handleDeselectAll}>
                                {t('deselect.all')}
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CategoryTwoTone />}
                                onClick={() => setCategoryPickerOpen(true)}
                              >
                                {t('stampCard.products.addByCategory')}
                              </Button>
                              <Box sx={{ flexGrow: 1 }} />
                              <Tooltip title={t('stampCard.products.add')}>
                                <span>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<AddCircleTwoTone />}
                                    onClick={handleAddProducts}
                                    disabled={selectedNotEnrolledCount === 0}
                                  >
                                    {t('stampCard.products.add')} (
                                    {selectedNotEnrolledCount})
                                  </Button>
                                </span>
                              </Tooltip>
                              <Tooltip title={t('stampCard.products.remove')}>
                                <span>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<RemoveCircleTwoTone />}
                                    onClick={handleRemoveProducts}
                                    disabled={selectedEnrolledCount === 0}
                                  >
                                    {t('stampCard.products.remove')} (
                                    {selectedEnrolledCount})
                                  </Button>
                                </span>
                              </Tooltip>
                            </>
                          )}
                        </Box>

                        <Divider sx={{ mb: 1 }} />

                        {/* Search */}
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={t('stampCard.products.search')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchTwoTone
                                  fontSize="small"
                                  color="action"
                                />
                              </InputAdornment>
                            )
                          }}
                          sx={{ mb: 1 }}
                        />

                        <List
                          sx={{ maxHeight: 350, overflow: 'auto' }}
                          disablePadding
                          dense
                        >
                          {filteredProducts
                            .sort((a, b) => {
                              const aEnrolled = enrolledProductIds.has(a.id)
                                ? 0
                                : 1;
                              const bEnrolled = enrolledProductIds.has(b.id)
                                ? 0
                                : 1;
                              if (aEnrolled !== bEnrolled)
                                return aEnrolled - bEnrolled;
                              return a.name.localeCompare(b.name);
                            })
                            .map((product) => {
                              const isEnrolled = enrolledProductIds.has(
                                product.id
                              );
                              const isSelected = selectedProducts.has(
                                product.id
                              );

                              return (
                                <ListItem
                                  key={product.id}
                                  sx={{
                                    bgcolor: isEnrolled
                                      ? 'action.selected'
                                      : 'transparent',
                                    borderRadius: 1,
                                    mb: 0.5,
                                    py: 0.5
                                  }}
                                  secondaryAction={
                                    canManage ? (
                                      <Checkbox
                                        edge="end"
                                        checked={isSelected}
                                        onChange={() =>
                                          handleToggleProduct(product.id)
                                        }
                                        icon={<RadioButtonUnchecked />}
                                        checkedIcon={<CheckCircle />}
                                        size="small"
                                      />
                                    ) : undefined
                                  }
                                >
                                  <ListItemAvatar sx={{ minWidth: 44 }}>
                                    <Avatar
                                      src={
                                        product.file?.url ||
                                        product.image ||
                                        undefined
                                      }
                                      variant="rounded"
                                      sx={{ width: 36, height: 36 }}
                                    >
                                      {product.name.charAt(0)}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={product.name}
                                    secondary={
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1
                                        }}
                                      >
                                        {(product.price != null ||
                                          product.basePrice != null) && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {(
                                              product.price ?? product.basePrice
                                            )?.toFixed(2)}{' '}
                                            ₺
                                          </Typography>
                                        )}
                                        <Chip
                                          label={
                                            isEnrolled
                                              ? t('stampCard.products.enrolled')
                                              : t(
                                                  'stampCard.products.notEnrolled'
                                                )
                                          }
                                          size="small"
                                          color={
                                            isEnrolled ? 'success' : 'default'
                                          }
                                          variant="outlined"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              );
                            })}
                        </List>
                      </>
                    )}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </List>
      )}

      {/* Category Picker Modal */}
      {expandedBranchId && (
        <ProductCategoryPickerModal
          open={categoryPickerOpen}
          onClose={() => setCategoryPickerOpen(false)}
          branchId={expandedBranchId}
          onProductsSelected={handleCategoryProductsSelected}
          selectedProductIds={Array.from(enrolledProductIds)}
          title={t('stampCard.products.addByCategory')}
          multiSelect
        />
      )}

      {/* Branch Enrollment Dialog */}
      <Dialog
        open={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('stampCard.branches.enroll.title')}</DialogTitle>
        <DialogContent>
          {unenrolledBranches.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              {t('stampCard.branches.allEnrolled')}
            </Alert>
          ) : (
            <List>
              {unenrolledBranches.map((branch) => (
                <ListItem
                  key={branch.id}
                  dense
                  onClick={() => handleToggleBranchEnroll(branch.id)}
                  sx={{ cursor: 'pointer', borderRadius: 1 }}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selectedBranchesToEnroll.has(branch.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={branch.name} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleEnrollBranches}
            disabled={selectedBranchesToEnroll.size === 0}
          >
            {t('stampCard.branches.enroll')} ({selectedBranchesToEnroll.size})
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default StampCardBranchProducts;
