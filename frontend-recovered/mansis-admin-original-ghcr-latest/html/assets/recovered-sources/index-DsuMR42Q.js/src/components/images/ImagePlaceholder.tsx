import React from 'react';
import { Box, useTheme } from '@mui/material';
import PhotoCameraTwoToneIcon from '@mui/icons-material/PhotoCameraTwoTone';

interface ImagePlaceholderProps {
  width?: number | string;
  height?: number | string;
  icon?: React.ReactNode;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  width = 54,
  height = 54,
  icon = <PhotoCameraTwoToneIcon />
}) => {
  const theme = useTheme();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Box
      sx={{
        width,
        height,
        margin: '0 auto',
        borderRadius: '4px',
        bgcolor: theme.colors.alpha.black[10],
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onClick={handleClick}
    >
      {icon}
    </Box>
  );
};

export default ImagePlaceholder;
