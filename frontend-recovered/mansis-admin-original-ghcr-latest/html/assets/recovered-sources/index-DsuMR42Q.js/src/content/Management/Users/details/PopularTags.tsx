import {
  Typography,
  Card,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListSubheader,
  ListItemText,
  Avatar,
  useTheme,
  styled
} from '@mui/material';

const ListWrapper = styled(List)(
  () => `
      .MuiListItem-root {
        border-radius: 0;
        margin: 0;
      }
`
);

function PopularTags() {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Popular Tags" />
      <Divider />
      <ListWrapper disablePadding>
        <ListItem
          sx={{
            color: `${theme.colors.primary.main}`,
            '&:hover': { color: `${theme.colors.primary.dark}` }
          }}
        >
          <ListItemText primary="#HTML" />
        </ListItem>
        <Divider />
        <ListItem
          sx={{
            color: `${theme.colors.primary.main}`,
            '&:hover': { color: `${theme.colors.primary.dark}` }
          }}
        >
          <ListItemText primary="#software_development" />
        </ListItem>
        <Divider />
        <ListItem
          sx={{
            color: `${theme.colors.primary.main}`,
            '&:hover': { color: `${theme.colors.primary.dark}` }
          }}
        >
          <ListItemText primary="#TrendingInfuencers" />
        </ListItem>
        <Divider />
        <ListItem
          sx={{
            color: `${theme.colors.primary.main}`,
            '&:hover': { color: `${theme.colors.primary.dark}` }
          }}
        >
          <ListItemText primary="#investorsWatch2022" />
        </ListItem>
        <Divider />
        <ListSubheader>
          <Typography sx={{ py: 1.5 }} variant="h4" color="text.primary">
            Groups
          </Typography>
        </ListSubheader>

        <Divider />
        <ListItem>
          <ListItemAvatar>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                background: `${theme.colors.alpha.black[100]}`,
                color: `${theme.colors.alpha.white[100]}`
              }}
            >
              D
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            slotProps={{
              primary: {
                variant: 'h5',
                color: `${theme.colors.alpha.black[100]}`
              }
            }}
            primary="Writer’s Digest Daily"
          />
        </ListItem>
        <Divider />
        <ListItem>
          <ListItemAvatar>
            <Avatar
              sx={{ width: 38, height: 38 }}
              src="/static/images/logo/google.svg"
            />
          </ListItemAvatar>
          <ListItemText
            slotProps={{
              primary: {
                variant: 'h5',
                color: `${theme.colors.alpha.black[100]}`
              }
            }}
            primary="Google Developers"
          />
        </ListItem>
      </ListWrapper>
    </Card>
  );
}

export default PopularTags;
