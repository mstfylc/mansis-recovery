import React, { useState, useRef } from 'react';
import {
  Box,
  Menu,
  IconButton,
  Button,
  ListItemText,
  ListItem,
  List,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText
} from '@mui/material';
import MoreVertTwoToneIcon from '@mui/icons-material/MoreVertTwoTone';
import { useTranslation } from 'react-i18next';

export interface BulkActionButtonConfig {
  label: string;
  icon: React.ReactElement;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  onClick: (items: any[]) => Promise<void>;
  showCondition?: boolean;
  loadingState?: boolean;
  disabled?: boolean;
  position?: 'left' | 'right';
  showConfirmDialog?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  variant?: 'text' | 'outlined' | 'contained';
}

interface BulkActionsProps<T> {
  selected: T[];
  additionalActions?: {
    label: string;
    onClick: (items: T[]) => void;
  }[];
  buttons?: BulkActionButtonConfig[];
}

function BulkActions<T>({
  selected,
  additionalActions = [],
  buttons = []
}: BulkActionsProps<T>) {
  const { t } = useTranslation();
  const [onMenuOpen, menuOpen] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeConfirmButton, setActiveConfirmButton] =
    useState<BulkActionButtonConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const moreRef = useRef<HTMLButtonElement | null>(null);

  const handleButtonClick = async (buttonConfig: BulkActionButtonConfig) => {
    if (buttonConfig.showConfirmDialog) {
      setActiveConfirmButton(buttonConfig);
      setConfirmOpen(true);
    } else {
      try {
        setIsProcessing(true);
        await buttonConfig.onClick(selected);
      } catch (error) {
        console.error(`Error executing action: ${buttonConfig.label}`, error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmAction = async () => {
    if (!activeConfirmButton) return;

    try {
      setIsProcessing(true);
      await activeConfirmButton.onClick(selected);
      setConfirmOpen(false);
    } catch (error) {
      console.error(
        `Error executing action: ${activeConfirmButton.label}`,
        error
      );
    } finally {
      setIsProcessing(false);
      setActiveConfirmButton(null);
    }
  };

  const renderButton = (buttonConfig: BulkActionButtonConfig) => {
    if (buttonConfig.showCondition === false) return null;

    const isLoading =
      isProcessing && activeConfirmButton?.label === buttonConfig.label;
    const buttonLabel = isLoading
      ? `${t(buttonConfig.label)}...`
      : selected.length > 0
        ? `${t(buttonConfig.label)} (${selected?.length})`
        : `${t(buttonConfig.label)}`;

    return (
      <Button
        sx={{ ml: 1 }}
        startIcon={buttonConfig.icon}
        variant={buttonConfig.variant || 'contained'}
        color={buttonConfig.color || 'primary'}
        onClick={() => handleButtonClick(buttonConfig)}
        disabled={buttonConfig.disabled || isLoading}
      >
        {buttonLabel}
      </Button>
    );
  };

  return (
    <>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <Typography variant="h5" color="text.secondary">
            {`${t('bulk.actions')}: `}
          </Typography>
          {buttons
            .filter(
              (btn) =>
                btn && btn.position === 'left' && btn.showCondition !== false
            )
            .map((buttonConfig, index) => (
              <React.Fragment key={index}>
                {renderButton(buttonConfig)}
              </React.Fragment>
            ))}
        </Box>

        <Box display="flex" alignItems="center">
          {buttons
            .filter(
              (btn) =>
                btn && btn.position !== 'left' && btn.showCondition !== false
            )
            .map((buttonConfig, index) => (
              <React.Fragment key={index}>
                {renderButton(buttonConfig)}
              </React.Fragment>
            ))}

          {additionalActions.length > 0 && (
            <IconButton
              color="primary"
              onClick={() => menuOpen(true)}
              ref={moreRef}
              sx={{ ml: 2, p: 1 }}
            >
              <MoreVertTwoToneIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => !isProcessing && setConfirmOpen(false)}
      >
        <DialogTitle>
          {activeConfirmButton?.confirmTitle || t('confirm.action')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {activeConfirmButton?.confirmMessage ||
              t('confirm.action.question')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setConfirmOpen(false);
              setActiveConfirmButton(null);
            }}
            disabled={isProcessing}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={activeConfirmButton?.color || 'primary'}
            disabled={isProcessing}
            autoFocus
          >
            {isProcessing ? `${t('processing')}...` : t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        keepMounted
        anchorEl={moreRef.current}
        open={onMenuOpen}
        onClose={() => menuOpen(false)}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'center'
        }}
      >
        <List sx={{ p: 1 }} component="nav">
          {additionalActions.map((action, index) => (
            <ListItem
              component="button"
              key={index}
              onClick={() => action.onClick(selected)}
            >
              <ListItemText primary={action.label} />
            </ListItem>
          ))}
        </List>
      </Menu>
    </>
  );
}

export default BulkActions;
