import { Typography, IconButton, Tooltip, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import { Link } from 'react-router-dom';
import { User } from '@/types/User.interface';

interface PageHeaderProps {
  user: User;
}

const PageHeader = ({ user }: PageHeaderProps) => {
  const { t } = useTranslation();

  return (
    <Box display="flex" alignItems="center">
      <Tooltip arrow placement="top" title={t('back.to.users')}>
        <IconButton
          component={Link}
          to="/management/users"
          color="primary"
          sx={{ p: 1, mr: 2 }}
        >
          <ArrowBackTwoToneIcon />
        </IconButton>
      </Tooltip>
      <Box>
        <Typography variant="h3" component="h3" gutterBottom>
          {user.name} {user.surname}
        </Typography>
        <Typography variant="subtitle2">
          {t('user.details.description')}
        </Typography>
      </Box>
    </Box>
  );
};

export default PageHeader;
