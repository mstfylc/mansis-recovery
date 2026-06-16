import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  alpha,
  styled,
  Skeleton,
  Chip,
  SvgIcon
} from '@mui/material';
import {
  DownloadTwoTone,
  PrintTwoTone,
  TouchAppTwoTone,
  LockTwoTone,
  NewReleasesTwoTone
} from '@mui/icons-material';
import { desktopReleaseService } from '@/data/desktopReleaseService';
import { formatDateToDayMonthYear } from '@/utils/dateFormatters';
import PageTitleWrapper from '@/components/PageTitleWrapper';

/* ─── Platform SVG Icons ─── */

const WindowsIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M3 12V6.75l6-1V12H3zm7-6.5L22 3v9h-12V5.5zM22 12.5V21l-12-1.5V12.5H22zM9 12.5V19l-6-.75V12.5H9z" />
  </SvgIcon>
);

const AppleIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </SvgIcon>
);

const LinuxIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.868.07 1.723-.514 2.035-.65.28-.118.972-.171 1.71-.241.368-.035.75-.07 1.15-.137.145-.024.298-.065.45-.108.741 1.26 1.303 1.867 1.726 1.867.469 0 .382-.515.058-1.185-.137-.285-.296-.544-.422-.762a42.316 42.316 0 00-.108-.196c.061-.109.113-.213.153-.32.199-.553-.015-1.065-.158-1.402-.332-.8-.768-1.167-1.486-1.6-.465-.264-.924-.525-1.206-1.148a2.27 2.27 0 01-.164-.673c.012-.048.023-.096.033-.145.244-1.204-.07-2.398-.39-3.388-.322-.99-.678-1.834-.89-2.607-.354-1.307-.26-2.415.025-3.593.221-.896.565-1.722.844-2.696.255-.789.447-2.248-.097-3.788-.544-1.524-1.932-2.159-3.237-2.391a7.72 7.72 0 00-1.377-.123z" />
  </SvgIcon>
);

/* ─── Styled Components ─── */

const HeroCard = styled(Card)(
  ({ theme }) => `
    background: linear-gradient(135deg, ${theme.colors.primary.main} 0%, ${alpha(theme.colors.primary.dark, 0.85)} 100%);
    border-radius: ${theme.general.borderRadiusXl};
    color: ${theme.palette.primary.contrastText};
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -20%;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: ${alpha('#fff', 0.05)};
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -30%;
      left: -10%;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: ${alpha('#fff', 0.03)};
    }
  `
);

const PlatformCard = styled(Card)<{ accentColor?: string }>(
  ({ theme, accentColor = theme.colors.primary.main }) => `
    border-radius: ${theme.general.borderRadiusLg};
    border: 1px solid ${theme.colors.alpha.black[10]};
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    height: 100%;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: ${accentColor};
    }

    &:hover {
      border-color: ${accentColor};
      box-shadow: 0 12px 28px ${alpha(accentColor, 0.2)};
      transform: translateY(-6px);
    }
  `
);

const FeatureCard = styled(Box)(
  ({ theme }) => `
    display: flex;
    align-items: flex-start;
    gap: ${theme.spacing(1.5)};
    padding: ${theme.spacing(1)};
    border-radius: ${theme.general.borderRadius};
    transition: background 0.2s ease;

    &:hover {
      background: ${alpha(theme.colors.primary.main, 0.04)};
    }
  `
);

const PlatformDownloadButton = styled(Button)<{ accentColor?: string }>(
  ({ theme, accentColor = theme.colors.primary.main }) => `
    background: ${accentColor};
    color: #fff;
    padding: ${theme.spacing(1.5, 3)};
    font-weight: 600;
    border-radius: ${theme.general.borderRadius};
    text-transform: none;
    font-size: ${theme.typography.pxToRem(14)};
    box-shadow: 0 4px 12px ${alpha(accentColor, 0.35)};
    transition: all 0.25s ease;
    width: 100%;

    &:hover {
      background: ${accentColor};
      filter: brightness(1.1);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px ${alpha(accentColor, 0.45)};
    }

    &.Mui-disabled {
      background: ${alpha(accentColor, 0.3)};
      color: ${alpha('#fff', 0.6)};
    }
  `
);

/* ─── Constants ─── */

const PLATFORMS = {
  windows: {
    name: 'Windows',
    icon: WindowsIcon,
    color: '#0078D4',
    fileType: '.exe',
    requirement: 'Windows 10/11 (64-bit)'
  },
  mac: {
    name: 'macOS',
    icon: AppleIcon,
    color: '#555555',
    fileType: '.dmg',
    requirement: 'macOS 10.13+ (Intel & Apple Silicon)'
  },
  linux: {
    name: 'Linux',
    icon: LinuxIcon,
    color: '#E95420',
    fileType: '.deb / .AppImage',
    requirement: 'Ubuntu 20.04+, Debian 11+ (64-bit)'
  }
} as const;

type PlatformKey = keyof typeof PLATFORMS;

const FEATURES = [
  {
    icon: <PrintTwoTone color="primary" />,
    title: 'Otomatik Yazdırma',
    description: 'Siparişler anında termal yazıcıya gönderilir'
  },
  {
    icon: <TouchAppTwoTone color="primary" />,
    title: 'Kolay Kurulum',
    description: 'Dakikalar içinde kurulup çalışmaya başlayın'
  },
  {
    icon: <LockTwoTone color="primary" />,
    title: 'Güvenli Bağlantı',
    description: 'Şifreli iletişim ile veri güvenliği'
  }
];

/* ─── Types ─── */

interface DesktopRelease {
  id: number;
  version: string;
  windowsUrl?: string;
  macUrl?: string;
  linuxUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Component ─── */

function DesktopApp() {
  const [release, setRelease] = useState<DesktopRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestRelease();
  }, []);

  const fetchLatestRelease = async () => {
    try {
      setLoading(true);
      const result = await desktopReleaseService.getRelease();
      setRelease(result);
    } catch {
      // Release not available yet — cards will show "Yakında"
    } finally {
      setLoading(false);
    }
  };

  const getDownloadUrl = (platform: PlatformKey): string | undefined => {
    if (!release) return undefined;
    const urlMap: Record<PlatformKey, string | undefined> = {
      windows: release.windowsUrl,
      mac: release.macUrl,
      linux: release.linuxUrl
    };
    return urlMap[platform];
  };

  const handleDownload = (platform: PlatformKey) => {
    const url = getDownloadUrl(platform);
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <Helmet>
        <title>Posanto Desktop - İndir</title>
      </Helmet>
      <PageTitleWrapper>
        <Typography variant="h3" component="h3" gutterBottom>
          Masaüstü Uygulaması
        </Typography>
        <Typography variant="subtitle2">
          Posanto Desktop uygulamasını platformunuza uygun sürümüyle indirin
        </Typography>
      </PageTitleWrapper>
      <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Grid container spacing={3}>
          {/* ─── Hero Section ─── */}
          <Grid item xs={12}>
            <HeroCard>
              <CardContent
                sx={{
                  p: { xs: 2.5, md: 3.5 },
                  position: 'relative',
                  zIndex: 1
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}
                  >
                    Posanto Desktop
                  </Typography>
                  {!loading && release && (
                    <Chip
                      icon={<NewReleasesTwoTone sx={{ fontSize: 14 }} />}
                      label={release.version}
                      size="small"
                      sx={{
                        bgcolor: alpha('#fff', 0.2),
                        color: '#fff',
                        fontWeight: 600,
                        '& .MuiChip-icon': { color: '#fff' }
                      }}
                    />
                  )}
                </Box>
                <Typography
                  variant="subtitle1"
                  sx={{ opacity: 0.9, fontWeight: 400, mb: 0.5 }}
                >
                  Yazdırma, sipariş takibi ve şube yönetimi için masaüstü
                  uygulaması
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Windows, macOS ve Linux&apos;ta çalışır
                  {!loading && release && (
                    <>
                      {' • Son güncelleme: '}
                      {formatDateToDayMonthYear(release.updatedAt)}
                    </>
                  )}
                </Typography>
              </CardContent>
            </HeroCard>
          </Grid>

          {/* ─── Platform Download Cards ─── */}
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Card sx={{ p: 3, height: '100%' }}>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Skeleton width="60%" sx={{ mt: 2 }} />
                    <Skeleton width="40%" />
                    <Skeleton
                      variant="rectangular"
                      height={42}
                      sx={{ mt: 3, borderRadius: 1 }}
                    />
                  </Card>
                </Grid>
              ))}
            </>
          ) : (
            (Object.keys(PLATFORMS) as PlatformKey[]).map((key) => {
              const platform = PLATFORMS[key];
              const url = getDownloadUrl(key);
              const PlatformIcon = platform.icon;

              return (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <PlatformCard accentColor={platform.color}>
                    <CardContent sx={{ p: 2.5, pt: 3 }}>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            bgcolor: () => alpha(platform.color, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <PlatformIcon
                            sx={{ fontSize: 28, color: platform.color }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {platform.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {platform.fileType}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 36 }}
                      >
                        {platform.requirement}
                      </Typography>

                      <PlatformDownloadButton
                        accentColor={platform.color}
                        variant="contained"
                        startIcon={<DownloadTwoTone />}
                        onClick={() => handleDownload(key)}
                        disabled={!url}
                      >
                        {url ? 'İndir' : 'Yakında'}
                      </PlatformDownloadButton>
                    </CardContent>
                  </PlatformCard>
                </Grid>
              );
            })
          )}

          {/* ─── Features Section ─── */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                  Özellikler
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Posanto Desktop ile şubenizin yazdırma ve sipariş süreçlerini
                  kolayca yönetin
                </Typography>
                <Grid container spacing={1}>
                  {FEATURES.map((feature, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <FeatureCard>
                        {feature.icon}
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {feature.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textTransform: 'none' }}
                          >
                            {feature.description}
                          </Typography>
                        </Box>
                      </FeatureCard>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* ─── Sidebar ─── */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Sistem Gereksinimleri
                </Typography>
                <Box sx={{ '& > *:not(:last-child)': { mb: 1 } }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'none' }}
                    >
                      İşletim Sistemi
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ textAlign: 'right', textTransform: 'none' }}
                    >
                      Win 10+, macOS 10.13+, Ubuntu 20.04+
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'none' }}
                    >
                      RAM / Disk
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ textTransform: 'none' }}
                    >
                      4 GB / 200 MB
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                  Kurulum Adımları
                </Typography>
                <Box sx={{ '& > *:not(:last-child)': { mb: 1 } }}>
                  {[
                    'Platformunuza uygun kurulum dosyasını indirin',
                    'İndirilen dosyayı çalıştırın',
                    'Kurulum adımlarını takip edin',
                    'Uygulamayı açın ve şube bilgilerinizle giriş yapın',
                    'Yazıcı ayarlarını yapılandırın'
                  ].map((step, i) => (
                    <Box
                      key={i}
                      display="flex"
                      gap={1.5}
                      alignItems="flex-start"
                    >
                      <Box
                        sx={{
                          minWidth: 22,
                          height: 22,
                          borderRadius: '50%',
                          bgcolor: (theme) =>
                            alpha(theme.colors.primary.main, 0.1),
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 11
                        }}
                      >
                        {i + 1}
                      </Box>
                      <Typography variant="body2" sx={{ pt: 0.15 }}>
                        {step}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default DesktopApp;
