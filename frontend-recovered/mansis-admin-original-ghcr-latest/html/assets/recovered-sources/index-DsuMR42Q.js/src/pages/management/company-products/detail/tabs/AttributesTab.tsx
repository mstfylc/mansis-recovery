import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { Add as AddIcon, GetApp as ImportIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { companyProductService } from '@/data/companyProductService';
import { CompanyProduct } from '@/types/CompanyProduct.interface';
import {
  ProductAttribute,
  ProductAttributeOption
} from '@/types/ProductAttribute.interface';
import {
  CreateAttributeFormData,
  EditOptionFormData
} from './types/AttributeDialogTypes';
import CreateAttributeDialog from './CreateAttributeDialog';
import AddOptionDialog from './AddOptionDialog';
import EditOptionDialog from './EditOptionDialog';
import EditAttributeDialog from './EditAttributeDialog';
import AttributeGroupsList from '@/components/AttributeGroupsList';
import ConfirmDialog from '@/components/modals/ConfirmDialog';
import ImportAttributeDialog from '@/components/modals/ImportAttributeDialog';

interface AttributesTabProps {
  product: CompanyProduct;
}

const AttributesTab: React.FC<AttributesTabProps> = ({ product }) => {
  const { t } = useTranslation();

  const [attributeGroups, setAttributeGroups] = useState<ProductAttribute[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addOptionDialogOpen, setAddOptionDialogOpen] = useState(false);
  const [editOptionDialogOpen, setEditOptionDialogOpen] = useState(false);
  const [editAttributeDialogOpen, setEditAttributeDialogOpen] = useState(false);
  const [editingOption, setEditingOption] =
    useState<ProductAttributeOption | null>(null);
  const [editingAttribute, setEditingAttribute] =
    useState<ProductAttribute | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<ProductAttribute | null>(
    null
  );
  const [deletingAttribute, setDeletingAttribute] =
    useState<ProductAttributeOption | null>(null);
  const [deletingEntireAttribute, setDeletingEntireAttribute] =
    useState<ProductAttribute | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const handleShowSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
      setSnackbar({
        open: true,
        message,
        severity
      });
    },
    []
  );
  const fetchAttributes = useCallback(async () => {
    try {
      setLoading(true);

      const result = await companyProductService.getAttributes(product.id, {
        attributeType: 'PRODUCT_ATTRIBUTE',
        companyId: product.companyId
      });
      setAttributeGroups(result);
    } catch (err: any) {
      console.error('Error fetching product attributes:', err);
      const errorMessage =
        err.response?.data?.message || t('error.failed.to.load.attributes');
      handleShowSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [product.id, product.companyId, t, handleShowSnackbar]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleOpenCreateDialog = () => {
    setDialogError(null);
    setCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setDialogError(null);
    setCreateDialogOpen(false);
  };

  const handleOpenAddOptionDialog = (group: ProductAttribute) => {
    setSelectedGroup(group);
    setAddOptionDialogOpen(true);
  };

  const handleCloseAddOptionDialog = () => {
    setAddOptionDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleOpenEditOptionDialog = (option: ProductAttributeOption) => {
    setEditingOption(option);
    setEditOptionDialogOpen(true);
  };

  const handleCloseEditOptionDialog = () => {
    setEditOptionDialogOpen(false);
    setEditingOption(null);
  };

  const handleOpenEditAttributeDialog = (attribute: ProductAttribute) => {
    setDialogError(null);
    setEditingAttribute(attribute);
    setEditAttributeDialogOpen(true);
  };

  const handleOpenDeleteAttributeDialog = (attribute: ProductAttribute) => {
    setDeletingEntireAttribute(attribute);
  };

  const handleCloseEditAttributeDialog = () => {
    setDialogError(null);
    setEditAttributeDialogOpen(false);
    setEditingAttribute(null);
  };

  const handleCreateAttribute = async (formData: CreateAttributeFormData) => {
    try {
      // Always create PRODUCT_ATTRIBUTE type in Attributes Tab
      const attributeType = 'PRODUCT_ATTRIBUTE';

      const createData = {
        name: formData.groupName,
        attributeType,
        selectionType: 'OPTIONAL' as const,
        minSelection: 0,
        maxSelection: 1,
        isRequired: formData.isRequired,
        sortOrder: formData.sortOrder,
        options: [
          {
            name: formData.optionName,
            extraPrice: formData.extraPrice,
            isDefault: formData.isDefault,
            isAvailable: true,
            sortOrder: 0
          }
        ]
      };

      await companyProductService.createAttribute(product.id, createData);
      await fetchAttributes();

      // Clear any previous errors and show success message
      setDialogError(null);
      handleShowSnackbar(t('attribute.create.success.message'), 'success');
    } catch (err: any) {
      console.error('Error creating attribute:', err);

      const backendMessage = err.response?.data?.message;
      const errorMessage = backendMessage
        ? parseBackendErrorMessage(
            backendMessage,
            'error.failed.to.save.attribute'
          )
        : t('error.failed.to.save.attribute');

      setDialogError(errorMessage);
      throw err;
    }
  };

  /**
   * Parse backend error message and return localized error message
   */
  const parseBackendErrorMessage = (
    backendMessage: string,
    defaultErrorKey: string
  ): string => {
    const newSortOrderMatch = backendMessage.match(
      /Sort order (\d+) is already used by a (Menu Composition|Product Attribute) attribute \("(.+?)"\)\. You are trying to create a (Menu Composition|Product Attribute) attribute/
    );

    if (newSortOrderMatch) {
      const [, sortOrder, existingType, existingName, requestedType] =
        newSortOrderMatch;

      const getTypeName = (type: string) =>
        type === 'Menu Composition' ? 'Menü Kompozisyonu' : 'Ürün Özelliği';

      const existingTypeTR = getTypeName(existingType);
      const requestedTypeTR = getTypeName(requestedType);

      if (existingType === requestedType) {
        return t('error.attribute.sortorder.conflict.same.type', {
          sortOrder,
          typeName: existingTypeTR,
          existingName
        });
      } else {
        return t('error.attribute.sortorder.conflict.different.type', {
          sortOrder,
          existingType: existingTypeTR,
          existingName,
          requestedType: requestedTypeTR
        });
      }
    }

    const oldSortOrderMatch = backendMessage.match(
      /A (Menu Composition|Product Attribute) attribute with sort order (\d+) already exists for this product \("(.+)"\)/
    );

    if (oldSortOrderMatch) {
      const [, typeName, sortOrder, existingName] = oldSortOrderMatch;
      const typeNameTR =
        typeName === 'Menu Composition' ? 'Menü Kompozisyonu' : 'Ürün Özelliği';

      return t('error.attribute.sortorder.conflict.same.type', {
        sortOrder,
        typeName: typeNameTR,
        existingName
      });
    }

    const nameMatch = backendMessage.match(
      /An attribute with name "(.+)" already exists for this product/
    );

    if (nameMatch) {
      return t('error.attribute.name.already.exists', {
        name: nameMatch[1]
      });
    }

    return backendMessage || t(defaultErrorKey);
  };

  const handleCreateAndAddAnother = async (
    formData: CreateAttributeFormData
  ) => {
    await handleCreateAttribute(formData);
  };

  const handleAddOption = async (formData: {
    optionName: string;
    extraPrice: number;
    isDefault: boolean;
    sortOrder: number;
  }) => {
    try {
      if (!selectedGroup) {
        handleShowSnackbar(t('error.no.group.selected'), 'error');
        return;
      }

      // Add the new option to the existing options array
      const currentOptions = selectedGroup.options || [];

      // Map existing options to only include DTO-expected fields
      const cleanedOptions = currentOptions.map((option) => ({
        id: option.id,
        name: option.name,
        extraPrice: option.extraPrice,
        isDefault: option.isDefault,
        isAvailable: option.isAvailable,
        sortOrder: option.sortOrder,
        ...(option.linkedProductId && {
          linkedProductId: option.linkedProductId
        })
      }));

      const newOption = {
        name: formData.optionName,
        extraPrice: formData.extraPrice,
        isDefault: formData.isDefault,
        isAvailable: true,
        sortOrder: formData.sortOrder
      };

      const updateData = {
        options: [...cleanedOptions, newOption]
      };

      await companyProductService.updateAttribute(selectedGroup.id, updateData);
      await fetchAttributes();

      // Show success message
      handleShowSnackbar(t('option.add.success.message'), 'success');
    } catch (err: any) {
      console.error('Error adding option:', err);
      const errorMessage =
        err.response?.data?.message || t('error.failed.to.add.option');
      handleShowSnackbar(errorMessage, 'error');
      throw err;
    }
  };

  const handleEditOption = async (
    optionId: number,
    formData: EditOptionFormData
  ) => {
    try {
      // Find the attribute that contains this option
      const attribute = attributeGroups.find((attr) =>
        attr.options.some((option) => option.id === optionId)
      );

      if (!attribute) {
        handleShowSnackbar(t('error.option.attribute.not.found'), 'error');
        return;
      }

      // Update the specific option within the attribute's options array
      const updatedOptions = attribute.options.map((option) => {
        if (option.id === optionId) {
          return {
            id: option.id,
            name: formData.optionName,
            extraPrice: formData.extraPrice,
            isDefault: formData.isDefault,
            isAvailable: option.isAvailable, // Keep existing availability
            sortOrder: formData.sortOrder,
            ...(option.linkedProductId && {
              linkedProductId: option.linkedProductId
            })
          };
        }
        return {
          id: option.id,
          name: option.name,
          extraPrice: option.extraPrice,
          isDefault: option.isDefault,
          isAvailable: option.isAvailable,
          sortOrder: option.sortOrder,
          ...(option.linkedProductId && {
            linkedProductId: option.linkedProductId
          })
        };
      });

      const updateData = {
        options: updatedOptions
      };

      await companyProductService.updateAttribute(attribute.id, updateData);
      await fetchAttributes();

      // Show success message
      handleShowSnackbar(t('option.update.success.message'), 'success');
    } catch (err: any) {
      console.error('Error updating option:', err);
      const errorMessage =
        err.response?.data?.message || t('error.failed.to.save.attribute');
      handleShowSnackbar(errorMessage, 'error');
      throw err;
    }
  };

  const handleEditAttribute = async (formData: {
    attributeName: string;
    isRequired: boolean;
    sortOrder: number;
  }) => {
    try {
      if (!editingAttribute) {
        handleShowSnackbar(t('error.no.attribute.selected'), 'error');
        return;
      }

      const updateData = {
        name: formData.attributeName,
        isRequired: formData.isRequired,
        sortOrder: formData.sortOrder
      };

      await companyProductService.updateAttribute(
        editingAttribute.id,
        updateData
      );
      await fetchAttributes();

      setDialogError(null);
      handleShowSnackbar(t('attribute.edit.success.message'), 'success');
    } catch (err: any) {
      console.error('Error editing attribute:', err);

      const backendMessage = err.response?.data?.message;
      const errorMessage = backendMessage
        ? parseBackendErrorMessage(
            backendMessage,
            'error.failed.to.edit.attribute'
          )
        : t('error.failed.to.edit.attribute');

      setDialogError(errorMessage);
      throw err;
    }
  };

  const handleDeleteAttribute = async (attribute: ProductAttribute) => {
    try {
      // Use the new attribute delete endpoint
      await companyProductService.deleteAttribute(attribute.id);
      await fetchAttributes();
      setDeletingAttribute(null);

      // Show success message
      handleShowSnackbar(t('attribute.delete.success.message'), 'success');
    } catch (err: any) {
      console.error('Error deleting attribute:', err);
      const errorMessage =
        err.response?.data?.message || t('error.failed.to.delete.attribute');
      handleShowSnackbar(errorMessage, 'error');
    }
  };

  const handleDeleteOption = async (option: ProductAttributeOption) => {
    try {
      // Find the attribute that contains this option
      const attribute = attributeGroups.find(
        (attr) => attr.id === option.attributeId
      );

      if (!attribute) {
        handleShowSnackbar(t('error.attribute.not.found'), 'error');
        return;
      }

      // Use the new attribute update endpoint to delete the option via deleteOptionIds
      await companyProductService.updateAttribute(attribute.id, {
        deleteOptionIds: [option.id]
      });

      await fetchAttributes();
      setDeletingAttribute(null);

      // Show success message
      handleShowSnackbar(t('option.delete.success.message'), 'success');
    } catch (err: any) {
      console.error('Error deleting option:', err);
      const errorMessage =
        err.response?.data?.message || t('error.failed.to.delete.option');
      handleShowSnackbar(errorMessage, 'error');
    }
  };

  const handleImportSuccess = async (importedGroup: ProductAttribute) => {
    await fetchAttributes();
    setImportDialogOpen(false);
    // Show success message with the imported group name
    handleShowSnackbar(
      t('attribute.group.imported.successfully', {
        group: importedGroup.name
      }),
      'success'
    );
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Helper function to check if this is the last option in a group
  const isLastOptionInGroup = (
    option: ProductAttributeOption | null
  ): boolean => {
    if (!option) return false;

    // Find the attribute/group that contains this option
    const attribute = attributeGroups.find(
      (attr) => attr.id === option.attributeId
    );

    return attribute ? attribute.options.length === 1 : false;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">{t('product.attributes')}</Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setImportDialogOpen(true)}
          >
            {t('import.attribute')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateDialog}
          >
            {t('add.attribute')}
          </Button>
        </Box>
      </Box>

      {attributeGroups.length === 0 ? (
        <Alert severity="info">{t('no.attributes.found')}</Alert>
      ) : (
        <AttributeGroupsList
          attributeGroups={attributeGroups}
          onAddOption={handleOpenAddOptionDialog}
          onEditGroup={handleOpenEditAttributeDialog}
          onDeleteGroup={handleOpenDeleteAttributeDialog}
          onEditOption={handleOpenEditOptionDialog}
          onDeleteAttribute={setDeletingAttribute}
        />
      )}

      {/* Create New Attribute Dialog */}
      <CreateAttributeDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onSave={handleCreateAttribute}
        onSaveAndAddAnother={handleCreateAndAddAnother}
        errorMessage={dialogError}
        onErrorDismiss={() => setDialogError(null)}
      />

      {/* Add Option to Existing Group Dialog */}
      <AddOptionDialog
        open={addOptionDialogOpen}
        group={selectedGroup}
        onClose={handleCloseAddOptionDialog}
        onSave={handleAddOption}
      />

      {/* Edit Existing Attribute Dialog */}
      {/* Edit Option Dialog */}
      <EditOptionDialog
        open={editOptionDialogOpen}
        option={editingOption}
        onClose={handleCloseEditOptionDialog}
        onSave={handleEditOption}
      />

      {/* Edit Attribute Dialog */}
      <EditAttributeDialog
        open={editAttributeDialogOpen}
        attribute={editingAttribute}
        onClose={handleCloseEditAttributeDialog}
        onSave={handleEditAttribute}
        errorMessage={dialogError}
        onErrorDismiss={() => setDialogError(null)}
      />

      {/* Import Attribute Dialog */}
      <ImportAttributeDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        productId={product.id}
        onImportSuccess={handleImportSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingAttribute}
        onClose={() => setDeletingAttribute(null)}
        onConfirm={() => {
          if (deletingAttribute) {
            if (isLastOptionInGroup(deletingAttribute)) {
              // If this is the last option, we need to delete the entire attribute
              const attribute = attributeGroups.find(
                (attr) => attr.id === deletingAttribute.attributeId
              );
              if (attribute) {
                handleDeleteAttribute(attribute);
              }
            } else {
              // Otherwise, just delete the option
              handleDeleteOption(deletingAttribute);
            }
          }
        }}
        title={t('confirm.delete')}
        message={
          t('confirm.delete.attribute.message', {
            option: deletingAttribute?.name,
            group: attributeGroups.find(
              (attr) => attr.id === deletingAttribute?.attributeId
            )?.name
          }) +
          (isLastOptionInGroup(deletingAttribute)
            ? ' ' +
              t('confirm.delete.last.option.warning', {
                group: attributeGroups.find(
                  (attr) => attr.id === deletingAttribute?.attributeId
                )?.name
              })
            : '')
        }
        confirmButtonText={t('delete')}
        confirmButtonColor="error"
      />

      {/* Delete Entire Attribute Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingEntireAttribute}
        onClose={() => setDeletingEntireAttribute(null)}
        onConfirm={() => {
          if (deletingEntireAttribute) {
            handleDeleteAttribute(deletingEntireAttribute);
            setDeletingEntireAttribute(null);
          }
        }}
        title={t('confirm.delete.attribute')}
        message={t('confirm.delete.attribute.with.options.message', {
          attribute: deletingEntireAttribute?.name,
          optionCount: deletingEntireAttribute?.options?.length || 0
        })}
        confirmButtonText={t('delete')}
        confirmButtonColor="error"
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttributesTab;
