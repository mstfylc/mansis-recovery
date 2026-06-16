import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Stepper,
  Step,
  StepLabel,
  Button,
  IconButton,
  Typography,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageTitleWrapper from '@/components/PageTitleWrapper';
import StepContent from './components/StepContent';
import StepAudience from './components/StepAudience';
import StepSchedule from './components/StepSchedule';
import StepReview from './components/StepReview';
import { notificationService } from '@/data/notificationService';
import {
  NotificationCategory,
  NotificationTemplate,
  AudienceType,
  SegmentFilter,
  SegmentPreview
} from '@/types/Notification.interface';
import { useSnackbar } from 'notistack';

const steps = [
  'notification.wizard.step.content',
  'notification.wizard.step.audience',
  'notification.wizard.step.schedule',
  'notification.wizard.step.review'
];

function CreateNotificationCampaign() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const handleInsertVariable = (variable: string) => {
    const input = bodyInputRef.current;
    if (input) {
      const start = input.selectionStart ?? body.length;
      const end = input.selectionEnd ?? body.length;
      const newBody = body.substring(0, start) + variable + body.substring(end);
      setBody(newBody);
      setTimeout(() => {
        input.setSelectionRange(
          start + variable.length,
          start + variable.length
        );
        input.focus();
      }, 0);
    } else {
      setBody((prev) => prev + variable);
    }
  };

  // Step 1 — Content
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [category, setCategory] = useState<NotificationCategory>(
    NotificationCategory.ANNOUNCEMENT
  );
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const result = await notificationService.getTemplates();
        setTemplates(result || []);
      } catch {
        // silent
      }
    };
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (id: number | null) => {
    setTemplateId(id);
    if (id) {
      const tmpl = templates.find((t) => t.id === id);
      if (tmpl) {
        setTitle(tmpl.title);
        setBody(tmpl.body);
        setCategory(tmpl.category);
        if (tmpl.imageUrl) setImageUrl(tmpl.imageUrl);
        if (tmpl.deepLink) setDeepLink(tmpl.deepLink);
      }
    }
  };

  // Step 2 — Audience
  const [audienceType, setAudienceType] = useState<AudienceType>(
    AudienceType.ALL
  );
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>({});
  const [individualUsers, setIndividualUsers] = useState<any[]>([]);
  const [preview, setPreview] = useState<SegmentPreview | null>(null);

  // Step 3 — Schedule
  const [sendNow, setSendNow] = useState(true);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const handleNext = () => {
    const errors: Record<string, string> = {};

    if (activeStep === 0) {
      if (!title.trim()) errors.title = t('notification.errors.titleRequired');
      if (!body.trim()) errors.body = t('notification.errors.bodyRequired');
    }

    if (activeStep === 1) {
      if (
        audienceType === AudienceType.INDIVIDUAL &&
        individualUsers.length === 0
      ) {
        errors.audience = t('notification.errors.individualUsersRequired');
      }
      if (audienceType === AudienceType.SEGMENT) {
        const hasFilter =
          (segmentFilter.roles && segmentFilter.roles.length > 0) ||
          (segmentFilter.companyIds && segmentFilter.companyIds.length > 0) ||
          (segmentFilter.branchIds && segmentFilter.branchIds.length > 0) ||
          segmentFilter.orderBased !== undefined;
        if (!hasFilter) {
          errors.audience = t('notification.errors.segmentFilterRequired');
        }
      }
    }

    if (activeStep === 2) {
      if (!sendNow && !scheduledAt) {
        errors.scheduledAt = t('notification.errors.scheduledAtRequired');
      }
      if (!sendNow && scheduledAt && scheduledAt <= new Date()) {
        errors.scheduledAt = t('notification.errors.scheduledAtFuture');
      }
      if (expiresAt) {
        const referenceTime =
          !sendNow && scheduledAt ? scheduledAt : new Date();
        if (expiresAt <= referenceTime) {
          errors.expiresAt = t(
            'notification.errors.expiresAtBeforeScheduledAt'
          );
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }

    setStepErrors({});
    setActiveStep((prev) => prev + 1);
  };
  const handlePrevStep = () => {
    setStepErrors({});
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await notificationService.createCampaign({
        title,
        body,
        imageUrl: imageUrl || undefined,
        deepLink: deepLink || undefined,
        category,
        templateId: templateId || undefined,
        segmentFilter:
          audienceType === AudienceType.SEGMENT
            ? segmentFilter
            : audienceType === AudienceType.INDIVIDUAL
              ? { includeUserIds: individualUsers.map((u) => u.id) }
              : undefined,
        scheduledAt: sendNow ? undefined : scheduledAt?.toISOString(),
        expiresAt: expiresAt?.toISOString() || undefined,
        sendImmediately: sendNow
      });

      enqueueSnackbar(t('notification.campaign.createSuccess'), {
        variant: 'success'
      });
      navigate('/management/notifications');
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || t('common.error'), {
        variant: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <StepContent
            title={title}
            setTitle={setTitle}
            body={body}
            setBody={setBody}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            deepLink={deepLink}
            setDeepLink={setDeepLink}
            category={category}
            setCategory={setCategory}
            templateId={templateId}
            templates={templates}
            handleTemplateSelect={handleTemplateSelect}
            handleInsertVariable={handleInsertVariable}
            bodyInputRef={bodyInputRef}
            stepErrors={stepErrors}
            setStepErrors={setStepErrors}
          />
        );

      case 1:
        return (
          <StepAudience
            audienceType={audienceType}
            setAudienceType={setAudienceType}
            segmentFilter={segmentFilter}
            setSegmentFilter={setSegmentFilter}
            individualUsers={individualUsers}
            setIndividualUsers={setIndividualUsers}
            preview={preview}
            setPreview={setPreview}
            stepErrors={stepErrors}
            setStepErrors={setStepErrors}
          />
        );

      case 2:
        return (
          <StepSchedule
            sendNow={sendNow}
            setSendNow={setSendNow}
            scheduledAt={scheduledAt}
            setScheduledAt={setScheduledAt}
            expiresAt={expiresAt}
            setExpiresAt={setExpiresAt}
            stepErrors={stepErrors}
          />
        );

      case 3:
        return (
          <StepReview
            title={title}
            body={body}
            imageUrl={imageUrl}
            category={category}
            audienceType={audienceType}
            sendNow={sendNow}
            scheduledAt={scheduledAt}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('notification.campaign.create')}</title>
      </Helmet>
      <PageTitleWrapper>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(-1)} sx={{ p: 0 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h3" component="h3" gutterBottom>
              {t('notification.campaign.create')}
            </Typography>
            <Typography variant="subtitle2">
              {t('notification.campaign.subtitle')}
            </Typography>
          </Box>
        </Box>
      </PageTitleWrapper>

      <Container disableGutters maxWidth={false} sx={{ maxWidth: '90%' }}>
        <Card>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{t(label)}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Divider sx={{ my: 3 }} />

            <Box display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                disabled={activeStep === 0}
                onClick={handlePrevStep}
              >
                {t('common.back')}
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={submitting || !title || !body}
                >
                  {submitting
                    ? t('common.sending')
                    : t('notification.campaign.send')}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  {t('common.next')}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

export default CreateNotificationCampaign;
