import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { CompanyProduct } from '@/types/CompanyProduct.interface';

interface MenuListProps {
  menus: CompanyProduct[];
  selectedMenu: CompanyProduct | null;
  onSelectMenu: (menu: CompanyProduct) => void;
  onNavigateToDetail: (menu: CompanyProduct) => void;
  loading: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onLoadMore: () => void;
  onCreateMenu: () => void;
  canManageMenus: boolean;
}

const MenuList: React.FC<MenuListProps> = ({
  menus,
  selectedMenu,
  onSelectMenu,
  onNavigateToDetail,
  loading,
  searchInput,
  onSearchChange,
  onLoadMore,
  onCreateMenu,
  canManageMenus
}) => {
  const { t } = useTranslation();

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const element = e.target as HTMLElement;
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 5) {
      onLoadMore();
    }
  };

  return (
    <Box sx={{ width: { xs: '100%', lg: 450 }, flexShrink: 0 }}>
      {/* Create New Menu Button */}
      <Button
        fullWidth
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onCreateMenu}
        disabled={loading || !canManageMenus}
        sx={{ mb: 2 }}
      >
        {t('menu.create.new')}
      </Button>

      {/* Menu Search Bar */}
      <TextField
        fullWidth
        size="small"
        placeholder={t('search')}
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          )
        }}
        sx={{ mb: 2 }}
      />

      {/* Menu List */}
      <List
        sx={{
          maxHeight: 480,
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px'
          }
        }}
        onScroll={handleScroll}
      >
        {menus.map((menu) => (
          <ListItem key={menu.id} disablePadding>
            <ListItemButton
              selected={selectedMenu?.id === menu.id}
              onClick={() => onSelectMenu(menu)}
              sx={{ borderRadius: 1 }}
              onDoubleClick={() => onNavigateToDetail(menu)}
            >
              <ListItemAvatar>
                <Avatar src={menu.file?.url}>{menu.name[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={menu.name}
                secondary={
                  menu.description || `${t('price')}: ${menu.basePrice}`
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
        {loading && (
          <ListItem>
            <Box display="flex" justifyContent="center" width="100%">
              <CircularProgress size={24} />
            </Box>
          </ListItem>
        )}
      </List>
    </Box>
  );
};

export default MenuList;
