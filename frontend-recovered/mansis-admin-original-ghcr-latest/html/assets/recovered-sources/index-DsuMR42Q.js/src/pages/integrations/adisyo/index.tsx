import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Tabs, Tab, Paper, Button, Grid } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';
import PageHeader from './components/PageHeader';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import BranchIntegrationsTab from './components/BranchIntegrationsTab';
import ProductImportDialog from './components/ProductImportDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`adisyo-tabpanel-${index}`}
      aria-labelledby={`adisyo-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `adisyo-tab-${index}`,
    'aria-controls': `adisyo-tabpanel-${index}`
  };
}

const AdisyoIntegration: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenImportDialog = () => {
    setImportDialogOpen(true);
  };

  const handleCloseImportDialog = () => {
    setImportDialogOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageTitleWrapper>
        <PageHeader showBackButton={false} />
      </PageTitleWrapper>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2, mx: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="adisyo integration tabs"
          className="adisyo-tabs"
        >
          <Tab label={t('integrations.adisyo.overview')} {...a11yProps(0)} />
          <Tab
            label={t('integrations.adisyo.branch.integrations')}
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                backgroundColor: (theme) => theme.palette.background.default
              }}
              className="adisyo-overview-card"
            >
              <Typography variant="h6" gutterBottom>
                {t('integrations.adisyo.branch.integrations')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t('integrations.adisyo.configure.branches')}
              </Typography>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon />}
                  fullWidth
                  color="primary"
                  onClick={() => setTabValue(1)}
                  className="adisyo-branch-integration-button"
                >
                  {t('integrations.adisyo.configure.integration')}
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                backgroundColor: (theme) => theme.palette.background.default
              }}
              className="adisyo-overview-card"
            >
              <Typography variant="h6" gutterBottom>
                {t('integrations.adisyo.product.mappings')}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {t('integrations.adisyo.import.products')}
              </Typography>
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SystemUpdateAltIcon />}
                  fullWidth
                  color="primary"
                  onClick={handleOpenImportDialog}
                >
                  {t('integrations.adisyo.import.products.button')}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <BranchIntegrationsTab />
      </TabPanel>

      {/* Product Import Dialog */}
      <ProductImportDialog
        open={importDialogOpen}
        onClose={handleCloseImportDialog}
      />
    </Box>
  );
};

export default AdisyoIntegration;
