import React from 'react';
import { Modal, Backdrop, Fade, Box, IconButton, styled } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

const ModalContent = styled(Box)(
  ({ theme }) => `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: ${theme.colors.alpha.white[100]};
    padding: ${theme.spacing(1)};
    border-radius: ${theme.general.borderRadius};
    box-shadow: ${theme.shadows[24]};
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
`
);

const ImageContainer = styled(Box)(
  () => `
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
`
);

const PreviewImage = styled('img')(
  () => `
    max-width: 100%;
    max-height: calc(90vh - 48px);
    object-fit: contain;
`
);

const CloseButton = styled(IconButton)(
  ({ theme }) => `
    position: absolute;
    top: ${theme.spacing(1)};
    right: ${theme.spacing(1)};
    color: ${theme.colors.alpha.black[100]};
    background-color: ${theme.colors.alpha.white[70]};
    z-index: 10;
    
    &:hover {
      background-color: ${theme.colors.alpha.white[100]};
    }
`
);

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  open,
  onClose,
  imageUrl,
  alt = 'Image preview'
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500
      }}
    >
      <Fade in={open}>
        <ModalContent>
          <CloseButton onClick={onClose} size="small">
            <CloseIcon />
          </CloseButton>
          <ImageContainer>
            <PreviewImage src={imageUrl} alt={alt} />
          </ImageContainer>
        </ModalContent>
      </Fade>
    </Modal>
  );
};

export default ImagePreviewModal;
