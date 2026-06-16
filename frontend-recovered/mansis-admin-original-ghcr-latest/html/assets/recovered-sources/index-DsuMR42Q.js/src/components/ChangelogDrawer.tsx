import { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Button,
  useTheme,
  alpha,
  CircularProgress
} from '@mui/material';
import type { Palette } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useTranslation } from 'react-i18next';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';
import { useChangelog } from '@/contexts/ChangelogContext';
import { fetchChangelog } from '@/data/changelogService';
import { ChangelogApp, ChangelogCategory } from '@/constants/changelog';
import type {
  ChangelogRelease,
  ChangelogItem,
  ChangelogCategory as ChangelogCategoryType
} from '@/types/ChangelogRelease.interface';

function getCategoryColor(
  category: ChangelogCategoryType,
  palette: Palette
): string {
  switch (category) {
    case ChangelogCategory.FEATURE:
      return palette.primary.main;
    case ChangelogCategory.IMPROVEMENT:
      return palette.info.main;
    case ChangelogCategory.FIX:
      return palette.success.main;
    default:
      return palette.primary.main;
  }
}

function getCategoryLabel(
  category: ChangelogCategoryType,
  t: (key: string) => string
): string {
  switch (category) {
    case ChangelogCategory.FEATURE:
      return t('changelog.category.feature');
    case ChangelogCategory.IMPROVEMENT:
      return t('changelog.category.improvement');
    case ChangelogCategory.FIX:
      return t('changelog.category.fix');
    default:
      return category;
  }
}

function groupItemsByCategory(
  items: ChangelogItem[]
): Map<string, ChangelogItem[]> {
  const map = new Map<string, ChangelogItem[]>();
  for (const item of items) {
    const key = item.category;
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  const order = ['feature', 'improvement', 'fix'];
  const sorted = new Map<string, ChangelogItem[]>();
  for (const key of order) {
    const list = map.get(key);
    if (list) sorted.set(key, list);
  }
  for (const [key, list] of map) {
    if (!sorted.has(key)) sorted.set(key, list);
  }
  return sorted;
}

export default function ChangelogDrawer() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isOpen, closeDrawer, markAllRead } = useChangelog();
  const [releases, setReleases] = useState<ChangelogRelease[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchChangelog(ChangelogApp.ADMIN)
        .then(setReleases)
        .catch(() => setReleases([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleMarkAllRead = () => {
    markAllRead();
    closeDrawer();
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={closeDrawer}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          maxWidth: '100%',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RocketLaunchIcon color="primary" />
          <Typography variant="h6">{t('changelog.title')}</Typography>
        </Box>
        <IconButton onClick={closeDrawer} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : releases.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ textAlign: 'center', py: 4 }}
          >
            {t('changelog.empty')}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {releases.map((release) => {
              const items = release.items;
              const grouped = groupItemsByCategory(items);
              return (
                <Box
                  key={release.id}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      flexWrap: 'wrap'
                    }}
                  >
                    <Chip
                      label={`${t('changelog.version')}: ${release.version}`}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      label={`${t('changelog.date')}: ${formatDateToDayMonthYear(release.date)}`}
                      size="small"
                      variant="outlined"
                      sx={{ color: 'text.secondary' }}
                    />
                  </Box>
                  {Array.from(grouped.entries()).map(
                    ([category, categoryItems]) => (
                      <Box
                        key={category}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Chip
                          label={getCategoryLabel(
                            category as ChangelogCategoryType,
                            t
                          )}
                          size="small"
                          sx={{
                            alignSelf: 'flex-start',
                            backgroundColor: alpha(
                              getCategoryColor(
                                category as ChangelogCategoryType,
                                theme.palette
                              ),
                              0.2
                            ),
                            color: getCategoryColor(
                              category as ChangelogCategoryType,
                              theme.palette
                            ),
                            fontWeight: 600
                          }}
                        />
                        {categoryItems.map((item) => (
                          <Box key={item.id} sx={{ pl: 1 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              sx={{ mb: 0.5 }}
                            >
                              {item.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ lineHeight: 1.5 }}
                            >
                              {item.description}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {!loading && releases.length > 0 && (
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
            flexShrink: 0
          }}
        >
          <Button fullWidth variant="outlined" onClick={handleMarkAllRead}>
            {t('changelog.markAllRead')}
          </Button>
        </Box>
      )}
    </Drawer>
  );
}
