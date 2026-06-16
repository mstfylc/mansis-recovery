import { Box, BoxProps, Tab, Tabs, styled } from '@mui/material';
import { ChangeEvent, ReactNode } from 'react';

export interface TabPanelProps extends BoxProps {
  children?: ReactNode;
  index: number;
  value: number;
}

export const TabsContainerWrapper = styled(Box)(
  ({ theme }) => `
    padding: 0 ${theme.spacing(2)};
    position: relative;

    .MuiTabs-root {
      min-height: 44px;
    }

    .MuiTabs-indicator {
      height: 2px;
      background-color: ${theme.palette.primary.main};
      border-radius: 2px;
    }

    .MuiTab-root {
      &.MuiButtonBase-root {
        text-transform: none;
        min-height: 44px;
        font-size: ${theme.typography.pxToRem(14)};
        font-weight: 500;
        color: ${theme.palette.text.secondary};
        padding: 0 ${theme.spacing(2)};
        border-radius: 0;
        transition: color 0.2s ease;

        &:hover {
          color: ${theme.palette.text.primary};
        }
      }

      &.Mui-selected {
        color: ${theme.palette.text.primary};
        font-weight: 600;
      }
    }
  `
);

export interface TabItem {
  value: string | number;
  label: string;
}

export interface CustomTabsProps {
  tabs: TabItem[];
  currentTab: string | number;
  onChange: (event: ChangeEvent<object>, value: string | number) => void;
  variant?: 'scrollable' | 'standard' | 'fullWidth';
  scrollButtons?: 'auto' | true | false;
}

export const CustomTabs = ({
  tabs,
  currentTab,
  onChange,
  variant = 'scrollable',
  scrollButtons = 'auto'
}: CustomTabsProps) => {
  return (
    <TabsContainerWrapper>
      <Tabs
        onChange={onChange}
        value={currentTab}
        variant={variant}
        scrollButtons={scrollButtons}
        textColor="primary"
        indicatorColor="primary"
      >
        {tabs.map((tab) => (
          <Tab key={tab.value} label={tab.label} value={tab.value} />
        ))}
      </Tabs>
    </TabsContainerWrapper>
  );
};

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </Box>
  );
};

export default TabPanel;
