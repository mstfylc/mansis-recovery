import { useState, useRef } from 'react';
import { Button, Tooltip } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useTranslation } from 'react-i18next';
import { ProcessEnum } from '@/enums/process';
import { QrData } from '@/types/QrData.interface';
import { qrScannerService } from '@/data/qrScannerService';
import { user$ } from '@/store/userStore';
import { useObservable } from '@legendapp/state/react';
import { formatDateToDayMonthYearTime } from '@/utils/dateFormatters';
import {
  syncServerTime,
  getServerTimeNow,
  QR_VALIDITY_SECONDS
} from '@/utils/serverTime';
import {
  ResultModal,
  DailyLoginModal,
  ExamModal,
  OrderModal,
  BundleModal,
  MembershipModal,
  QrScannerModal
} from './modals';

const QrScannerButton = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [qrData, setQrData] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalProps, setResultModalProps] = useState({
    title: '',
    description: '',
    success: false
  });

  // Confirmation modals for different QR processes
  const [showDailyLoginModal, setShowDailyLoginModal] = useState(false);
  const [dailyLoginModalProps, setDailyLoginModalProps] = useState({
    createdAt: '',
    customerUserId: 0,
    branchId: 0,
    amount: 0,
    onApprove: () => {}
  });

  const [showExamModal, setShowExamModal] = useState(false);
  const [examModalProps, setExamModalProps] = useState({
    title: '',
    amount: 0,
    startDate: '',
    customerUserId: 0,
    childActivityId: 0,
    branchId: 0,
    createdAt: '',
    onApprove: () => {}
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderModalProps, setOrderModalProps] = useState({
    customerUserId: 0,
    amount: 0,
    branchId: 0,
    products: [] as {
      productId: number;
      productName: string;
      quantity: number;
    }[],
    createdAt: '',
    netAmount: 0,
    usedLoginDiscountCount: 0,
    onApprove: () => {}
  });

  const [showBundleModal, setShowBundleModal] = useState(false);
  const [bundleModalProps, setBundleModalProps] = useState({
    title: '',
    amount: 0,
    customerUserId: 0,
    bundleId: 0,
    branchId: 0,
    createdAt: '',
    onApprove: () => {}
  });

  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [membershipModalProps, setMembershipModalProps] = useState({
    customerUserId: 0,
    branchId: 0,
    createdAt: '',
    onApprove: () => {}
  });

  const qrLock = useRef(false);
  const globalUserState = useObservable(user$);

  const handleOpen = () => {
    setOpen(true);
    setQrData('');
    setTimeout(() => {
      const inputElement = document.getElementById('qr-input');
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  const handleClose = () => {
    setOpen(false);
    setQrData('');
    setLoading(false);
  };

  const showResult = (title: string, description: string, success: boolean) => {
    setResultModalProps({
      title,
      description,
      success
    });
    setShowResultModal(true);
  };

  const handleScan = async () => {
    if (!qrData || qrLock.current) return;

    qrLock.current = true;
    setLoading(true);

    try {
      const jsonData = JSON.parse(qrData);
      const parsedQrData = jsonData as QrData;

      // Check QR code validity
      if (parsedQrData.createdAt) {
        // Sunucu zamanını senkronize et (cihaz saat farkını elimine etmek için)
        await syncServerTime();
        const qrCreatedAt = new Date(parsedQrData.createdAt);
        const now = getServerTimeNow();
        const diffInSeconds = (now.getTime() - qrCreatedAt.getTime()) / 1000;

        if (diffInSeconds > QR_VALIDITY_SECONDS) {
          showResult(t('qr.code.error'), t('qr.code.expired'), false);
          setLoading(false);
          handleClose();
          return;
        }
      }

      // Process the QR data based on the process type
      switch (parsedQrData.process) {
        case ProcessEnum.CHECK_IN_DAILY_LOGIN:
          await handleCheckInDailyLogin(parsedQrData);
          break;
        case ProcessEnum.BUY_DAILY_LOGIN:
          await handleBuyDailyLogin(parsedQrData);
          break;
        case ProcessEnum.CHECK_IN_EXAM:
          await handleCheckInExam(parsedQrData);
          break;
        case ProcessEnum.BUY_EXAM:
          await handleBuyExam(parsedQrData);
          break;
        case ProcessEnum.BUY_PRODUCTS:
          await handleBuyProducts(parsedQrData);
          break;
        case ProcessEnum.BUY_BUNDLE:
          await handleBuyBundle(parsedQrData);
          break;
        case ProcessEnum.BUY_MEMBERSHIP:
          await handleBuyMembership(parsedQrData);
          break;
        default:
          showResult(t('qr.code.error'), t('qr.code.invalid.type'), false);
      }

      setLoading(false);
      handleClose();
    } catch (error) {
      console.error('Error processing QR data:', error);
      showResult(t('qr.code.error'), t('qr.code.invalid'), false);
      setLoading(false);
      handleClose();
    }
  };

  const handleCheckInDailyLogin = async (qrData: QrData) => {
    try {
      if (!qrData.branchId) {
        showResult(t('error'), t('branch.id.missing'), false);
        return;
      }

      const isDailyLogin = await qrScannerService.checkInDailyLogin(
        qrData.branchId
      );

      if (isDailyLogin.status === 200) {
        showResult(t('daily.login.exists'), t('user.has.daily.login'), true);
      } else {
        showResult(
          t('daily.login.not.exists'),
          t('user.has.no.daily.login'),
          false
        );
      }
    } catch (error) {
      console.error('Error checking daily login:', error);
      showResult(t('error'), t('error.checking.daily.login'), false);
    }
  };

  const handleBuyDailyLogin = async (qrData: QrData) => {
    try {
      setDailyLoginModalProps({
        createdAt: qrData.createdAt || '',
        customerUserId: qrData.customerUserId,
        branchId: qrData.branchId || 0,
        amount: Number(qrData.amount) || 0,
        onApprove: async () => {
          setShowDailyLoginModal(false);
          setLoading(true);

          try {
            const buyResponse = await qrScannerService.buyDailyLogin({
              customerUserId: qrData.customerUserId,
              employeeId: globalUserState.id.get() as number,
              branchId: qrData.branchId || 0,
              amount: Number(qrData.amount) || 0
            });

            const isSuccess = buyResponse.status === 200;

            showResult(
              isSuccess
                ? t('daily.login.approved')
                : t('daily.login.not.approved'),
              isSuccess
                ? t('daily.login.approved.description')
                : buyResponse.message || '',
              isSuccess
            );
          } catch (error) {
            console.error('Error approving daily login:', error);
            showResult(t('error'), t('error.approving.daily.login'), false);
          } finally {
            setLoading(false);
          }
        }
      });

      setShowDailyLoginModal(true);
    } catch (error) {
      console.error('Error handling buy daily login:', error);
      showResult(t('error'), t('error.handling.daily.login'), false);
    }
  };

  const handleCheckInExam = async (qrData: QrData) => {
    try {
      const apiResponse = await qrScannerService.checkExam({
        userId: qrData.customerUserId,
        activityId: qrData.childActivityId || 0
      });

      if (apiResponse.status !== 200) {
        showResult(t('error'), apiResponse.message || '', false);
        return;
      }

      const ticketData = apiResponse.data as {
        activityTitle: string;
        childActivityTitle: string;
        startDateTime: string;
      };

      showResult(
        ticketData.activityTitle,
        `${t('user.has.ticket')} ${ticketData.childActivityTitle} (${formatDateToDayMonthYearTime(ticketData.startDateTime)})`,
        true
      );
    } catch (error) {
      console.error('Error checking exam ticket:', error);
      showResult(t('error'), t('error.checking.exam.ticket'), false);
    }
  };

  const handleBuyExam = async (qrData: QrData) => {
    try {
      setExamModalProps({
        title: qrData.activityName || '',
        amount: Number(qrData.amount) || 0,
        startDate: qrData.activityStartDate || '',
        customerUserId: qrData.customerUserId,
        childActivityId: qrData.childActivityId || 0,
        branchId: qrData.branchId || 0,
        createdAt: qrData.createdAt || '',
        onApprove: async () => {
          setShowExamModal(false);
          setLoading(true);

          try {
            const apiResponse = await qrScannerService.buyActivityByCash({
              customerUserId: qrData.customerUserId,
              totalPrice: Number(qrData.amount) || 0,
              childActivityId: qrData.childActivityId || 0,
              branchId: qrData.branchId || 0,
              employeeId: globalUserState.id.get() as number
            });

            showResult(
              apiResponse.status === 200
                ? t('exam.purchase.approved')
                : t('exam.purchase.failed'),
              apiResponse.status === 200
                ? t('exam.purchase.approved.description')
                : t('exam.purchase.failed.description'),
              apiResponse.status === 200
            );
          } catch (error) {
            console.error('Error approving exam purchase:', error);
            showResult(t('error'), t('error.approving.exam.purchase'), false);
          } finally {
            setLoading(false);
          }
        }
      });

      setShowExamModal(true);
    } catch (error) {
      console.error('Error handling buy exam:', error);
      showResult(t('error'), t('error.handling.buy.exam'), false);
    }
  };

  const handleBuyProducts = async (qrData: QrData) => {
    try {
      setOrderModalProps({
        customerUserId: qrData.customerUserId,
        amount: Number(qrData.amount) || 0,
        branchId: qrData.branchId || 0,
        products: qrData.orderProducts || [],
        createdAt: qrData.createdAt || '',
        netAmount: Number(qrData.net_amount) || 0,
        usedLoginDiscountCount: qrData.usedLoginDiscountCount || 0,
        onApprove: async () => {
          setShowOrderModal(false);
          setLoading(true);

          try {
            const apiResponse = await qrScannerService.buyCartByCash({
              customerUserId: qrData.customerUserId,
              netTotalPrice: Number(qrData.net_amount) || 0,
              totalPrice: Number(qrData.amount) || 0,
              orderProducts: qrData.orderProducts || [],
              branchId: qrData.branchId || 0,
              employeeId: globalUserState.id.get() as number,
              usedLoginDiscountCount: qrData.usedLoginDiscountCount || 0
            });

            showResult(
              apiResponse.status === 200
                ? t('order.approved')
                : t('order.failed'),
              apiResponse.status === 200
                ? t('order.approved.description')
                : apiResponse.message || '',
              apiResponse.status === 200
            );
          } catch (error) {
            console.error('Error approving order:', error);
            showResult(t('error'), t('error.approving.order'), false);
          } finally {
            setLoading(false);
          }
        }
      });

      setShowOrderModal(true);
    } catch (error) {
      console.error('Error handling buy products:', error);
      showResult(t('error'), t('error.handling.buy.products'), false);
    }
  };

  const handleBuyBundle = async (qrData: QrData) => {
    try {
      setBundleModalProps({
        title: qrData.bundleName || '',
        amount: Number(qrData.amount) || 0,
        customerUserId: qrData.customerUserId,
        bundleId: qrData.bundleId || 0,
        branchId: qrData.branchId || 0,
        createdAt: qrData.createdAt || '',
        onApprove: async () => {
          setShowBundleModal(false);
          setLoading(true);

          try {
            const apiResponse = await qrScannerService.buyBundleByCash({
              customerUserId: qrData.customerUserId,
              totalPrice: Number(qrData.amount) || 0,
              bundleId: qrData.bundleId || 0,
              branchId: qrData.branchId || 0,
              employeeId: globalUserState.id.get() as number
            });

            showResult(
              apiResponse.status === 200
                ? t('bundle.purchase.approved')
                : t('bundle.purchase.failed'),
              apiResponse.status === 200
                ? t('bundle.purchase.approved.description')
                : t('bundle.purchase.failed.description'),
              apiResponse.status === 200
            );
          } catch (error) {
            console.error('Error approving bundle purchase:', error);
            showResult(t('error'), t('error.approving.bundle.purchase'), false);
          } finally {
            setLoading(false);
          }
        }
      });

      setShowBundleModal(true);
    } catch (error) {
      console.error('Error handling buy bundle:', error);
      showResult(t('error'), t('error.handling.buy.bundle'), false);
    }
  };

  const handleBuyMembership = async (qrData: QrData) => {
    try {
      setMembershipModalProps({
        customerUserId: qrData.customerUserId,
        branchId: qrData.branchId || 0,
        createdAt: qrData.createdAt || '',
        onApprove: async () => {
          setShowMembershipModal(false);
          setLoading(true);

          try {
            const apiResponse = await qrScannerService.buyMembershipByCash({
              customerUserId: qrData.customerUserId,
              employeeId: globalUserState.id.get() as number,
              branchId: qrData.branchId || 0
            });

            showResult(
              apiResponse.status === 200
                ? t('membership.purchase.approved')
                : t('membership.purchase.failed'),
              apiResponse.status === 200
                ? t('membership.purchase.approved.description')
                : t('membership.purchase.failed.description'),
              apiResponse.status === 200
            );
          } catch (error) {
            console.error('Error approving membership purchase:', error);
            showResult(
              t('error'),
              t('error.approving.membership.purchase'),
              false
            );
          } finally {
            setLoading(false);
          }
        }
      });

      setShowMembershipModal(true);
    } catch (error) {
      console.error('Error handling buy membership:', error);
      showResult(t('error'), t('error.handling.buy.membership'), false);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    qrLock.current = false;
  };

  const closeDailyLoginModal = () => {
    setShowDailyLoginModal(false);
    qrLock.current = false;
  };

  const closeExamModal = () => {
    setShowExamModal(false);
    qrLock.current = false;
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    qrLock.current = false;
  };

  const closeBundleModal = () => {
    setShowBundleModal(false);
    qrLock.current = false;
  };

  const closeMembershipModal = () => {
    setShowMembershipModal(false);
    qrLock.current = false;
  };

  return (
    <>
      <Tooltip title={t('scan.qr.code')} arrow>
        <Button
          color="primary"
          onClick={handleOpen}
          size="small"
          variant="outlined"
          startIcon={<QrCodeScannerIcon />}
          sx={{
            mr: 1,
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white'
            }
          }}
        >
          {t('scan.qr.button')}
        </Button>
      </Tooltip>

      {/* QR Scanner Modal */}
      <QrScannerModal
        open={open}
        onClose={handleClose}
        onScan={handleScan}
        qrData={qrData}
        setQrData={setQrData}
        loading={loading}
      />

      {/* Result Modal */}
      <ResultModal
        open={showResultModal}
        onClose={closeResultModal}
        title={resultModalProps.title}
        description={resultModalProps.description}
        success={resultModalProps.success}
      />

      {/* Buy Daily Login Confirmation Modal */}
      <DailyLoginModal
        open={showDailyLoginModal}
        onClose={closeDailyLoginModal}
        onApprove={dailyLoginModalProps.onApprove}
        amount={dailyLoginModalProps.amount}
        createdAt={dailyLoginModalProps.createdAt}
      />

      {/* Buy Exam Confirmation Modal */}
      <ExamModal
        open={showExamModal}
        onClose={closeExamModal}
        onApprove={examModalProps.onApprove}
        title={examModalProps.title}
        amount={examModalProps.amount}
        startDate={examModalProps.startDate}
        createdAt={examModalProps.createdAt}
      />

      {/* Buy Products Confirmation Modal */}
      <OrderModal
        open={showOrderModal}
        onClose={closeOrderModal}
        onApprove={orderModalProps.onApprove}
        amount={orderModalProps.amount}
        netAmount={orderModalProps.netAmount}
        createdAt={orderModalProps.createdAt}
        products={orderModalProps.products}
      />

      {/* Buy Bundle Confirmation Modal */}
      <BundleModal
        open={showBundleModal}
        onClose={closeBundleModal}
        onApprove={bundleModalProps.onApprove}
        title={bundleModalProps.title}
        amount={bundleModalProps.amount}
        createdAt={bundleModalProps.createdAt}
      />

      {/* Buy Membership Confirmation Modal */}
      <MembershipModal
        open={showMembershipModal}
        onClose={closeMembershipModal}
        onApprove={membershipModalProps.onApprove}
        createdAt={membershipModalProps.createdAt}
      />
    </>
  );
};

export default QrScannerButton;
