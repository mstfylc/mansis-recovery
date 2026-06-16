import { TFunction } from 'i18next';

export const getValidationErrorMessage = (error: any, t: TFunction): string => {
  const errorData = error.response?.data;

  if (errorData?.errors && Array.isArray(errorData.errors)) {
    const validationErrors = errorData.errors;

    for (const err of validationErrors) {
      const constraints = err.constraints;

      if (constraints) {
        if (constraints.minLength && err.property === 'name') {
          return t('validation.warehouse.name.minLength');
        }
        if (constraints.maxLength && err.property === 'name') {
          return t('validation.warehouse.name.maxLength');
        }
        if (constraints.isNotEmpty && err.property === 'name') {
          return t('validation.warehouse.name.required');
        }

        if (constraints.min && err.property === 'quantity') {
          return t('validation.stock.quantity.positive');
        }
        if (constraints.isPositive && err.property === 'quantity') {
          return t('validation.stock.quantity.positive');
        }

        if (constraints.min && err.property === 'minThreshold') {
          return t('validation.stock.threshold.min.negative');
        }
        if (constraints.min && err.property === 'maxThreshold') {
          return t('validation.stock.threshold.max.negative');
        }

        if (constraints.minLength && err.property === 'reason') {
          return t('validation.stock.reason.minLength');
        }
        if (constraints.isNotEmpty && err.property === 'reason') {
          return t('validation.stock.reason.required');
        }
      }
    }

    const firstError = validationErrors[0];
    if (firstError?.constraints) {
      const constraintKey = Object.keys(firstError.constraints)[0];
      return firstError.constraints[constraintKey];
    }
  }

  if (errorData?.message) {
    return errorData.message;
  }

  return t('error.validation.failed');
};

export const getStockErrorMessage = (error: any, t: TFunction): string => {
  const errorMessage = error.response?.data?.message || '';

  if (errorMessage === 'Validation failed' || error.response?.data?.errors) {
    return getValidationErrorMessage(error, t);
  }

  if (errorMessage.includes('Stock already initialized')) {
    return t('error.stock.already.initialized');
  }
  if (errorMessage.includes('Stock not initialized')) {
    return t('error.stock.not.initialized');
  }
  if (errorMessage.includes('Insufficient stock')) {
    return t('error.stock.insufficient');
  }
  if (
    errorMessage.includes('Negative stock is not allowed') ||
    errorMessage.includes('Negative stock not allowed')
  ) {
    return t('error.stock.negative.not.allowed');
  }
  if (
    errorMessage.includes('Product is not active in the destination branch') ||
    errorMessage.includes('Product is not available in')
  ) {
    return t('error.stock.product.not.active.in.branch');
  }
  if (errorMessage.includes('Product is not available in this branch')) {
    return t('error.stock.product.not.in.branch');
  }
  if (
    errorMessage.includes('Minimum threshold cannot be greater than maximum')
  ) {
    return t('error.stock.threshold.min.greater.than.max');
  }

  return t('error.stock.operation.failed');
};

export const getWarehouseErrorMessage = (error: any, t: TFunction): string => {
  const errorMessage = error.response?.data?.message || '';

  if (errorMessage === 'Validation failed' || error.response?.data?.errors) {
    return getValidationErrorMessage(error, t);
  }

  if (
    errorMessage.includes('Cannot unset default warehouse') ||
    errorMessage.includes('At least one warehouse must be') ||
    errorMessage.includes('must be set as default') ||
    errorMessage.includes('Set another warehouse as default first')
  ) {
    return t('error.cannot.unset.default.warehouse');
  }
  if (errorMessage.includes('already exists in this branch')) {
    return t('warehouse.name.duplicate.error');
  }
  if (errorMessage.includes('Cannot delete default warehouse')) {
    return t('error.cannot.delete.default.warehouse');
  }
  if (errorMessage.includes('Cannot delete warehouse that has active stocks')) {
    return t('error.warehouse.has.stocks');
  }
  if (
    errorMessage.includes(
      'Cannot delete warehouse that has stock movement history'
    )
  ) {
    return t('error.warehouse.has.movements');
  }

  if (error.response?.status === 409) {
    return t('warehouse.name.duplicate.error');
  }
  if (error.response?.status === 404) {
    return t('error.not.found');
  }
  if (error.response?.status === 403) {
    return t('error.forbidden');
  }

  return t('error.warehouse.operation.failed');
};
