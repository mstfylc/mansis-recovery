/**
 * Export format types
 * Must match backend enum values
 */
export enum ExportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL'
}

/**
 * Export result from backend
 */
export interface ExportResult {
  url: string;
  filename: string;
}

/**
 * Stock history export params
 */
export interface StockHistoryExportParams {
  format: ExportFormat;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  movementType?: string;
}

/**
 * Future: Order export params
 */
export interface OrderExportParams {
  format: ExportFormat;
  includeDetails?: boolean;
}

/**
 * Future: Sales report export params
 */
export interface SalesReportExportParams {
  format: ExportFormat;
  startDate: string;
  endDate: string;
  branchId?: number;
  groupBy?: 'day' | 'week' | 'month';
}
