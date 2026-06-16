import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import {
  ProductAttribute,
  ProductAttributeOption
} from '@/types/ProductAttribute.interface';

interface AttributeGroupsListProps {
  attributeGroups: ProductAttribute[];
  onAddOption: (attribute: ProductAttribute) => void;
  onEditGroup: (attribute: ProductAttribute) => void;
  onDeleteGroup?: (attribute: ProductAttribute) => void;
  onEditOption: (option: ProductAttributeOption) => void;
  onDeleteAttribute: (option: ProductAttributeOption) => void;
}

const AttributeGroupsList: React.FC<AttributeGroupsListProps> = ({
  attributeGroups,
  onAddOption,
  onEditGroup,
  onDeleteGroup,
  onEditOption,
  onDeleteAttribute
}) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={2}>
      {attributeGroups.map((group) => (
        <Grid item xs={12} md={6} key={group.name}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">{group.name}</Typography>
                  {group.isRequired && (
                    <Chip label={t('required')} size="small" color="primary" />
                  )}
                </Box>
              }
              action={
                <Box display="flex" alignItems="center" gap={1}>
                  <IconButton
                    size="small"
                    onClick={() => onEditGroup(group)}
                    title={t('edit.group')}
                  >
                    <EditIcon />
                  </IconButton>
                  {onDeleteGroup && (
                    <IconButton
                      size="small"
                      onClick={() => onDeleteGroup(group)}
                      title={t('delete.group')}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => onAddOption(group)}
                  >
                    {t('add.option')}
                  </Button>
                </Box>
              }
            />
            <CardContent>
              <List dense>
                {group.options.map((option) => (
                  <React.Fragment key={option.id}>
                    <ListItem>
                      <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>{option.name}</Typography>
                            {option.isDefault && (
                              <Chip
                                label={t('default')}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          option.extraPrice > 0
                            ? `+₺${option.extraPrice.toFixed(2)}`
                            : t('no.extra.price')
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          size="small"
                          onClick={() => onEditOption(option)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteAttribute(option)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default AttributeGroupsList;
