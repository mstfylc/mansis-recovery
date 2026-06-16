import React from 'react';
import { Box } from '@mui/material';
import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import CustomImageComponent from './CustomImageComponent';
import ImagePlaceholder from './ImagePlaceholder';
import { alpha } from '@mui/material/styles';

interface EditableImageCellProps {
  isEditing: boolean;
  imageUrl?: string | null;
  previewImageUrl?: string | null;
  entityName: string;
  onImageEditClick: () => void;
  onImageClick?: (imageUrl: string) => void;
}

const EditableImageCell: React.FC<EditableImageCellProps> = ({
  isEditing,
  imageUrl,
  previewImageUrl,
  entityName,
  onImageEditClick,
  onImageClick
}) => {
  if (isEditing) {
    return (
      <Box sx={{ position: 'relative' }}>
        {previewImageUrl ? (
          <>
            <Box
              sx={{
                width: 54,
                height: 54,
                margin: '0 auto',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <img
                src={previewImageUrl}
                alt={entityName}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
            <EditOverlay onEditClick={onImageEditClick} />
          </>
        ) : imageUrl ? (
          <>
            <CustomImageComponent
              imageUrl={imageUrl}
              alt={entityName}
              onClick={() => {}}
            />
            <EditOverlay onEditClick={onImageEditClick} />
          </>
        ) : (
          <Box sx={{ position: 'relative' }}>
            <ImagePlaceholder />
            <EditOverlay onEditClick={onImageEditClick} />
          </Box>
        )}
      </Box>
    );
  }

  // Non-editing mode
  return imageUrl ? (
    <CustomImageComponent
      imageUrl={imageUrl}
      alt={entityName}
      onClick={onImageClick ? () => onImageClick(imageUrl) : undefined}
    />
  ) : (
    <ImagePlaceholder />
  );
};

interface EditOverlayProps {
  onEditClick: () => void;
}

const EditOverlay: React.FC<EditOverlayProps> = ({ onEditClick }) => {
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick();
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
      onClick={handleEditClick}
    >
      <Box
        sx={{
          borderRadius: '50%',
          background: (theme) => alpha(theme.palette.background.paper, 0.9),
          boxShadow: '0px 0px 5px rgba(0,0,0,0.2)',
          padding: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <EditTwoToneIcon
          sx={{
            color: (theme) => theme.palette.primary.main,
            fontSize: 20,
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s'
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default EditableImageCell;
