export const LOG_IN = '/auth/admin/login';
export const SEND_OTP = '/auth/send-otp';
export const FORGOT_PASSWORD = '/auth/forgot-password';
export const CHANGE_PASSWORD = '/auth/change-password';
export const LOG_OUT = '/auth/logout';
export const REFRESH_TOKEN = '/auth/refresh';
export const SWITCH_BRANCH = '/auth/switch-branch';
export const USERS = '/users';
export const USER_BRANCHES = '/user-branches';
export const BRANCHES = '/branches';
export const PRODUCTS = '/products';
export const CAMPAIGNS = '/campaigns';
export const ORDERS = '/admin/orders';
export const ORDER_DETAILS = '/orders';
export const BUNDLE_CAMPAIGNS = '/campaigns/bundles';
export const DAILY_LOGINS = '/daily-logins';
export const CATEGORIES = '/categories';
export const ACTIVITIES = '/activities';
export const MEMBERSHIPS = '/memberships';
export const EXTEND_MEMBERSHIP = '/memberships/extend';
export const COMPANIES = '/companies';
export const COMPANY_SETTINGS = '/companies/:id/settings';
export const CHILD_ACTIVITIES = '/child-activities';
export const BUNDLES = '/bundles';
export const LOGIN_CAMPAIGN = '/login-campaign';
export const DASHBOARD = '/dashboard';
export const TICKETS = '/tickets';
export const MEMBERSHIP_PLANS = '/membership-plans';
// Adisyo integration endpoints
export const ADISYO_BRANCH_STATUS = '/adisyo/branches/:branchId/status';
export const ADISYO_CONFIG = '/adisyo/branches/:branchId/config';
export const ADISYO_SETUP = '/adisyo/branches/:branchId/setup';
export const ADISYO_BRANCH_DELETE = '/adisyo/branches/:branchId/delete';
export const ADISYO_SYNC_PRODUCTS = '/adisyo/branches/:branchId/sync/products';
export const ADISYO_MAPPINGS = '/adisyo/branches/:branchId/mappings';
export const ADISYO_TOGGLE_AUTO_SYNC =
  '/adisyo/branches/:branchId/toggle-auto-sync';

// Desktop Release
export const DESKTOP_RELEASE = '/desktop-release';

// QR Scanner endpoints
export const CHECK_IN_DAILY_LOGIN = '/checks/daily-login?branchId=';
export const BUY_DAILY_LOGIN = '/orders/cash/login';
export const CHECK_EXAM = '/checks/exam';
export const BUY_ACTIVITY_BY_CASH = '/orders/cash/activity';
export const BUY_CART_BY_CASH = '/orders/cash/cart';
export const BUY_BUNDLE_BY_CASH = '/orders/cash/bundle';
export const BUY_MEMBERSHIP_BY_CASH = '/memberships/cash';

// Finance endpoints
export const DAILY_EARNINGS = '/finance/daily-earnings';
export const WITHDRAWAL_REQUESTS = '/finance/withdrawal-requests';
export const FINANCE_SUMMARY = '/finance/summary';
export const AVAILABLE_BALANCE = '/finance/available-balance';
export const UPDATE_STATUS = '/update-status';
export const BRANCH_FINANCIAL_INFO = '/branch-financial-info';
export const BRANCH_FINANCIAL_INFO_BY_BRANCH =
  '/branch-financial-info/branch/:branchId';
export const BRANCH_FINANCIAL_INFO_DETAIL = '/branch-financial-info/:id';

// Accounting Ledger endpoints
export const ACCOUNTING_LEDGER_ENTRIES = '/accounting-ledger/entries';
export const ACCOUNTING_LEDGER_BRANCHES_SUMMARY =
  '/accounting-ledger/branches-summary';
export const ACCOUNTING_LEDGER_MANUAL_ADJUSTMENT =
  '/accounting-ledger/adjustment';
export const ACCOUNTING_LEDGER_NEGATIVE_LIMIT =
  '/accounting-ledger/negative-limit';
export const ACCOUNTING_LEDGER_NEGATIVE_LIMIT_BY_BRANCH =
  '/accounting-ledger/negative-limit/:branchId';

// Company Product Settings endpoints
export const COMPANY_PRODUCT_SETTINGS = '/company-product-settings';
export const COMPANY_PRODUCT_SETTINGS_BY_COMPANY =
  '/company-product-settings/company';
export const COMPANY_PRODUCT_STRATEGY_CONSTRAINTS =
  '/company-product-settings/company/:companyId/strategy-constraints';
export const COMPANY_PRODUCT_STRATEGY_UPDATE =
  '/company-product-settings/company/:companyId/strategy';

// Company Products & Menu Management
export const COMPANY_PRODUCTS = '/company-products';
export const COMPANY_PRODUCT_DETAIL = '/company-products/:productId';
export const COMPANY_PRODUCT_BRANCH_OVERRIDES =
  '/company-products/:productId/branch-overrides';
export const COMPANY_PRODUCTS_STOCK_TRACKED_BY_BRANCH =
  '/company-products/branch/:branchId/stock-tracked';

export const PRODUCT_ATTRIBUTES = '/attributes/product/:productId';
export const ATTRIBUTE_DETAIL = '/attributes/:attributeId';
export const AVAILABLE_ATTRIBUTES_FOR_IMPORT =
  '/attributes/available-for-import';
export const IMPORT_ATTRIBUTE_GROUP =
  '/attributes/import-to-product/:productId';

export const BRANCH_PRODUCT_OVERRIDES = '/company-products/branch-overrides';
export const BRANCH_PRODUCT_OVERRIDE_DETAIL =
  '/company-products/branch-overrides/:overrideId';
export const MENUS = '/menus';
export const MENU_ITEMS_BY_MENU = '/menus/:menuId/items';
export const MENU_GROUPED_ITEMS = '/menus/:menuId/grouped-items';
export const MENU_PREVIEW = '/menus/:menuId/preview';
export const MENU_CALCULATE_PRICE = '/menus/:menuId/calculate-price';
export const MENU_BULK_ADD_ITEMS = '/menus/:menuId/bulk-add-items';
export const MENU_BRANCH_OVERRIDES = '/menus/branch-overrides';

export const STOCK = '/stocks';
export const STOCK_BY_BRANCH_PRODUCT =
  '/stocks/branch/:branchId/product/:productId';
export const STOCK_INITIALIZE = '/stocks/initialize';
export const STOCK_ADD = '/stocks/add';
export const STOCK_DEDUCT = '/stocks/deduct';
export const STOCK_ADJUST = '/stocks/adjust';
export const STOCK_TRANSFER = '/stocks/transfer';
export const STOCK_UPDATE_THRESHOLDS = '/stocks/thresholds';
export const STOCK_MOVEMENTS = '/stocks/movements';
export const STOCK_MOVEMENTS_BY_BRANCH = '/stocks/movements/branch/:branchId';
export const STOCK_HISTORY_EXPORT = '/stocks/:stockId/history/export';

// Product Stock Threshold endpoints
export const STOCK_THRESHOLDS = '/stock-thresholds';
export const STOCK_THRESHOLDS_BULK = '/stock-thresholds/bulk';
export const STOCK_THRESHOLD_DETAIL =
  '/stock-thresholds/:branchId/:productId/:warehouseId';
export const STOCK_THRESHOLDS_BY_PRODUCT =
  '/stock-thresholds/product/:branchId/:productId';
export const STOCK_THRESHOLD_CHECK_LOW_STOCK =
  '/stock-thresholds/check-low-stock/:branchId/:productId/:warehouseId';

export const STOCK_BATCH_REQUIREMENTS = '/stocks/batch-requirements';

export const STOCK_EVENTS_ALL = '/stocks/events/all';
export const STOCK_EVENTS_BY_BRANCH = '/stocks/events/all/:branchId';
export const STOCK_EVENTS_UPDATES = '/stocks/events/updates/:branchId';
export const STOCK_EVENTS_LOW_STOCK = '/stocks/events/low-stock/:branchId';
export const STOCK_EVENTS_TRANSFERS = '/stocks/events/transfers/:branchId';

export const BATCHES = '/batches';
export const BATCH_BY_ID = '/batches/:id';
export const BATCH_EXPIRING_COUNT = '/batches/expiring-count';
export const BATCH_EXPIRING_SOON = '/batches/expiring-soon';
export const BATCH_STATUS = '/batches/:id/status';
export const BATCH_RECALL = '/batches/:id/recall';
export const BATCH_BY_SUPPLIER = '/batches/by-supplier/:supplierBatchNo';
export const BATCH_LOCATIONS = '/batches/:id/locations';

export const BATCH_EVENTS_ALL = '/batches/events/all';
export const BATCH_EVENTS_BY_BRANCH = '/batches/events/all/:branchId';
export const BATCH_EVENTS_EXPIRING = '/batches/events/expiring/:branchId';
export const BATCH_EVENTS_EXPIRED = '/batches/events/expired/:branchId';
export const BATCH_EVENTS_STATUS = '/batches/events/status/:branchId';
export const BATCH_EVENTS_RECALLED = '/batches/events/recalled';

export const WAREHOUSES = '/warehouses';
export const WAREHOUSE_DETAIL = '/warehouses/:warehouseId';
export const WAREHOUSES_BY_BRANCH = '/warehouses/branch/:branchId';
export const WAREHOUSE_STATISTICS = '/warehouses/:warehouseId/statistics';
export const WAREHOUSE_STOCKS = '/warehouses/:warehouseId/stocks';
export const WAREHOUSE_MOVEMENTS = '/warehouses/:warehouseId/movements';
export const WAREHOUSE_STOCKS_EXPORT = '/warehouses/:warehouseId/stocks/export';

export const RECIPES = '/recipes';
export const RECIPE_DETAIL = '/recipes/:recipeId';
export const RECIPE_INGREDIENTS = '/recipes/:recipeId/ingredients';
export const RECIPE_AVAILABILITY = '/recipes/:recipeId/availability';
export const RECIPE_MODIFIERS = '/recipes/:recipeId/modifiers';
export const RECIPE_MODIFIER_DETAIL =
  '/recipes/:recipeId/modifiers/:modifierId';

export const LICENSING_FEATURES = '/licensing/features';
export const LICENSING_SUBSCRIPTION = '/licensing/subscription';
export const LICENSING_SUBSCRIPTIONS = '/licensing/subscriptions';
export const LICENSING_PLANS = '/licensing/plans';
export const LICENSING_ASSIGN_PLAN = '/licensing/assign-plan';
export const LICENSING_RENEW_SUBSCRIPTION = '/licensing/renew-subscription';
export const LICENSING_CANCEL_SUBSCRIPTION = '/licensing/cancel-subscription';
export const LICENSING_SMS_QUOTA = '/licensing/sms-quota';
export const LICENSING_ADD_EXTRA_QUOTA = '/licensing/add-extra-quota';
export const LICENSING_CHANGE_PLAN = '/licensing/change-plan';
export const LICENSING_UPDATE_SUBSCRIPTION = '/licensing/update-subscription';
export const LICENSING_CHECK_FEATURE = '/licensing/check-feature';
export const LICENSING_STATS = '/licensing/stats';
export const LICENSING_CRON_DAILY_CHECK = '/licensing/cron/daily-check';

export const SMS_PACKAGES = '/sms-packages';
export const SMS_PACKAGE_BY_ID = '/sms-packages/:id';
export const SMS_PACKAGE_PURCHASE = '/sms-packages/purchase';
export const SMS_PURCHASE_HISTORY = '/sms-packages/purchases/:branchId';

export const LOYALTY_SETTINGS = '/loyalty/settings/company';
export const LOYALTY_SETTINGS_ALL = '/loyalty/settings';
export const LOYALTY_PRODUCTS = '/loyalty/products/branch';
export const LOYALTY_PRODUCTS_ALL = '/loyalty/products';
export const LOYALTY_PRODUCTS_BULK_DELETE = '/loyalty/products/delete';
export const POINT_MULTIPLIERS = '/loyalty/multipliers/company';

export const VOUCHER_TEMPLATES = '/vouchers/templates/branch';
export const VOUCHER_TEMPLATES_LIST = '/vouchers/templates';
export const VOUCHER_TEMPLATES_BULK_DELETE = '/vouchers/templates/delete';
export const VOUCHER_TEMPLATE_DETAIL =
  '/vouchers/templates/branch/:branchId/:templateId';
export const VOUCHER_STATS = '/vouchers/stats/branch';
export const VOUCHER_GRANT = '/vouchers/grant/branch';

// Promo Codes
export const PROMO_CODES = '/vouchers/templates/branch';
export const PROMO_CODES_BULK_DELETE = '/vouchers/promo-codes/bulk-delete';
export const PROMO_CODE_UPDATE = '/vouchers/promo-codes';

// Stamp Cards
export const STAMP_CARDS = '/stamp-cards/company';
export const STAMP_CARD_BRANCHES = '/stamp-cards/company';
export const STAMP_CARD_PRODUCTS = '/stamp-cards/company';
export const STAMP_CARD_STATS = '/stamp-cards/company';
export const BRANCH_PRODUCTS = '/company-products/branch';

export const DAILY_LOGIN_TYPES = '/branches/:branchId/daily-login-types';
export const DAILY_LOGIN_TYPE_DETAIL =
  '/branches/:branchId/daily-login-types/:dailyLoginTypeId';
export const DAILY_LOGIN_TYPES_REORDER =
  '/branches/:branchId/daily-login-types/reorder';

// Server time
export const SERVER_TIME = '/server-time';

export const CHANGELOG = '/changelog';

// Notifications
export const NOTIFICATION_CAMPAIGNS = '/notifications/campaigns';
export const NOTIFICATION_CAMPAIGN_DETAIL = '/notifications/campaigns/:id';
export const NOTIFICATION_CAMPAIGN_RECIPIENTS =
  '/notifications/campaigns/:id/recipients';
export const NOTIFICATION_CAMPAIGN_SEND = '/notifications/campaigns/:id/send';
export const NOTIFICATION_CAMPAIGN_CANCEL =
  '/notifications/campaigns/:id/cancel';
export const NOTIFICATION_CAMPAIGN_DUPLICATE =
  '/notifications/campaigns/:id/duplicate';
export const NOTIFICATION_SEGMENT_PREVIEW = '/notifications/segments/preview';
export const NOTIFICATION_USER_SEARCH = '/notifications/users/search';
export const NOTIFICATION_TEMPLATES = '/notifications/templates';
export const NOTIFICATION_TEMPLATE_DETAIL = '/notifications/templates/:id';
export const NOTIFICATION_INBOX = '/notifications/inbox';
export const NOTIFICATION_INBOX_UNREAD_COUNT =
  '/notifications/inbox/unread-count';
export const NOTIFICATION_INBOX_READ = '/notifications/inbox/:id/read';
export const NOTIFICATION_INBOX_READ_ALL = '/notifications/inbox/read-all';
export const NOTIFICATION_INBOX_ARCHIVE = '/notifications/inbox/:id/archive';
export const NOTIFICATION_INBOX_DELETE = '/notifications/inbox/:id';
export const NOTIFICATION_PREFERENCES = '/notifications/inbox/preferences';

// Firebase
export const FCM_TOKEN = '/firebase/save-fcm-token';
export const DELETE_FCM_TOKEN = '/firebase/delete-fcm-token';

// Table Management (floor plan & table configuration only — operational ops are in POS app)
export const FLOOR_PLANS = '/tables/floor-plans';
export const FLOOR_PLAN_DETAIL = '/tables/floor-plans/:id';
export const TABLES = '/tables';
export const TABLE_DETAIL = '/tables/:id';
export const TABLE_STATUS = '/tables/:id/status';
export const TABLE_QR_GENERATE = '/tables/:id/qr';
