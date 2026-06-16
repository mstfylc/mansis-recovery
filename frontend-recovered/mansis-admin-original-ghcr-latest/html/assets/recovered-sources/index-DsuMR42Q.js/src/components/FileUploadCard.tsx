import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  styled,
  Stack,
  Grid,
  IconButton
} from '@mui/material';
import { UploadFileTwoTone, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
});

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FileUploadCard({
  onFileSelect,
  imageUrl,
  accept = 'image/*',
  helperText
}: {
  onFileSelect?: (file: File) => void;
  imageUrl?: string | null;
  accept?: string;
  helperText?: string;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (imageUrl) {
      setPreviewUrl(imageUrl);
    }
  }, [imageUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);
    const reader = new FileReader();

    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
      setLoading(false);
    };

    reader.readAsDataURL(file);
    onFileSelect?.(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  const { t } = useTranslation();

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={selectedFile || imageUrl ? 4 : 12}>
            <Button
              component="label"
              variant="contained"
              fullWidth
              startIcon={<UploadFileTwoTone />}
            >
              {selectedFile || imageUrl ? t('change.image') : t('upload.image')}
              <VisuallyHiddenInput
                type="file"
                accept={accept}
                onChange={handleFileChange}
              />
            </Button>
            <Typography color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              {helperText || t('file.upload.restrictions')}
            </Typography>
          </Grid>

          {(selectedFile || previewUrl) && (
            <Grid item xs={12} sm={8}>
              <Stack direction="row" spacing={2} alignItems="center">
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  previewUrl && (
                    <Box
                      sx={{
                        width: 80,
                        height: 60,
                        borderRadius: 1,
                        overflow: 'hidden',
                        '&:hover': {
                          boxShadow: 2,
                          transform: 'scale(1.02)',
                          transition: 'all 0.2s ease-in-out'
                        }
                      }}
                    >
                      <img
                        src={previewUrl}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                  )
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {selectedFile ? (
                    <>
                      <Typography variant="body2" noWrap>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(selectedFile.size)}
                      </Typography>
                    </>
                  ) : (
                    previewUrl && (
                      <Typography variant="body2">
                        {t('current.image')}
                      </Typography>
                    )
                  )}
                </Box>
                <IconButton
                  size="small"
                  onClick={handleRemove}
                  sx={{ color: 'text.secondary' }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Stack>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}
