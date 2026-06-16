import { ReactElement } from 'react';
import Label from '@/components/Label';
import { useTranslation } from 'react-i18next';

interface TypeMap {
  [key: string]: {
    text: string;
    color:
      | 'black'
      | 'primary'
      | 'secondary'
      | 'error'
      | 'warning'
      | 'success'
      | 'info';
  };
}

interface ProductTypeLabelProps {
  isMenu: boolean;
  customMap?: TypeMap;
}

const ProductTypeLabel = ({
  isMenu,
  customMap
}: ProductTypeLabelProps): ReactElement => {
  const { t } = useTranslation();

  const defaultTypeMap: TypeMap = {
    menu: {
      text: t('menu'),
      color: 'primary'
    },
    product: {
      text: t('product'),
      color: 'secondary'
    }
  };

  const map = customMap || defaultTypeMap;
  const typeKey = isMenu ? 'menu' : 'product';
  const typeConfig = map[typeKey] || {
    text: typeKey,
    color: 'secondary'
  };

  return <Label color={typeConfig.color}>{typeConfig.text}</Label>;
};

export default ProductTypeLabel;
