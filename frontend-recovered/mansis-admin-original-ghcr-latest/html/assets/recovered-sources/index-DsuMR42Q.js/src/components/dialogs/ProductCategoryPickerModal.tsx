import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Collapse,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  alpha
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Category as CategoryIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { menuService } from '@/data/menuService';

interface CategoryWithCount {
  id: number;
  name: string;
  file?: { url: string } | null;
  productCount: number;
}

interface ProductItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  basePrice: number;
  file?: { url: string } | null;
  status: string;
  isMenu: boolean;
  stockQuantity?: number | null;
}

interface ProductCategoryPickerModalProps {
  open: boolean;
  onClose: () => void;
  branchId: number;
  onProductsSelected: (productIds: number[]) => void;
  selectedProductIds?: number[];
  title?: string;
  multiSelect?: boolean;
}

const ProductCategoryPickerModal = ({
  open,
  onClose,
  branchId,
  onProductsSelected,
  selectedProductIds = [],
  title,
  multiSelect = true
}: ProductCategoryPickerModalProps) => {
  const { t } = useTranslation();

  // State
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [categoryProducts, setCategoryProducts] = useState<
    Map<number, ProductItem[]>
  >(new Map());
  const [categoryProductsLoading, setCategoryProductsLoading] = useState<
    Set<number>
  >(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set(selectedProductIds)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryHasMore, setCategoryHasMore] = useState<Map<number, boolean>>(
    new Map()
  );
  const [categoryPage, setCategoryPage] = useState<Map<number, number>>(
    new Map()
  );

  // Fetch categories with product count
  const fetchCategories = useCallback(async () => {
    if (!branchId) return;

    setCategoriesLoading(true);
    try {
      const result = await menuService.getBranchMenuCategories(branchId, {
        status: 'ACTIVE',
        search: searchQuery || undefined
      });
      setCategories(result || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  }, [branchId, searchQuery]);

  // Fetch products for a specific category
  const fetchCategoryProducts = useCallback(
    async (categoryId: number, page: number = 1, append: boolean = false) => {
      if (!branchId) return;

      setCategoryProductsLoading((prev) => new Set(prev).add(categoryId));
      try {
        const result = await menuService.getBranchMenuCategoryProducts(
          branchId,
          categoryId,
          {
            page,
            limit: 50,
            status: 'ACTIVE',
            search: searchQuery || undefined
          }
        );

        const { data: products, hasMore } = result;

        setCategoryProducts((prev) => {
          const newMap = new Map(prev);
          if (append) {
            const existing = newMap.get(categoryId) || [];
            newMap.set(categoryId, [...existing, ...products]);
          } else {
            newMap.set(categoryId, products);
          }
          return newMap;
        });

        setCategoryHasMore((prev) => new Map(prev).set(categoryId, hasMore));
        setCategoryPage((prev) => new Map(prev).set(categoryId, page));
      } catch (error) {
        console.error('Error fetching category products:', error);
      } finally {
        setCategoryProductsLoading((prev) => {
          const newSet = new Set(prev);
          newSet.delete(categoryId);
          return newSet;
        });
      }
    },
    [branchId, searchQuery]
  );

  // Effect: Fetch categories when modal opens or search changes
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open, fetchCategories]);

  // Effect: Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedProducts(new Set(selectedProductIds));
      setExpandedCategories(new Set());
      setCategoryProducts(new Map());
      setCategoryHasMore(new Map());
      setCategoryPage(new Map());
    }
  }, [open, selectedProductIds]);

  // Handle category expand/collapse
  const handleToggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
        // Fetch products if not already loaded
        if (!categoryProducts.has(categoryId)) {
          fetchCategoryProducts(categoryId);
        }
      }
      return newSet;
    });
  };

  // Handle select all products in a category
  const handleSelectCategory = (categoryId: number) => {
    const products = categoryProducts.get(categoryId) || [];
    const allProductIds = products.map((p) => p.id);
    const allSelected = allProductIds.every((id) => selectedProducts.has(id));

    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all
        allProductIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all
        allProductIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  // Handle single product selection
  const handleSelectProduct = (productId: number) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        if (!multiSelect) {
          newSet.clear();
        }
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Handle load more products
  const handleLoadMore = (categoryId: number) => {
    const currentPage = categoryPage.get(categoryId) || 1;
    fetchCategoryProducts(categoryId, currentPage + 1, true);
  };

  // Handle confirm selection
  const handleConfirm = () => {
    onProductsSelected(Array.from(selectedProducts));
    onClose();
  };

  // Get category selection state
  const getCategorySelectionState = (
    categoryId: number
  ): 'none' | 'some' | 'all' => {
    const products = categoryProducts.get(categoryId) || [];
    if (products.length === 0) return 'none';

    const selectedCount = products.filter((p) =>
      selectedProducts.has(p.id)
    ).length;
    if (selectedCount === 0) return 'none';
    if (selectedCount === products.length) return 'all';
    return 'some';
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (open) {
        fetchCategories();
        // Also refetch products for expanded categories
        expandedCategories.forEach((categoryId) => {
          fetchCategoryProducts(categoryId);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh', maxHeight: 700 }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <CategoryIcon color="primary" />
            <Typography variant="h6">
              {title || t('product.category.picker.title')}
            </Typography>
            {selectedProducts.size > 0 && (
              <Chip
                label={`${selectedProducts.size} ${t('selected')}`}
                color="primary"
                size="small"
              />
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <Box sx={{ px: 3, py: 1.5 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('search.products.or.categories')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {categoriesLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress />
          </Box>
        ) : categories.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography color="text.secondary">
              {t('no.categories.found')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ pt: 0 }}>
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const isLoading = categoryProductsLoading.has(category.id);
              const products = categoryProducts.get(category.id) || [];
              const selectionState = getCategorySelectionState(category.id);
              const hasMore = categoryHasMore.get(category.id) || false;
              const selectedInCategory = products.filter((p) =>
                selectedProducts.has(p.id)
              ).length;

              return (
                <Box key={category.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      isExpanded &&
                      products.length > 0 && (
                        <Tooltip
                          title={
                            selectionState === 'all'
                              ? t('deselect.all')
                              : t('select.all.category')
                          }
                        >
                          <Checkbox
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCategory(category.id);
                            }}
                            checked={selectionState === 'all'}
                            indeterminate={selectionState === 'some'}
                            sx={{
                              color: 'text.secondary',
                              '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                                color: 'primary.main'
                              }
                            }}
                          />
                        </Tooltip>
                      )
                    }
                  >
                    <ListItemButton
                      onClick={() => handleToggleCategory(category.id)}
                      sx={{
                        py: 1.5,
                        transition: 'all 0.2s ease',
                        ...(isExpanded && {
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.06),
                          borderLeft: (theme) =>
                            `3px solid ${theme.palette.primary.main}`
                        }),
                        ...(!isExpanded && {
                          borderLeft: '3px solid transparent'
                        })
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={selectedInCategory || null}
                          color="primary"
                          max={99}
                        >
                          <Avatar
                            variant="rounded"
                            src={category.file?.url}
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: (theme) =>
                                isExpanded
                                  ? alpha(theme.palette.primary.main, 0.15)
                                  : alpha(theme.palette.secondary.main, 0.08),
                              color: isExpanded
                                ? 'primary.main'
                                : 'text.secondary',
                              border: (theme) =>
                                isExpanded
                                  ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                                  : `1px solid ${theme.palette.divider}`,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CategoryIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight={600}>
                              {category.name}
                            </Typography>
                            <Chip
                              label={`${category.productCount} ${t('products')}`}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                borderColor: 'divider'
                              }}
                            />
                            {selectedInCategory > 0 && (
                              <Chip
                                label={`${selectedInCategory} ${t('selected')}`}
                                size="small"
                                color="primary"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                        {isLoading ? (
                          <CircularProgress size={20} />
                        ) : isExpanded ? (
                          <ExpandLessIcon color="action" />
                        ) : (
                          <ExpandMoreIcon color="action" />
                        )}
                      </ListItemIcon>
                    </ListItemButton>
                  </ListItem>

                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <Box
                      sx={{
                        mx: 2,
                        mb: 1,
                        ml: 3,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        bgcolor: (theme) =>
                          alpha(theme.palette.background.paper, 0.45),
                        border: (theme) =>
                          `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        borderLeft: (theme) =>
                          `2px solid ${alpha(theme.palette.primary.main, 0.25)}`
                      }}
                    >
                      {isLoading && products.length === 0 ? (
                        <Box display="flex" justifyContent="center" py={3}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : products.length === 0 ? (
                        <Box display="flex" justifyContent="center" py={3}>
                          <Typography variant="body2" color="text.secondary">
                            {t('no.products.in.category')}
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <List dense disablePadding>
                            {products.map((product, idx) => {
                              const isSelected = selectedProducts.has(
                                product.id
                              );
                              const isLast = idx === products.length - 1;

                              return (
                                <ListItem
                                  key={product.id}
                                  disablePadding
                                  sx={{
                                    borderBottom: isLast
                                      ? 'none'
                                      : (theme) =>
                                          `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                                    bgcolor: isSelected
                                      ? (theme) =>
                                          alpha(
                                            theme.palette.primary.main,
                                            0.08
                                          )
                                      : 'transparent',
                                    transition: 'background-color 0.15s',
                                    '&:hover': {
                                      bgcolor: (theme) =>
                                        isSelected
                                          ? alpha(
                                              theme.palette.primary.main,
                                              0.14
                                            )
                                          : alpha(
                                              theme.palette.secondary.main,
                                              0.06
                                            )
                                    }
                                  }}
                                >
                                  <ListItemButton
                                    onClick={() =>
                                      handleSelectProduct(product.id)
                                    }
                                    dense
                                    sx={{ py: 0.75 }}
                                  >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      <Checkbox
                                        edge="start"
                                        checked={isSelected}
                                        tabIndex={-1}
                                        disableRipple
                                        size="small"
                                        sx={{
                                          color: 'text.secondary',
                                          '&.Mui-checked': {
                                            color: 'primary.main'
                                          }
                                        }}
                                      />
                                    </ListItemIcon>
                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                      <Avatar
                                        variant="rounded"
                                        src={product.file?.url || undefined}
                                        sx={{
                                          width: 34,
                                          height: 34,
                                          bgcolor: (theme) =>
                                            alpha(
                                              theme.palette.secondary.main,
                                              0.12
                                            ),
                                          color: 'text.secondary',
                                          fontSize: '0.85rem',
                                          fontWeight: 600
                                        }}
                                      >
                                        {product.name.charAt(0).toUpperCase()}
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={
                                        <Typography
                                          variant="body2"
                                          fontWeight={isSelected ? 600 : 400}
                                          color={
                                            isSelected
                                              ? 'primary.main'
                                              : 'text.primary'
                                          }
                                        >
                                          {product.name}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {product.price?.toFixed(2)} ₺
                                        </Typography>
                                      }
                                    />
                                  </ListItemButton>
                                </ListItem>
                              );
                            })}
                          </List>

                          {hasMore && (
                            <Box
                              display="flex"
                              justifyContent="center"
                              py={1}
                              sx={{
                                borderTop: (theme) =>
                                  `1px solid ${alpha(theme.palette.divider, 0.4)}`
                              }}
                            >
                              <Button
                                size="small"
                                onClick={() => handleLoadMore(category.id)}
                                disabled={isLoading}
                                startIcon={
                                  isLoading ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <ExpandMoreIcon />
                                  )
                                }
                              >
                                {t('load.more')}
                              </Button>
                            </Box>
                          )}
                        </>
                      )}
                    </Box>
                  </Collapse>

                  <Divider />
                </Box>
              );
            })}
          </List>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} color="inherit">
          {t('cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedProducts.size === 0}
          startIcon={<AddIcon />}
        >
          {t('add.selected')} ({selectedProducts.size})
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductCategoryPickerModal;
