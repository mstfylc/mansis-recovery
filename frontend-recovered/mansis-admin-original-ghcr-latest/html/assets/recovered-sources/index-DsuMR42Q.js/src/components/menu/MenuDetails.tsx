import React from 'react';
import {
  Box,
  Stack,
  Button,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Typography,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  CompanyMenuItem,
  SelectionType
} from '@/types/CompanyProduct.interface';
import {
  prepareSelectionTypeLabel,
  getSelectionTypeColor
} from '@/utils/helpers';

interface MenuGroup {
  attributeId: number;
  groupName: string;
  selectionType: SelectionType;
  minSelection: number;
  maxSelection: number;
  sortOrder: number;
  items: CompanyMenuItem[];
}

interface MenuDetailsProps {
  groupedItems: MenuGroup[];
  loading: boolean;
  canManageMenus: boolean;
  onCreateGroup: () => void;
  onBulkAdd: () => void;
  onPreview: () => void;
  onEditGroup: (group: MenuGroup) => void;
  onDeleteGroup: (groupName: string) => void;
  onAddItemToGroup: (groupName: string) => void;
  onEditItem: (item: CompanyMenuItem) => void;
  onDeleteItem: (item: CompanyMenuItem) => void;
}

const MenuDetails: React.FC<MenuDetailsProps> = ({
  groupedItems,
  loading,
  canManageMenus,
  onCreateGroup,
  onBulkAdd,
  onPreview,
  onEditGroup,
  onDeleteGroup,
  onAddItemToGroup,
  onEditItem,
  onDeleteItem
}) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ flex: 1, minWidth: 0 }}>
      {/* Action Buttons */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent={{ xs: 'flex-end' }}
        spacing={1}
        sx={{ width: { xs: '100%', sm: 'auto' }, mb: 2 }}
      >
        <Button
          variant="contained"
          disabled={loading || !canManageMenus}
          startIcon={<AddIcon />}
          onClick={onCreateGroup}
          size="small"
        >
          {t('group.create')}
        </Button>

        <Tooltip
          title={
            groupedItems.length === 0
              ? t('menu.bulk.add.no.groups.tooltip')
              : ''
          }
        >
          <span>
            <Button
              variant="outlined"
              disabled={loading || !canManageMenus || groupedItems.length === 0}
              onClick={onBulkAdd}
              size="small"
            >
              {t('menu.bulk.add')}
            </Button>
          </span>
        </Tooltip>

        <Button
          variant="text"
          disabled={loading}
          onClick={onPreview}
          size="small"
        >
          {t('menu.preview')}
        </Button>
      </Stack>

      {/* Groups List */}
      <List sx={{ maxHeight: 520, overflow: 'auto' }}>
        {groupedItems.map((group) => (
          <Box key={group.groupName} sx={{ mb: 3 }}>
            {/* Group Header */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: 1,
                px: 1,
                py: 1.5,
                mb: 1,
                borderBottom: '2px solid',
                borderColor: 'primary.main'
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                  minWidth: 0
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  color="primary.main"
                  sx={{ minWidth: 0 }}
                >
                  {group.groupName}
                </Typography>

                <Chip
                  size="small"
                  label={`#${group.sortOrder}`}
                  variant="outlined"
                  sx={{
                    minWidth: 'auto',
                    height: 20,
                    '& .MuiChip-label': {
                      px: 1,
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }
                  }}
                  color="primary"
                />

                {canManageMenus && (
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      onClick={() => onEditGroup(group)}
                      title={t('group.edit')}
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onDeleteGroup(group.groupName)}
                      title={t('group.delete')}
                      color="error"
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => onAddItemToGroup(group.groupName)}
                      title={t('group.add.item')}
                      color="primary"
                    >
                      <AddIcon fontSize="inherit" />
                    </IconButton>
                  </Stack>
                )}
              </Box>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                sx={{ minWidth: 0 }}
              >
                <Chip
                  size="small"
                  label={t(prepareSelectionTypeLabel(group.selectionType))}
                  color={getSelectionTypeColor(group.selectionType)}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    whiteSpace: { xs: 'normal', sm: 'nowrap' },
                    textAlign: { xs: 'left', sm: 'right' }
                  }}
                >
                  {group.selectionType === 'SELECTABLE' &&
                    `${group.minSelection}-${group.maxSelection} ${t('selections')}`}
                </Typography>
              </Stack>
            </Box>

            {/* Group Items */}
            {group.items.map((menuItem) => (
              <ListItem
                key={menuItem.id}
                sx={{
                  borderRadius: 1,
                  ml: { xs: 0, sm: 1 },
                  mr: { xs: 0, sm: 1 },
                  backgroundColor: 'background.paper',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  mb: 1,
                  overflow: 'hidden'
                }}
                secondaryAction={
                  canManageMenus && (
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        aria-label={t('edit')}
                        onClick={() => onEditItem(menuItem)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={t('delete')}
                        onClick={() => onDeleteItem(menuItem)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar src={menuItem.item?.file?.url}>
                    {menuItem.item?.name?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{
                        minWidth: 0,
                        flexWrap: { xs: 'wrap', sm: 'nowrap' }
                      }}
                    >
                      <Typography
                        variant="body1"
                        noWrap
                        sx={{
                          minWidth: 0,
                          maxWidth: { xs: '200px', sm: 'none' }
                        }}
                      >
                        {menuItem.item?.name ?? ''}
                      </Typography>
                      {menuItem.isDefault && (
                        <Chip
                          size="small"
                          color="primary"
                          label={t('menu.default')}
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 0.5, sm: 1 },
                        alignItems: { xs: 'flex-start', sm: 'center' }
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {t('extra.price')}: {menuItem.extraPrice}₺
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('sort.order')}: {menuItem.sortOrder}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </Box>
        ))}
      </List>
    </Box>
  );
};

export default MenuDetails;
