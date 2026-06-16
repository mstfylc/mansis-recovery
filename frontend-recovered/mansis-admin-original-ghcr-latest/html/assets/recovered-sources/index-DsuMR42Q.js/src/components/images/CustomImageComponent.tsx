import React from 'react';
import { Box, useTheme } from '@mui/material';

interface CustomImageComponentProps {
  imageUrl: string;
  alt: string;
  onClick?: (imageUrl: string) => void;
  width?: number | string;
  height?: number | string;
}

const CustomImageComponent: React.FC<CustomImageComponentProps> = ({
  imageUrl,
  alt,
  onClick,
  width = 54,
  height = 54
}) => {
  const theme = useTheme();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(imageUrl);
    }
  };

  return (
    <Box
      sx={{
        width,
        height,
        margin: '0 auto',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: theme.colors.alpha.black[10],
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
      }}
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt={alt}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.style.display = 'none';
          e.currentTarget.style.cursor = 'default';

          // Add error message element to parent box
          const errorMsg = document.createElement('div');
          errorMsg.innerText = '!';
          errorMsg.style.color = theme.colors.error.main;
          errorMsg.style.fontSize = '14px';
          errorMsg.style.fontWeight = 'bold';
          e.currentTarget.parentElement?.appendChild(errorMsg);
        }}
      />
    </Box>
  );
};

export default CustomImageComponent;
