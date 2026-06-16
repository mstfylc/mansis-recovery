import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';

const ApexChart = lazy(() => import('react-apexcharts'));

export const Chart = (props) => {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div>{t('chart.loading')}...</div>}>
      <ApexChart {...props} />
    </Suspense>
  );
};
