"use strict";
require("dotenv/config");
const electron = require("electron");
const path = require("path");
const Store = require("electron-store");
const axios = require("axios");
const log = require("electron-log");
const socket_ioClient = require("socket.io-client");
const AutoLaunch = require("auto-launch");
const electronUpdater = require("electron-updater");
const os = require("os");
const child_process = require("child_process");
const util = require("util");
const fs = require("fs");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const os__namespace = /* @__PURE__ */ _interopNamespaceDefault(os);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
const WS_CONNECT_TIMEOUT_MS = 3e4;
const WS_RECON_DELAY_MS = 5e3;
const MAIN_WINDOW_WIDTH = 1024;
const MAIN_WINDOW_HEIGHT = 768;
const MAIN_WINDOW_MIN_WIDTH = 800;
const MAIN_WINDOW_MIN_HEIGHT = 600;
const PRINT_QUEUE_DELAY_BETWEEN_JOBS_MS = 500;
const PRINT_QUEUE_MAX_RETRIES = 3;
const PRINT_QUEUE_RETRY_DELAY_MS = 1e3;
const DEFAULT_RECONNECT_INTERVAL_MS = 5e3;
const UPDATE_CHECK_INTERVAL_MS = 4 * 60 * 60 * 1e3;
const UPDATE_CHECK_INITIAL_DELAY_MS = 10 * 1e3;
class ConfigManager {
  constructor() {
    this.defaultConfig = {
      apiUrl: process.env.API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3001" : "https://backend.mansis.com.tr"),
      autoReconnect: true,
      reconnectInterval: DEFAULT_RECONNECT_INTERVAL_MS,
      autoLaunchEnabled: false,
      isFirstRun: true,
      receiptLogoConfig: {
        entranceTicket: false,
        orderTicket: false,
        tableCheck: false,
        testPrint: false
      }
    };
    this.store = new Store({
      defaults: this.defaultConfig
    });
  }
  /**
   * Get the complete configuration
   * apiUrl: .env'deki API_URL varsa onu kullan
   */
  getConfig() {
    const config = this.store.store;
    if (process.env.API_URL) {
      return { ...config, apiUrl: process.env.API_URL };
    }
    return config;
  }
  /**
   * Get a specific configuration value
   * API_URL: .env'deki API_URL her zaman önceliklidir (dev'de store'daki prod URL'i override eder)
   */
  get(key) {
    if (key === "apiUrl" && process.env.API_URL) {
      return process.env.API_URL;
    }
    return this.store.get(key);
  }
  /**
   * Set a specific configuration value
   */
  set(key, value) {
    this.store.set(key, value);
  }
  /**
   * Update multiple configuration values
   */
  update(config) {
    Object.entries(config).forEach(([key, value]) => {
      this.store.set(key, value);
    });
  }
  /**
   * Reset configuration to defaults
   */
  reset() {
    this.store.clear();
  }
  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!(this.store.get("accessToken") || this.store.get("refreshToken"));
  }
  /**
   * Clear authentication data
   */
  clearAuth() {
    this.store.delete("accessToken");
    this.store.delete("refreshToken");
    this.store.delete("username");
    this.store.delete("email");
    this.store.delete("userId");
    this.store.delete("name");
    this.store.delete("surname");
    this.store.delete("role");
    this.store.delete("branchName");
    this.store.delete("branchId");
    this.store.delete("companyId");
  }
}
const LOG_IN = "/auth/login";
const LOG_OUT = "/auth/logout";
const REFRESH_TOKEN = "/auth/refresh";
const USER_PROFILE = "/users/profile";
const PRINT_RESULT = "/api/print/result";
if (electron.app) {
  log.transports.file.resolvePathFn = () => {
    return path.join(electron.app.getPath("userData"), "logs", "main.log");
  };
}
log.transports.file.level = "info";
log.transports.console.level = "debug";
log.transports.file.format = "[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.console.format = "[{h}:{i}:{s}.{ms}] [{level}] {text}";
log.transports.file.maxSize = 10 * 1024 * 1024;
const logger = {
  info: (...args) => log.info(...args),
  error: (...args) => log.error(...args),
  warn: (...args) => log.warn(...args),
  debug: (...args) => log.debug(...args),
  verbose: (...args) => log.verbose(...args)
};
logger.info("=".repeat(60));
logger.info("Fundra Desktop Application Started");
logger.info(`Version: ${electron.app?.getVersion() || "dev"}`);
logger.info(`Platform: ${process.platform}`);
logger.info(`Node Version: ${process.version}`);
logger.info(`Electron Version: ${process.versions.electron}`);
logger.info("=".repeat(60));
class AuthService {
  constructor(deps) {
    this.configManager = deps.configManager;
    this.apiClient = deps.apiClient;
    this.publicApiClient = deps.publicApiClient;
  }
  /**
   * Login to the backend and store tokens
   */
  async login(credentials) {
    const baseURL = this.configManager.get("apiUrl");
    const requestUrl = `${baseURL}${LOG_IN}`;
    logger.info("Login request", {
      url: requestUrl,
      userLoginData: credentials.userLoginData
    });
    try {
      const response = await this.publicApiClient.post(
        LOG_IN,
        credentials
      );
      logger.info("Login response", {
        status: response.status,
        url: requestUrl
      });
      const data = response.data;
      logger.info("Login successful");
      this.configManager.set("accessToken", data.accessToken);
      this.configManager.set("refreshToken", data.refreshToken);
      if (data.user) {
        this.configManager.set(
          "username",
          data.user.username || data.user.email
        );
        this.configManager.set("email", data.user.email);
        this.configManager.set("userId", data.user.id);
        if (data.user.name) {
          this.configManager.set("name", data.user.name);
        }
        if (data.user.surname) {
          this.configManager.set("surname", data.user.surname);
        }
        const user = data.user;
        if (user.role) {
          this.configManager.set("role", user.role);
        }
        if (user.branchName || user.branch?.name) {
          this.configManager.set(
            "branchName",
            user.branchName || user.branch?.name
          );
        }
        if (user.branchId || user.branch?.id) {
          this.configManager.set("branchId", user.branchId || user.branch?.id);
        }
      }
      const email = data.user?.email ?? credentials.userLoginData;
      logger.info(`Successfully authenticated as ${email}`);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error;
        const status = axiosError.response?.status;
        const errorMessage = axiosError.response?.data?.message || axiosError.message || "Login failed";
        const requestBaseUrl = axiosError.config?.baseURL ?? this.configManager.get("apiUrl");
        logger.error("Login failed", {
          status: status ?? "no response",
          message: errorMessage,
          url: `${requestBaseUrl}${LOG_IN}`,
          hasResponse: !!axiosError.response,
          responseData: axiosError.response?.data
        });
        if (status === 401) {
          logger.info(
            "401: Kullanıcı bulunamadı, yanlış şifre veya hesap aktif değil. Backend'e ulaşıldı."
          );
        } else if (!axiosError.response) {
          logger.error(
            "Backend'e ulaşılamadı (ECONNREFUSED, timeout vb). API_URL ve backend'in çalıştığını kontrol edin."
          );
        }
        throw new Error(errorMessage);
      }
      logger.error("Login error:", error);
      throw error;
    }
  }
  /**
   * Refresh the access token using refresh token
   * Note: ApiClient handles this automatically via interceptors
   */
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    try {
      const response = await this.publicApiClient.get(REFRESH_TOKEN, {
        headers: {
          Authorization: `Bearer ${refreshToken}`
        }
      });
      const data = response.data;
      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error("Invalid refresh response: missing tokens");
      }
      this.configManager.set("accessToken", data.accessToken);
      this.configManager.set("refreshToken", data.refreshToken);
      logger.info("Access token refreshed successfully");
      return data.accessToken;
    } catch (error) {
      this.configManager.clearAuth();
      logger.error("Token refresh error:", error instanceof Error ? error.message : error);
      throw new Error("Refresh token expired. Please login again.");
    }
  }
  /**
   * Logout and clear stored credentials
   */
  async logout() {
    try {
      await this.apiClient.get(LOG_OUT);
      logger.info("Backend logout successful");
    } catch (error) {
      logger.error("Backend logout error:", error);
    }
    this.configManager.clearAuth();
    logger.info("Logged out successfully");
  }
  /**
   * Check if the user is authenticated
   */
  isAuthenticated() {
    return this.configManager.isAuthenticated();
  }
  /**
   * Get the current access token
   */
  getAccessToken() {
    return this.configManager.get("accessToken");
  }
  /**
   * Get the current refresh token
   */
  getRefreshToken() {
    return this.configManager.get("refreshToken");
  }
  /**
   * Get stored user info
   */
  getUserInfo() {
    return {
      username: this.configManager.get("username"),
      email: this.configManager.get("email"),
      userId: this.configManager.get("userId"),
      name: this.configManager.get("name"),
      surname: this.configManager.get("surname"),
      role: this.configManager.get("role"),
      branchName: this.configManager.get("branchName"),
      branchId: this.configManager.get("branchId"),
      companyName: this.configManager.get("companyName")
    };
  }
  /**
   * Verify access token is still valid
   * Just checks if token exists - actual validation happens on API calls
   */
  async verifyToken() {
    const token = this.getAccessToken();
    return !!token;
  }
}
class WebSocketClient {
  constructor(configManager, tokenRefreshFn) {
    this.socket = null;
    this.messageHandlers = /* @__PURE__ */ new Map();
    this.connectionHandlers = [];
    this.disconnectionHandlers = [];
    this.configManager = configManager;
    this.tokenRefreshFn = tokenRefreshFn;
  }
  /**
   * Connect to the WebSocket server using Socket.io
   * Uses auth callback so each connect/reconnect gets fresh token from ConfigManager
   */
  async connect() {
    if (this.socket && this.socket.connected) {
      logger.info("Already connected to WebSocket");
      return;
    }
    const accessToken = this.configManager.get("accessToken");
    if (!accessToken) {
      logger.error("No authentication token available");
      throw new Error("No authentication token available");
    }
    const apiUrl = this.configManager.get("apiUrl");
    if (!apiUrl || typeof apiUrl !== "string") {
      logger.error("Invalid or missing apiUrl in config");
      throw new Error("API URL is not configured");
    }
    logger.info(`Connecting to WebSocket: ${apiUrl}`);
    return new Promise((resolve, reject) => {
      const connectTimeout = setTimeout(() => {
        if (!this.socket?.connected) {
          reject(new Error("Socket.io connection timeout"));
        }
      }, WS_CONNECT_TIMEOUT_MS);
      try {
        this.socket = socket_ioClient.io(apiUrl, {
          auth: (cb) => {
            const token = this.configManager.get("accessToken");
            cb({ token: token || "" });
          },
          reconnection: this.configManager.get("autoReconnect") !== false,
          reconnectionDelay: WS_RECON_DELAY_MS,
          reconnectionAttempts: Infinity,
          transports: ["websocket"]
        });
        this.socket.on("connect", () => {
          clearTimeout(connectTimeout);
          logger.info("WebSocket connected");
          this.connectionHandlers.forEach((handler) => handler());
          resolve();
        });
        this.socket.on("disconnect", (reason) => {
          logger.info(`WebSocket disconnected: ${reason}`);
          this.disconnectionHandlers.forEach((handler) => handler());
        });
        this.socket.on("connect_error", async (error) => {
          logger.error(`WebSocket connection error: ${error.message}`);
          if (this.tokenRefreshFn) {
            try {
              const refreshed = await this.tokenRefreshFn();
              if (refreshed) {
                logger.info("Token refreshed, Socket.io will retry connection");
                return;
              }
            } catch (refreshError) {
              logger.error(
                "Token refresh failed on connect_error:",
                refreshError
              );
            }
          }
          clearTimeout(connectTimeout);
          reject(error);
        });
        this.messageHandlers.forEach((handler, event) => {
          this.socket?.on(event, handler);
        });
      } catch (error) {
        clearTimeout(connectTimeout);
        reject(error);
      }
    });
  }
  /**
   * Disconnect from the Socket.io server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  /**
   * Send a message to the server (emit event)
   */
  send(event, data) {
    if (!this.socket || !this.socket.connected) {
      throw new Error("Socket.io is not connected");
    }
    this.socket.emit(event, data);
  }
  /**
   * Reconnect with new token (after refresh)
   */
  async reconnectWithNewToken() {
    logger.info("Reconnecting with new token");
    this.disconnect();
    await this.connect();
  }
  /**
   * Register a handler for a specific event
   */
  on(event, handler) {
    const wrapped = (data) => handler(data);
    this.messageHandlers.set(event, wrapped);
    if (this.socket) {
      this.socket.on(event, wrapped);
    }
  }
  /**
   * Register a connection handler
   */
  onConnect(handler) {
    this.connectionHandlers.push(handler);
  }
  /**
   * Register a disconnection handler
   */
  onDisconnect(handler) {
    this.disconnectionHandlers.push(handler);
  }
  /**
   * Check if connected
   */
  isConnected() {
    return this.socket !== null && this.socket.connected;
  }
  /**
   * Emit a ping to test connection
   */
  ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit("ping");
    }
  }
}
class PrintQueue {
  constructor(deps) {
    this.queue = [];
    this.isProcessing = false;
    this.printer = deps.printer;
    this.configManager = deps.configManager;
    this.apiClient = deps.apiClient;
  }
  /**
   * Add a ticket to the print queue
   */
  async addTicket(ticket) {
    logger.info(`Adding ticket ${ticket.id} to print queue`);
    this.queue.push(ticket);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }
  /**
   * Process the print queue
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    this.isProcessing = true;
    while (this.queue.length > 0) {
      const ticket = this.queue.shift();
      await this.printTicket(ticket);
    }
    this.isProcessing = false;
  }
  /**
   * Print a single ticket and notify backend
   */
  async printTicket(ticket) {
    const result = {
      ticketId: ticket.id,
      success: false,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      printerName: this.configManager.get("printerName")
    };
    try {
      await this.printer.print(ticket);
      result.success = true;
      logger.info(`Successfully printed ticket ${ticket.id}`);
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to print ticket ${ticket.id}:`, error);
    }
    await this.notifyBackend(result);
  }
  /**
   * Notify backend about print result
   */
  async notifyBackend(result) {
    const accessToken = this.configManager.get("accessToken");
    if (!accessToken) {
      logger.error("Cannot notify backend: no auth token");
      return;
    }
    try {
      await this.apiClient.post(PRINT_RESULT, result);
      logger.info(`Notified backend about ticket ${result.ticketId}`);
    } catch (error) {
      logger.error("Error notifying backend:", error);
    }
  }
  /**
   * Get current queue size
   */
  getQueueSize() {
    return this.queue.length;
  }
  /**
   * Clear the queue
   */
  clearQueue() {
    this.queue = [];
  }
}
class AutoLaunchManager {
  constructor() {
    this.autoLauncher = new AutoLaunch({
      name: "Fundra Desktop",
      path: electron.app.getPath("exe")
    });
  }
  /**
   * Check if auto-launch is enabled
   */
  async isEnabled() {
    try {
      return await this.autoLauncher.isEnabled();
    } catch (error) {
      logger.error("Error checking auto-launch status:", error);
      return false;
    }
  }
  /**
   * Enable auto-launch
   */
  async enable() {
    try {
      await this.autoLauncher.enable();
      logger.info("Auto-launch enabled successfully");
      return true;
    } catch (error) {
      logger.error("Error enabling auto-launch:", error);
      return false;
    }
  }
  /**
   * Disable auto-launch
   */
  async disable() {
    try {
      await this.autoLauncher.disable();
      logger.info("Auto-launch disabled successfully");
      return true;
    } catch (error) {
      logger.error("Error disabling auto-launch:", error);
      return false;
    }
  }
  /**
   * Toggle auto-launch
   */
  async toggle() {
    const enabled = await this.isEnabled();
    if (enabled) {
      return await this.disable();
    } else {
      return await this.enable();
    }
  }
}
class CustomApiClient {
  constructor(configManager) {
    this.configManager = configManager;
    this.instance = axios.create({
      baseURL: this.configManager.get("apiUrl"),
      headers: {
        "Content-Type": "application/json"
      }
    });
    this.setupInterceptors();
  }
  setupInterceptors() {
    let isRefreshing = false;
    let failedQueue = [];
    const processQueue = (error, token) => {
      failedQueue.forEach((promise) => {
        if (token) {
          promise.resolve(token);
        } else {
          promise.reject(
            error instanceof Error ? error : new Error(String(error))
          );
        }
      });
      failedQueue = [];
    };
    this.instance.interceptors.request.use(
      async (config) => {
        config.baseURL = this.configManager.get("apiUrl");
        const token = this.configManager.get("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (axios.isCancel(error)) {
          logger.info("Request canceled");
          return Promise.reject(error);
        }
        const axiosError = error;
        const originalRequest = axiosError.config;
        if (axiosError.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            });
          }
          originalRequest._retry = true;
          isRefreshing = true;
          try {
            const refreshToken = this.configManager.get("refreshToken");
            if (!refreshToken) {
              this.configManager.clearAuth();
              return Promise.reject(new Error("No refresh token available"));
            }
            const apiUrl = this.configManager.get("apiUrl");
            if (!apiUrl || typeof apiUrl !== "string") {
              this.configManager.clearAuth();
              return Promise.reject(new Error("API URL is not configured"));
            }
            const response = await axios.get(`${apiUrl}${REFRESH_TOKEN}`, {
              headers: {
                Authorization: `Bearer ${refreshToken}`
              }
            });
            const newAccessToken = response.data?.accessToken;
            const newRefreshToken = response.data?.refreshToken;
            if (!newAccessToken || !newRefreshToken) {
              throw new Error("Invalid refresh response: missing tokens");
            }
            this.configManager.set("accessToken", newAccessToken);
            this.configManager.set("refreshToken", newRefreshToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return axios(originalRequest);
          } catch (refreshError) {
            logger.error("Error refreshing token:", refreshError);
            processQueue(
              refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
              null
            );
            if (refreshError && typeof refreshError === "object" && "response" in refreshError) {
              const err = refreshError;
              if (err.response?.status === 401 || err.response?.status === 403) {
                this.configManager.clearAuth();
                logger.error("Session expired. Please login again.");
              }
            }
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
        if (axiosError.response?.status === 403) {
          logger.error("Permission denied");
        } else if (axiosError.response?.status === 404) {
          const data = axiosError.response?.data;
          const errorMessage = data?.message ? String(data.message) : "Not found";
          logger.error(errorMessage);
        } else if (axiosError.response?.status === 500) {
          logger.error("Server error");
        } else if (axiosError.response?.status === 409) {
          const data = axiosError.response?.data;
          const errorMessage = data?.message ? String(data.message) : "Conflict error";
          logger.error(errorMessage);
        } else if (axiosError.response?.status === 413) {
          logger.error("File size too large");
        } else if (axiosError.response?.status === 415) {
          logger.error("Wrong file type");
        }
        return Promise.reject(error);
      }
    );
  }
  async get(url, params = {}) {
    try {
      const response = await this.instance.get(url, {
        params
      });
      return response;
    } catch (error) {
      logger.error("Error fetching data:", error);
      throw error;
    }
  }
  async post(url, data = {}) {
    try {
      let config = {};
      if (data instanceof FormData) {
        config = {
          headers: {
            "Content-Type": void 0
          }
        };
      }
      const response = await this.instance.post(
        url,
        data,
        config
      );
      return response;
    } catch (error) {
      logger.error("Error posting data:", error);
      throw error;
    }
  }
  async put(url, data = {}) {
    try {
      const response = await this.instance.put(url, data);
      return response;
    } catch (error) {
      logger.error("Error updating data:", error);
      throw error;
    }
  }
  async patch(url, data = {}) {
    try {
      let config = {};
      if (data instanceof FormData) {
        config = {
          headers: {
            "Content-Type": void 0
          }
        };
      }
      const response = await this.instance.patch(
        url,
        data,
        config
      );
      return response;
    } catch (error) {
      logger.error("Error patching data:", error);
      throw error;
    }
  }
  async delete(url, config) {
    try {
      const response = await this.instance.delete(
        url,
        config
      );
      return response;
    } catch (error) {
      logger.error("Error deleting data:", error);
      throw error;
    }
  }
}
function createApiClient(configManager) {
  return new CustomApiClient(configManager);
}
function createPublicApiClient(configManager) {
  const instance = axios.create({
    baseURL: configManager.get("apiUrl"),
    headers: {
      "Content-Type": "application/json"
    }
  });
  instance.interceptors.request.use((config) => {
    config.baseURL = configManager.get("apiUrl");
    return config;
  });
  return instance;
}
class UpdateManager {
  constructor() {
    this.currentStatus = { status: "not-available" };
    this.checkTimer = null;
    this.initialTimer = null;
    this.mainWindow = null;
    this.configureUpdater();
    this.bindEvents();
  }
  /**
   * Configure electron-updater settings
   */
  configureUpdater() {
    electronUpdater.autoUpdater.autoDownload = true;
    electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
    electronUpdater.autoUpdater.allowDowngrade = false;
    electronUpdater.autoUpdater.logger = logger;
  }
  /**
   * Bind autoUpdater events to internal handlers
   */
  bindEvents() {
    electronUpdater.autoUpdater.on("checking-for-update", () => {
      this.setStatus({ status: "checking" });
    });
    electronUpdater.autoUpdater.on("update-available", (info) => {
      logger.info(`Update available: v${info.version}`);
      this.setStatus({
        status: "available",
        version: info.version,
        releaseNotes: this.extractReleaseNotes(info)
      });
    });
    electronUpdater.autoUpdater.on("update-not-available", (info) => {
      logger.info(`App is up to date: v${info.version}`);
      this.setStatus({ status: "not-available", version: info.version });
    });
    electronUpdater.autoUpdater.on("download-progress", (progress) => {
      this.setStatus({
        status: "downloading",
        progress: {
          percent: progress.percent,
          bytesPerSecond: progress.bytesPerSecond,
          transferred: progress.transferred,
          total: progress.total
        }
      });
    });
    electronUpdater.autoUpdater.on("update-downloaded", (info) => {
      logger.info(`Update downloaded: v${info.version}`);
      this.setStatus({
        status: "downloaded",
        version: info.version,
        releaseNotes: this.extractReleaseNotes(info)
      });
    });
    electronUpdater.autoUpdater.on("error", (error) => {
      logger.error("Update error:", error);
      this.setStatus({
        status: "error",
        error: error.message
      });
    });
  }
  /**
   * Set the BrowserWindow reference for sending IPC events
   */
  setMainWindow(window) {
    this.mainWindow = window;
  }
  /**
   * Start periodic update checks
   */
  startPeriodicChecks() {
    this.stopPeriodicChecks();
    this.initialTimer = setTimeout(() => {
      this.checkForUpdate().catch(
        (err) => logger.error("Initial update check failed:", err)
      );
    }, UPDATE_CHECK_INITIAL_DELAY_MS);
    this.checkTimer = setInterval(() => {
      this.checkForUpdate().catch(
        (err) => logger.error("Periodic update check failed:", err)
      );
    }, UPDATE_CHECK_INTERVAL_MS);
  }
  /**
   * Stop periodic update checks
   */
  stopPeriodicChecks() {
    if (this.initialTimer) {
      clearTimeout(this.initialTimer);
      this.initialTimer = null;
    }
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }
  /**
   * Manually trigger an update check
   */
  async checkForUpdate() {
    try {
      await electronUpdater.autoUpdater.checkForUpdates();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Check for update failed:", message);
      return { success: false, error: message };
    }
  }
  /**
   * Manually trigger update download (if autoDownload is disabled)
   */
  async downloadUpdate() {
    try {
      await electronUpdater.autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Download update failed:", message);
      return { success: false, error: message };
    }
  }
  /**
   * Quit the app and install the downloaded update
   */
  installUpdate() {
    logger.info("Installing update and restarting...");
    electronUpdater.autoUpdater.quitAndInstall(false, true);
  }
  /**
   * Get current update status
   */
  getStatus() {
    return { ...this.currentStatus };
  }
  /**
   * Clean up timers
   */
  cleanup() {
    this.stopPeriodicChecks();
  }
  /**
   * Update internal status and notify renderer
   */
  setStatus(status) {
    this.currentStatus = status;
    this.sendStatusToRenderer(status);
  }
  /**
   * Send update status to the renderer process
   */
  sendStatusToRenderer(status) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send("update:status", status);
    }
  }
  /**
   * Extract release notes as a string from UpdateInfo
   */
  extractReleaseNotes(info) {
    if (!info.releaseNotes) return void 0;
    if (typeof info.releaseNotes === "string") {
      return info.releaseNotes;
    }
    if (Array.isArray(info.releaseNotes)) {
      return info.releaseNotes.map((rn) => rn.note).join("\n");
    }
    return void 0;
  }
}
class TemplateGenerator {
  static {
    this.PAGE_WIDTH = "80mm";
  }
  static {
    this.CONTENT_WIDTH = "72mm";
  }
  static {
    this.PAGE_HEIGHT_MICRONS = 297e3;
  }
  static {
    this.PAGE_WIDTH_MICRONS = 8e4;
  }
  static generateLogoHTML(logoBase64) {
    if (!logoBase64 || !logoBase64.startsWith("data:image/")) return "";
    return `<div style="text-align: center; margin-bottom: 10px;"><img src="${logoBase64}" style="width: 200px; height: auto;" /></div>`;
  }
  static getCommonStyles() {
    return `
      @page {
        size: ${this.PAGE_WIDTH} auto;
        margin: 0;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html, body {
        width: 80mm;
        height: auto;
        margin: 0;
        padding: 0;
      }
      
      body {
        width: ${this.CONTENT_WIDTH};
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 4mm;
        background: white;
      }

      .header {
        text-align: center;
        font-weight: bold;
        font-size: 18px;
        text-decoration: underline;
        margin-bottom: 5px;
      }

      .branch {
        text-align: center;
        margin-bottom: 10px;
        font-weight: bold;
        font-size: 13px;
      }

      .separator {
        border-bottom: 1px dashed #000;
        margin: 12px 0;
      }

      .info-row {
        margin: 3px 0;
        font-weight: bold;
        font-size: 13px;
      }

      .footer {
        text-align: center;
        margin-top: 15px;
        font-weight: bold;
        font-size: 13px;
      }
    `;
  }
  /**
   * Escape HTML special characters to prevent XSS when rendering user-provided content
   */
  static escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /**
   * Format date in Turkish locale
   */
  static formatDate(date) {
    return date.toLocaleDateString("tr-TR");
  }
  /**
   * Format time in Turkish locale
   */
  static formatTime(date) {
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  /**
   * Generate branch info HTML
   */
  static generateBranchInfo(branchName) {
    return branchName ? `<div class="branch">- ${this.escapeHtml(branchName)} -</div>` : "";
  }
  /**
   * Generate HTML for test receipt
   * Uses the same template as entrance ticket for consistency
   */
  static generateTestHTML(config, logoBase64 = null) {
    const dateStr = this.formatDate(config.timestamp);
    const timeStr = this.formatTime(config.timestamp);
    const testPrice = 200 .toFixed(2);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${this.getCommonStyles()}
          
          .price-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 16px;
            font-weight: bold;
          }

          .test-warning {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            padding: 8px;
            border: 2px solid #000;
            background-color: #f0f0f0;
          }
        </style>
      </head>
      <body>
        ${this.generateLogoHTML(logoBase64)}
        ${this.generateBranchInfo(config.branchName)}
        <div class="separator"></div>
        <div class="test-warning">*** GEÇERSİZDİR ***</div>
        <div class="separator"></div>
        <div class="info-row">Tarih: ${dateStr} ${timeStr}</div>
        <div class="separator"></div>
        <div class="price-row">
          <span>Giriş Ücreti:</span>
          <span>${testPrice} TL</span>
        </div>
        <div class="separator"></div>
        <div class="test-warning">*** TEST FİŞİ ***</div>
        <div class="separator"></div>
        <div class="footer">Bu fiş test amaçlıdır</div>
        <div class="footer">Giriş için geçerli değildir</div>
      </body>
      </html>
    `;
  }
  /**
   * Generate HTML for entrance ticket
   * Uses the original template format for consistency across all platforms
   */
  static generateEntranceTicketHTML(config, logoBase64 = null) {
    const dateStr = this.formatDate(config.timestamp);
    const timeStr = this.formatTime(config.timestamp);
    const price = config.dailyLoginPrice.toFixed(2);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${this.getCommonStyles()}
          
          .price-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 16px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${this.generateLogoHTML(logoBase64)}
        ${this.generateBranchInfo(config.branchName)}
        <div class="separator"></div>
        <div class="info-row">Tarih: ${dateStr} ${timeStr}</div>
        <div class="separator"></div>
        ${config.dailyLoginTypeName ? `<div class="info-row">Giriş Tipi: ${this.escapeHtml(config.dailyLoginTypeName)}</div>` : ""}
        <div class="price-row">
          <span>Giriş Ücreti:</span>
          <span>${price} TL</span>
        </div>
        <div class="separator"></div>
        <div class="footer">Lütfen fişinizi saklayınız</div>
        <div class="footer">İyi günler dileriz!</div>
      </body>
      </html>
    `;
  }
  /**
   * Generate HTML for order ticket
   */
  static generateOrderTicketHTML(ticket, logoBase64 = null) {
    const now = /* @__PURE__ */ new Date();
    const dateStr = this.formatDate(now);
    const timeStr = this.formatTime(now);
    const itemsHTML = ticket.items.map(
      (item) => `
        <div class="item">
          <div class="item-header">
            <span class="quantity">${item.quantity || 1}x</span>
            <span class="name">${this.escapeHtml(item.name || "Ürün")}</span>
          </div>
          <div class="price">${(item.price || 0).toFixed(2)} TL</div>
          ${item.notes ? `<div class="notes">Not: ${this.escapeHtml(item.notes)}</div>` : ""}
        </div>
      `
    ).join("");
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${this.getCommonStyles()}
          
          .item {
            margin: 8px 0;
          }

          .item-header {
            display: flex;
            justify-content: space-between;
          }

          .quantity {
            font-weight: bold;
            margin-right: 5px;
          }

          .name {
            flex: 1;
          }

          .price {
            text-align: right;
            margin-left: 10px;
          }

          .notes {
            font-size: 10px;
            font-style: italic;
            margin-left: 20px;
            margin-top: 2px;
          }

          .total {
            font-size: 14px;
            font-weight: bold;
            text-align: right;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        ${this.generateLogoHTML(logoBase64)}
        ${this.generateBranchInfo(ticket.branchName || "")}
        <div class="separator"></div>
        <div class="info-row">Tarih: ${dateStr} ${timeStr}</div>
        <div class="separator"></div>
        <div class="info-row">Sipariş No: ${this.escapeHtml(String(ticket.orderId))}</div>
        <div class="separator"></div>
        ${itemsHTML}
        <div class="separator"></div>
        <div class="total">TOPLAM: ${ticket.total.toFixed(2)} TL</div>
        <div class="footer">Afiyet Olsun!</div>
      </body>
      </html>
    `;
  }
  /**
   * Get print options for thermal printer
   * Optimized for 80mm thermal printers across all platforms
   */
  static getPrintOptions(deviceName) {
    const platform = process.platform;
    const baseOptions = {
      silent: true,
      deviceName,
      printBackground: true,
      margins: {
        marginType: "none"
      },
      dpi: {
        horizontal: 203,
        vertical: 203
      }
    };
    if (platform === "darwin") {
      return {
        ...baseOptions,
        printBackground: true,
        pageSize: {
          width: this.PAGE_WIDTH_MICRONS,
          height: 2e5
          // Shorter height for receipt (200mm instead of 297mm)
        }
      };
    } else if (platform === "win32") {
      return {
        ...baseOptions,
        pageSize: {
          width: this.PAGE_WIDTH_MICRONS,
          height: this.PAGE_HEIGHT_MICRONS
        }
      };
    } else {
      return {
        ...baseOptions,
        pageSize: {
          width: this.PAGE_WIDTH_MICRONS,
          height: this.PAGE_HEIGHT_MICRONS
        }
      };
    }
  }
  /**
   * Generate HTML for table check (adisyon) receipt
   */
  static generateTableCheckHTML(data, logoBase64 = null) {
    const ordersHTML = data.orders.map((order, idx) => {
      const time = new Date(order.createdAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit"
      });
      const productsHTML = order.products.map(
        (p) => `
            <div class="item">
              <div class="item-header">
                <span class="quantity">${p.quantity}x</span>
                <span class="name">${this.escapeHtml(p.name)}</span>
              </div>
              <div class="price">${p.lineTotal.toFixed(2)} TL</div>
              ${p.selections?.length ? `<div class="notes">${p.selections.map((s) => this.escapeHtml(s)).join(", ")}</div>` : ""}
            </div>
          `
      ).join("");
      return `
          <div class="round-header">Sipariş #${idx + 1} (${time})</div>
          ${productsHTML}
        `;
    }).join('<div class="separator"></div>');
    const paymentLabel = this.escapeHtml(data.paymentType);
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${this.getCommonStyles()}

          .item {
            margin: 4px 0;
          }

          .item-header {
            display: flex;
            justify-content: space-between;
          }

          .quantity {
            font-weight: bold;
            margin-right: 5px;
          }

          .name {
            flex: 1;
          }

          .price {
            text-align: right;
            margin-left: 10px;
            font-weight: bold;
          }

          .notes {
            font-size: 10px;
            font-style: italic;
            margin-left: 20px;
            margin-top: 2px;
          }

          .round-header {
            font-weight: bold;
            font-size: 11px;
            margin: 8px 0 4px 0;
          }

          .total-section {
            margin-top: 8px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 13px;
          }

          .grand-total {
            font-size: 16px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        ${this.generateLogoHTML(logoBase64)}
        <div class="branch">- ${this.escapeHtml(data.branchName)} -</div>
        <div class="separator"></div>
        <div class="info-row">Masa: ${this.escapeHtml(data.tableLabel)} — ${this.escapeHtml(data.floorPlanName)}</div>
        <div class="info-row">Adisyon: ${this.escapeHtml(data.checkNumber)}</div>
        <div class="info-row">Tarih: ${new Date(data.closedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${new Date(data.closedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</div>
        <div class="info-row">Garson: ${this.escapeHtml(data.employeeName)}</div>
        <div class="info-row">Kişi: ${data.guestCount}</div>
        <div class="separator"></div>
        ${ordersHTML}
        <div class="separator"></div>
        <div class="total-section">
          <div class="total-row">
            <span>Ara Toplam:</span>
            <span>${data.subtotal.toFixed(2)} TL</span>
          </div>
          ${data.discountTotal > 0 ? `<div class="total-row"><span>İndirim:</span><span>-${data.discountTotal.toFixed(2)} TL</span></div>` : ""}
          <div class="total-row grand-total">
            <span>TOPLAM:</span>
            <span>${data.grandTotal.toFixed(2)} TL</span>
          </div>
        </div>
        <div class="separator"></div>
        <div class="info-row">Ödeme: ${paymentLabel}</div>
        <div class="separator"></div>
        <div class="footer">Bizi tercih ettiğiniz için</div>
        <div class="footer">teşekkür ederiz!</div>
      </body>
      </html>
    `;
  }
}
class WindowsPrinterAdapter {
  constructor(printerName) {
    this.printWindow = null;
    this.printerName = printerName;
  }
  static {
    this.PRINT_DELAY_MS = 500;
  }
  /**
   * Initialize printer by creating a hidden BrowserWindow
   */
  async initialize() {
    try {
      logger.info(`Initializing printer: ${this.printerName}`);
      this.printWindow = new electron.BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      });
      logger.info(`Printer "${this.printerName}" initialized successfully`);
    } catch (error) {
      logger.error("Failed to initialize printer:", error);
      throw new Error(
        `Yazıcı başlatılamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
      );
    }
  }
  /**
   * Print a test receipt
   */
  async printTest(companyName = "Fundra Desktop", branchName = "", logoBase64) {
    this.ensureInitialized();
    try {
      logger.info("Printing test receipt");
      const config = {
        companyName,
        branchName,
        timestamp: /* @__PURE__ */ new Date(),
        logoBase64
      };
      const html = TemplateGenerator.generateTestHTML(config, logoBase64 ?? null);
      await this.executePrint(html, "Test print");
      logger.info("Test print successful");
    } catch (error) {
      logger.error("Test print failed:", error);
      throw error;
    }
  }
  /**
   * Print an entrance ticket with dynamic pricing (called from WebSocket when mobile/POS triggers)
   */
  async printEntranceTicket(companyName = "Fundra Desktop", branchName = "", dailyLoginPrice = 200, dailyLoginTypeName, logoBase64) {
    this.ensureInitialized();
    try {
      logger.info(
        `Printing entrance ticket with price: ${dailyLoginPrice} TL${dailyLoginTypeName ? ` (${dailyLoginTypeName})` : ""}`
      );
      const config = {
        companyName,
        branchName,
        timestamp: /* @__PURE__ */ new Date(),
        dailyLoginPrice,
        dailyLoginTypeName,
        logoBase64
      };
      const html = TemplateGenerator.generateEntranceTicketHTML(config, logoBase64 ?? null);
      await this.executePrint(html, "Entrance ticket");
      logger.info("Entrance ticket print successful");
    } catch (error) {
      logger.error("Entrance ticket print failed:", error);
      throw error;
    }
  }
  /**
   * Print order ticket
   */
  async print(ticket) {
    this.ensureInitialized();
    try {
      logger.info(`Printing ticket ${ticket.id} for order ${ticket.orderId}`);
      const html = TemplateGenerator.generateOrderTicketHTML(ticket, ticket.logoBase64 ?? null);
      await this.executePrint(html, `Ticket ${ticket.id}`);
      logger.info(`Successfully printed ticket ${ticket.id}`);
    } catch (error) {
      logger.error(`Failed to print ticket ${ticket.id}:`, error);
      throw new Error(
        `Yazdırma başarısız: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
      );
    }
  }
  /**
   * Print table check (adisyon) receipt
   */
  async printTableCheck(data) {
    this.ensureInitialized();
    try {
      logger.info(`Printing table check for table ${data.tableLabel}`);
      const html = TemplateGenerator.generateTableCheckHTML(data, data.logoBase64 ?? null);
      await this.executePrint(html, `Table check ${data.checkNumber}`);
      logger.info(`Successfully printed table check ${data.checkNumber}`);
    } catch (error) {
      logger.error(`Failed to print table check ${data.checkNumber}:`, error);
      throw error;
    }
  }
  /**
   * Close printer connection
   */
  async close() {
    try {
      if (this.printWindow) {
        this.printWindow.close();
        this.printWindow = null;
        logger.info(`Printer "${this.printerName}" closed`);
      }
    } catch (error) {
      logger.error("Error closing printer:", error);
    }
  }
  /**
   * Execute print operation with given HTML content
   * @private
   */
  async executePrint(html, description) {
    if (!this.printWindow) {
      throw new Error("Yazıcı başlatılmadı");
    }
    try {
      if (process.platform === "darwin") {
        const fs2 = require("fs");
        const path2 = require("path");
        const os2 = require("os");
        const tempDir = os2.tmpdir();
        const tempFile = path2.join(tempDir, `print-${Date.now()}.html`);
        fs2.writeFileSync(tempFile, html, "utf8");
        await this.printWindow.loadFile(tempFile);
        setTimeout(() => {
          try {
            fs2.unlinkSync(tempFile);
          } catch (err) {
            logger.warn("Failed to clean up temp file:", err);
          }
        }, 5e3);
      } else {
        await this.printWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
        );
      }
      await this.delay(WindowsPrinterAdapter.PRINT_DELAY_MS);
      const printOptions = TemplateGenerator.getPrintOptions(this.printerName);
      return new Promise((resolve, reject) => {
        this.printWindow.webContents.print(
          printOptions,
          (success, errorType) => {
            if (success) {
              logger.info(`${description} printed successfully`);
              resolve();
            } else {
              logger.error(`${description} print failed: ${errorType}`);
              reject(new Error(`Yazdırma başarısız: ${errorType}`));
            }
          }
        );
      });
    } catch (error) {
      logger.error(`${description} print failed:`, error);
      throw error;
    }
  }
  /**
   * Ensure printer is initialized before printing
   * @private
   */
  ensureInitialized() {
    if (!this.printWindow) {
      throw new Error(
        "Yazıcı başlatılmadı. Lütfen önce initialize() metodunu çağırın."
      );
    }
  }
  /**
   * Delay utility
   * @private
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
class ThermalPrinter {
  constructor(printerName) {
    this.printer = null;
    this.printerName = printerName;
    this.platform = os__namespace.platform();
  }
  /**
   * Initialize printer connection
   * Uses HTML-based printing on all platforms for better Turkish character support
   */
  async initialize() {
    try {
      logger.info(
        `Initializing thermal printer for platform: ${this.platform}`
      );
      this.printer = new WindowsPrinterAdapter(this.printerName);
      await this.printer.initialize();
      logger.info(
        `Thermal printer "${this.printerName}" initialized successfully (HTML mode)`
      );
    } catch (error) {
      logger.error("Failed to initialize thermal printer:", error);
      throw new Error(
        `Yazıcı başlatılamadı: ${error instanceof Error ? error.message : "Bilinmeyen hata"}`
      );
    }
  }
  /**
   * Print ticket using the initialized printer adapter
   */
  async print(ticket) {
    this.ensurePrinterInitialized();
    return this.printer.print(ticket);
  }
  /**
   * Print test receipt
   */
  async printTest(companyName = "Fundra Desktop", branchName = "", logoBase64) {
    this.ensurePrinterInitialized();
    return this.printer.printTest(companyName, branchName, logoBase64);
  }
  /**
   * Print entrance ticket with dynamic pricing (called from WebSocket when mobile/POS triggers)
   */
  async printEntranceTicket(companyName = "Fundra Desktop", branchName = "", dailyLoginPrice = 200, dailyLoginTypeName, logoBase64) {
    this.ensurePrinterInitialized();
    return this.printer.printEntranceTicket(
      companyName,
      branchName,
      dailyLoginPrice,
      dailyLoginTypeName,
      logoBase64
    );
  }
  /**
   * Print table check (adisyon) receipt
   */
  async printTableCheck(data) {
    this.ensurePrinterInitialized();
    return this.printer.printTableCheck(data);
  }
  /**
   * Get printer status
   */
  async getStatus() {
    try {
      const connected = this.printer !== null;
      return {
        name: this.printerName,
        available: connected
      };
    } catch (error) {
      logger.error("Error getting printer status:", error);
      return {
        name: this.printerName,
        available: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Close printer connection
   */
  async close() {
    try {
      if (this.printer) {
        await this.printer.close();
        this.printer = null;
        logger.info(`Thermal printer "${this.printerName}" closed`);
      }
    } catch (error) {
      logger.error("Error closing printer:", error);
    }
  }
  /**
   * Ensure printer is initialized before operations
   * @private
   */
  ensurePrinterInitialized() {
    if (!this.printer) {
      throw new Error(
        "Yazıcı başlatılmadı. Lütfen önce initialize() metodunu çağırın."
      );
    }
  }
}
class PrintQueueService {
  constructor(config) {
    this.queue = [];
    this.isProcessing = false;
    this.config = {
      ...PrintQueueService.DEFAULT_CONFIG,
      ...config
    };
  }
  static {
    this.DEFAULT_CONFIG = {
      delayBetweenJobs: 500,
      maxRetries: 3,
      retryDelay: 1e3
    };
  }
  /**
   * Add a print job to the queue
   */
  async addJob(jobFunction, description) {
    const job = {
      id: this.generateJobId(),
      execute: jobFunction,
      description,
      retries: 0
    };
    this.queue.push(job);
    logger.info(`Print job added to queue: ${job.description} (ID: ${job.id})`);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }
  /**
   * Add multiple entrance ticket print jobs to the queue
   */
  async addEntranceTicketJobs(printFunction, quantity) {
    logger.info(`Adding ${quantity} entrance ticket jobs to queue`);
    const jobs = Array.from({ length: quantity }, (_, index) => ({
      id: this.generateJobId(),
      execute: printFunction,
      description: `Entrance ticket ${index + 1}/${quantity}`,
      retries: 0
    }));
    this.queue.push(...jobs);
    logger.info(`Added ${quantity} entrance ticket jobs to queue`);
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }
  /**
   * Process the print queue
   * @private
   */
  async processQueue() {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;
    logger.info("Started processing print queue");
    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;
      try {
        logger.info(`Processing print job: ${job.description}`);
        await job.execute();
        logger.info(`Successfully completed: ${job.description}`);
        if (this.queue.length > 0) {
          await this.delay(this.config.delayBetweenJobs);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Print job failed: ${job.description}`, err);
        await this.handleFailedJob(job, err);
      }
    }
    this.isProcessing = false;
    logger.info("Finished processing print queue");
  }
  /**
   * Handle a failed print job with retry logic
   * @private
   */
  async handleFailedJob(job, error) {
    job.retries++;
    if (job.retries < this.config.maxRetries) {
      logger.warn(
        `Retrying print job: ${job.description} (Attempt ${job.retries + 1}/${this.config.maxRetries})`
      );
      await this.delay(this.config.retryDelay);
      this.queue.unshift(job);
    } else {
      logger.error(
        `Print job failed after ${this.config.maxRetries} retries: ${job.description}`,
        error
      );
    }
  }
  /**
   * Get current queue size
   */
  getQueueSize() {
    return this.queue.length;
  }
  /**
   * Check if queue is currently processing
   */
  isQueueProcessing() {
    return this.isProcessing;
  }
  /**
   * Clear all pending jobs in the queue
   */
  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue = [];
    logger.info(`Cleared ${clearedCount} jobs from print queue`);
  }
  /**
   * Generate unique job ID
   * @private
   */
  generateJobId() {
    return `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Delay utility
   * @private
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
class ProfileService {
  constructor(deps) {
    this.configManager = deps.configManager;
    this.apiClient = deps.apiClient;
  }
  async loadAndSyncProfile() {
    try {
      const profileResponse = await this.apiClient.get(USER_PROFILE);
      const profile = profileResponse.data;
      if (profile.name) this.configManager.set("name", profile.name);
      if (profile.surname) this.configManager.set("surname", profile.surname);
      if (profile.role) this.configManager.set("role", profile.role);
      if (profile.email) this.configManager.set("email", profile.email);
      if (profile.username)
        this.configManager.set("username", profile.username);
      if (profile.company?.name) {
        this.configManager.set("companyName", profile.company.name);
      }
      if (profile.company?.id) {
        this.configManager.set("companyId", profile.company.id);
      }
      if (profile.userBranches && profile.userBranches.length > 0) {
        const activeBranch = profile.userBranches.find((ub) => ub.isActive) || profile.userBranches[0];
        if (activeBranch?.branch) {
          this.configManager.set("branchName", activeBranch.branch.name);
          this.configManager.set("branchId", activeBranch.branch.id);
        }
      }
      logger.info("User profile loaded successfully");
    } catch (profileError) {
      logger.error("Failed to load user profile:", profileError);
      throw profileError;
    }
  }
}
const execAsync = util.promisify(child_process.exec);
class PrinterDiscoveryService {
  async getAvailablePrinters() {
    try {
      let printers = [];
      if (process.platform === "win32") {
        const { stdout } = await execAsync("wmic printer get name");
        printers = stdout.split("\n").slice(1).map((line) => line.trim()).filter((line) => line.length > 0);
      } else if (process.platform === "darwin") {
        try {
          const { stdout } = await execAsync(
            "lpstat -p 2>/dev/null || echo ''"
          );
          printers = stdout.split("\n").filter((line) => line.trim().length > 0).map((line) => {
            const englishMatch = line.match(/^printer\s+(\S+)/i);
            if (englishMatch) {
              return englishMatch[1];
            }
            const turkishMatch = line.match(/^(\S+)\s+yazıcısı/i);
            if (turkishMatch) {
              return turkishMatch[1];
            }
            const genericMatch = line.match(/^(\S+)\s+/);
            if (genericMatch && !line.includes("No destination") && !line.includes("destination")) {
              return genericMatch[1];
            }
            return "";
          }).filter((name) => name.length > 0);
        } catch {
          logger.info("No printers found on macOS");
          return [];
        }
      } else {
        const { stdout } = await execAsync("lpstat -p -d");
        printers = stdout.split("\n").filter((line) => line.startsWith("printer")).map((line) => line.split(" ")[1]);
      }
      return printers;
    } catch {
      logger.info("No printers available or error getting printers");
      return [];
    }
  }
}
let cachedLogoBase64;
function loadBundledLogo() {
  if (cachedLogoBase64 !== void 0) return cachedLogoBase64;
  try {
    const logoPath = path__namespace.join(electron.app.getAppPath(), "assets", "receipt-logo.png");
    if (fs__namespace.existsSync(logoPath)) {
      const buffer = fs__namespace.readFileSync(logoPath);
      cachedLogoBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
    } else {
      cachedLogoBase64 = null;
    }
  } catch {
    cachedLogoBase64 = null;
  }
  return cachedLogoBase64;
}
function resolveLogoForReceipt(configManager, receiptType) {
  const logoConfig = configManager.get("receiptLogoConfig");
  if (!logoConfig || !logoConfig[receiptType]) {
    return null;
  }
  return loadBundledLogo();
}
function registerAuthHandlers(ipcMain, deps) {
  ipcMain.handle("auth:login", async (_event, data) => {
    try {
      const { userLoginData, password, autoLaunch } = data;
      const result = await deps.authService.login({
        userLoginData,
        password
      });
      const isFirstRun = deps.configManager.get("isFirstRun");
      if (isFirstRun !== false && autoLaunch) {
        await deps.autoLaunchManager.enable();
        deps.configManager.set("autoLaunchEnabled", true);
      }
      if (isFirstRun !== false) {
        deps.configManager.set("isFirstRun", false);
      }
      try {
        await deps.profileService.loadAndSyncProfile();
      } catch (profileError) {
        logger.error("Failed to load user profile:", profileError);
      }
      await deps.onLoginSuccess();
      return { success: true, data: result };
    } catch (error) {
      logger.error("Login error:", error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("auth:logout", async () => {
    try {
      await deps.onLogout();
      return { success: true };
    } catch (error) {
      logger.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("auth:check-status", () => {
    return deps.authService.isAuthenticated() && deps.wsClient.isConnected();
  });
}
function registerPrinterHandlers(ipcMain, deps) {
  ipcMain.handle("printer:get-list", async () => {
    try {
      const printers = await deps.printerDiscoveryService.getAvailablePrinters();
      return printers;
    } catch (error) {
      logger.error("Error getting printers:", error);
      return [];
    }
  });
  ipcMain.handle("printer:set", async (_event, { printerName }) => {
    try {
      deps.configManager.set("printerName", printerName);
      await deps.onInitializePrinter();
      return { success: true };
    } catch (error) {
      logger.error("Error setting printer:", error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("printer:get-current", () => {
    return {
      name: deps.configManager.get("printerName")
    };
  });
  ipcMain.handle("printer:test-print", async () => {
    try {
      if (!deps.hasPrinter()) {
        return { success: false, error: "Yazıcı yapılandırılmadı" };
      }
      await deps.onPrintTestReceipt();
      return { success: true };
    } catch (error) {
      logger.error("Test print error:", error);
      return { success: false, error: error.message };
    }
  });
}
function registerSettingsHandlers(ipcMain, deps) {
  ipcMain.handle("settings:get", () => {
    const config = deps.configManager.getConfig();
    const userInfo = deps.authService.getUserInfo();
    return {
      ...config,
      ...userInfo
    };
  });
  ipcMain.handle("settings:save", async (_event, settings) => {
    try {
      deps.configManager.update(settings);
      if (settings.apiUrl && deps.authService.isAuthenticated()) {
        deps.wsClient.disconnect();
        await deps.wsClient.connect();
      }
      return { success: true };
    } catch (error) {
      logger.error("Error saving settings:", error);
      return { success: false, error: error.message };
    }
  });
}
function registerAppHandlers(ipcMain) {
  ipcMain.handle("app:get-version", () => {
    return electron.app.getVersion();
  });
  ipcMain.handle(
    "app:log",
    (_event, level, ...args) => {
      logger[level](...args);
    }
  );
}
function registerWindowHandlers(ipcMain, deps) {
  ipcMain.on("window:open-settings", () => {
    deps.onOpenSettings();
  });
  ipcMain.on("window:back-to-main", () => {
    deps.onBackToMain();
  });
  ipcMain.on("window:minimize", (event) => {
    const window = electron.BrowserWindow.fromWebContents(event.sender);
    if (window) window.minimize();
  });
  ipcMain.on("window:close", (event) => {
    const window = electron.BrowserWindow.fromWebContents(event.sender);
    if (window) window.close();
  });
}
function registerUpdateHandlers(ipcMain, deps) {
  const { updateManager } = deps;
  ipcMain.handle("update:check", async () => {
    return updateManager.checkForUpdate();
  });
  ipcMain.handle("update:download", async () => {
    return updateManager.downloadUpdate();
  });
  ipcMain.handle("update:install", () => {
    updateManager.installUpdate();
  });
  ipcMain.handle("update:get-status", () => {
    return updateManager.getStatus();
  });
}
class FundraDesktop {
  constructor() {
    this.mainWindow = null;
    this.settingsWindow = null;
    this.printer = null;
    this.printQueue = null;
    this.configManager = new ConfigManager();
    this.apiClient = createApiClient(this.configManager);
    const publicApiClient = createPublicApiClient(this.configManager);
    this.authService = new AuthService({
      configManager: this.configManager,
      apiClient: this.apiClient,
      publicApiClient
    });
    this.wsClient = new WebSocketClient(this.configManager, async () => {
      try {
        await this.authService.refreshAccessToken();
        return true;
      } catch {
        return false;
      }
    });
    this.autoLaunchManager = new AutoLaunchManager();
    this.profileService = new ProfileService({
      configManager: this.configManager,
      apiClient: this.apiClient
    });
    this.printerDiscoveryService = new PrinterDiscoveryService();
    this.updateManager = new UpdateManager();
    this.printQueueService = new PrintQueueService({
      delayBetweenJobs: PRINT_QUEUE_DELAY_BETWEEN_JOBS_MS,
      maxRetries: PRINT_QUEUE_MAX_RETRIES,
      retryDelay: PRINT_QUEUE_RETRY_DELAY_MS
    });
    this.setupIpcHandlers();
  }
  /**
   * Initialize the application
   */
  async initialize() {
    logger.info("Initializing Fundra Desktop...");
    this.createMainWindow();
    this.updateManager.setMainWindow(this.mainWindow);
    this.updateManager.startPeriodicChecks();
    if (this.authService.isAuthenticated()) {
      const isValid = await this.authService.verifyToken();
      if (isValid) {
        try {
          await this.profileService.loadAndSyncProfile();
        } catch (profileError) {
          logger.error("Failed to load user profile:", profileError);
        }
        await this.initializePrinter();
        this.setupWebSocketHandlers();
        try {
          await this.wsClient.connect();
          this.loadMainPage();
        } catch (error) {
          logger.error("Failed to connect to WebSocket:", error);
          electron.dialog.showErrorBox("Bağlantı Hatası", "Sunucuya bağlanılamadı");
          this.loadMainPage();
        }
      } else {
        this.loadLoginPage();
      }
    } else {
      this.loadLoginPage();
    }
    logger.info("Fundra Desktop initialized");
  }
  /**
   * Setup IPC handlers for renderer process communication
   */
  setupIpcHandlers() {
    registerAuthHandlers(electron.ipcMain, {
      authService: this.authService,
      configManager: this.configManager,
      autoLaunchManager: this.autoLaunchManager,
      profileService: this.profileService,
      wsClient: this.wsClient,
      onLoginSuccess: async () => {
        await this.initializePrinter();
        this.setupWebSocketHandlers();
        await this.wsClient.connect();
        this.loadMainPage();
      },
      onLogout: async () => {
        this.wsClient.disconnect();
        if (this.printer) {
          await this.printer.close();
          this.printer = null;
          this.printQueue = null;
        }
        await this.authService.logout();
        if (this.settingsWindow) {
          this.settingsWindow.close();
          this.settingsWindow = null;
        }
        this.loadLoginPage();
      }
    });
    registerPrinterHandlers(electron.ipcMain, {
      configManager: this.configManager,
      printerDiscoveryService: this.printerDiscoveryService,
      hasPrinter: () => this.printer !== null,
      onInitializePrinter: () => this.initializePrinter(),
      onPrintTestReceipt: () => this.printTestReceipt()
    });
    registerSettingsHandlers(electron.ipcMain, {
      configManager: this.configManager,
      authService: this.authService,
      wsClient: this.wsClient
    });
    registerAppHandlers(electron.ipcMain);
    registerWindowHandlers(electron.ipcMain, {
      onOpenSettings: () => this.loadSettingsPage(),
      onBackToMain: () => this.loadMainPage()
    });
    registerUpdateHandlers(electron.ipcMain, {
      updateManager: this.updateManager
    });
  }
  /**
   * Create main window (called once at startup)
   */
  createMainWindow() {
    if (this.mainWindow) {
      return;
    }
    const isDev = process.env.NODE_ENV === "development" || !electron.app.isPackaged;
    const preloadPath = path__namespace.join(__dirname, "../preload/index.js");
    this.mainWindow = new electron.BrowserWindow({
      width: MAIN_WINDOW_WIDTH,
      height: MAIN_WINDOW_HEIGHT,
      minWidth: MAIN_WINDOW_MIN_WIDTH,
      minHeight: MAIN_WINDOW_MIN_HEIGHT,
      frame: false,
      show: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true
      }
    });
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow?.show();
    });
    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https:") || url.startsWith("http:")) {
        electron.shell.openExternal(url);
      }
      return { action: "deny" };
    });
    if (isDev) {
      this.mainWindow.webContents.openDevTools();
    }
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
      electron.app.quit();
    });
  }
  getRendererUrl(page) {
    const base = process.env.ELECTRON_RENDERER_URL;
    if (base) {
      return `${base}/${page}.html`;
    }
    return path__namespace.join(__dirname, "../renderer", `${page}.html`).replace(/\\/g, "/");
  }
  loadLoginPage() {
    if (!this.mainWindow) {
      logger.error("Main window not created yet");
      return;
    }
    const url = this.getRendererUrl("login");
    if (process.env.ELECTRON_RENDERER_URL) {
      this.mainWindow.loadURL(url);
    } else {
      this.mainWindow.loadFile(path__namespace.join(__dirname, "../renderer/login.html"));
    }
  }
  loadMainPage() {
    if (!this.mainWindow) {
      logger.error("Main window not created yet");
      return;
    }
    if (process.env.ELECTRON_RENDERER_URL) {
      this.mainWindow.loadURL(this.getRendererUrl("main"));
    } else {
      this.mainWindow.loadFile(path__namespace.join(__dirname, "../renderer/main.html"));
    }
    this.mainWindow.webContents.once("did-finish-load", () => {
      const sendConnectionStatus = () => {
        const connected = this.authService.isAuthenticated() && this.wsClient.isConnected();
        this.mainWindow?.webContents.send("connection:status", { connected });
      };
      sendConnectionStatus();
      setTimeout(sendConnectionStatus, 300);
    });
  }
  loadSettingsPage() {
    if (!this.mainWindow) {
      logger.error("Main window not created yet");
      return;
    }
    if (process.env.ELECTRON_RENDERER_URL) {
      this.mainWindow.loadURL(this.getRendererUrl("settings"));
    } else {
      this.mainWindow.loadFile(
        path__namespace.join(__dirname, "../renderer/settings.html")
      );
    }
  }
  showSettingsWindow() {
    if (this.settingsWindow) {
      this.settingsWindow.focus();
      return;
    }
    const preloadPath = path__namespace.join(__dirname, "../preload/index.js");
    this.settingsWindow = new electron.BrowserWindow({
      width: 600,
      height: 700,
      resizable: false,
      frame: false,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true
      }
    });
    this.settingsWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith("https:") || url.startsWith("http:")) {
        electron.shell.openExternal(url);
      }
      return { action: "deny" };
    });
    if (process.env.ELECTRON_RENDERER_URL) {
      this.settingsWindow.loadURL(
        `${process.env.ELECTRON_RENDERER_URL}/settings.html`
      );
    } else {
      this.settingsWindow.loadFile(
        path__namespace.join(__dirname, "../renderer/settings.html")
      );
    }
    if (process.env.NODE_ENV === "development" || !electron.app.isPackaged) {
      this.settingsWindow.webContents.openDevTools();
    }
    this.settingsWindow.on("closed", () => {
      this.settingsWindow = null;
    });
  }
  /**
   * Initialize printer based on configuration
   */
  async initializePrinter() {
    const printerName = this.configManager.get("printerName");
    if (!printerName) {
      logger.warn("No printer configured");
      return;
    }
    try {
      if (this.printer) {
        await this.printer.close();
      }
      this.printer = new ThermalPrinter(printerName);
      logger.info(`Initializing thermal printer: ${printerName}`);
      await this.printer.initialize();
      this.printQueue = new PrintQueue({
        printer: this.printer,
        configManager: this.configManager,
        apiClient: this.apiClient
      });
      logger.info(`Printer initialized successfully: ${printerName}`);
    } catch (error) {
      logger.error("Failed to initialize printer:", error);
      const message = error instanceof Error ? error.message : String(error);
      electron.dialog.showErrorBox("Yazıcı Hatası", `Yazıcı başlatılamadı: ${message}`);
    }
  }
  /**
   * Setup WebSocket message handlers
   */
  setupWebSocketHandlers() {
    this.wsClient.on("printTicket", async (ticket) => {
      if (!this.printQueue) {
        logger.error("Print queue not initialized");
        return;
      }
      try {
        const logoBase64 = resolveLogoForReceipt(
          this.configManager,
          "orderTicket"
        );
        await this.printQueue.addTicket({ ...ticket, logoBase64 });
        logger.info(`Printing order #${ticket.orderId}`);
      } catch (error) {
        logger.error("Error processing print ticket:", error);
      }
    });
    this.wsClient.on(
      "printEntranceTicket",
      async (payload) => {
        logger.info(
          `Received entrance ticket print request, quantity: ${payload.quantity}, price: ${payload.dailyLoginPrice} TL${payload.dailyLoginTypeName ? ` (${payload.dailyLoginTypeName})` : ""}`
        );
        if (!this.printer) {
          logger.error("Printer not initialized");
          return;
        }
        try {
          const companyName = this.configManager.get("companyName") || "Fundra Desktop";
          const branchName = this.configManager.get("branchName") || "";
          const dailyLoginPrice = payload.dailyLoginPrice ?? 200;
          const dailyLoginTypeName = payload.dailyLoginTypeName;
          const logoBase64 = resolveLogoForReceipt(
            this.configManager,
            "entranceTicket"
          );
          await this.printQueueService.addEntranceTicketJobs(
            () => this.printer.printEntranceTicket(
              companyName,
              branchName,
              dailyLoginPrice,
              dailyLoginTypeName,
              logoBase64
            ),
            payload.quantity
          );
          logger.info(
            `Successfully queued ${payload.quantity} entrance ticket(s) for printing at ${dailyLoginPrice} TL each${dailyLoginTypeName ? ` (${dailyLoginTypeName})` : ""}`
          );
        } catch (error) {
          logger.error("Error printing entrance ticket:", error);
        }
      }
    );
    this.wsClient.on("printTableCheck", async (data) => {
      logger.info(
        `Received table check print request for table ${data.tableLabel}, check ${data.checkNumber}`
      );
      if (!this.printer) {
        logger.error("Printer not initialized");
        return;
      }
      try {
        const logoBase64 = resolveLogoForReceipt(
          this.configManager,
          "tableCheck"
        );
        const dataWithLogo = { ...data, logoBase64 };
        await this.printQueueService.addJob(
          () => this.printer.printTableCheck(dataWithLogo),
          `table-check-${data.checkNumber}`
        );
        logger.info(
          `Successfully queued table check ${data.checkNumber} for printing`
        );
      } catch (error) {
        logger.error("Error printing table check:", error);
      }
    });
    this.wsClient.onConnect(() => {
      logger.info("WebSocket connected");
      if (this.mainWindow) {
        this.mainWindow.webContents.send("connection:status", {
          connected: true
        });
      }
    });
    this.wsClient.onDisconnect(() => {
      logger.info("WebSocket disconnected");
      if (this.mainWindow) {
        this.mainWindow.webContents.send("connection:status", {
          connected: false
        });
      }
    });
  }
  /**
   * Print test receipt (for testing only - shows "GEÇERSİZDİR")
   */
  async printTestReceipt() {
    if (!this.printer) {
      throw new Error("Yazıcı başlatılmadı");
    }
    const companyName = this.configManager.get("companyName") || "Fundra Desktop";
    const branchName = this.configManager.get("branchName") || "";
    const logoBase64 = resolveLogoForReceipt(this.configManager, "testPrint");
    await this.printer.printTest(companyName, branchName, logoBase64);
  }
  getMainWindow() {
    return this.mainWindow;
  }
  /**
   * Cleanup resources (called on before-quit)
   */
  cleanup() {
    logger.info("Cleaning up...");
    this.updateManager.cleanup();
    if (this.wsClient) {
      this.wsClient.disconnect();
    }
    if (this.printer) {
      this.printer.close().catch((err) => logger.error("Error closing printer:", err));
    }
    if (this.mainWindow) {
      this.mainWindow.close();
    }
    if (this.settingsWindow) {
      this.settingsWindow.close();
    }
  }
}
let appInstance = null;
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  logger.info("Another instance is already running. Quitting...");
  electron.app.quit();
} else {
  electron.app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
    logger.info("Second instance detected, focusing main window...");
    const mainWindow = appInstance?.getMainWindow();
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
      mainWindow.show();
    }
  });
  electron.app.on("ready", async () => {
    try {
      appInstance = new FundraDesktop();
      await appInstance.initialize();
    } catch (error) {
      logger.error("Failed to initialize application:", error);
      electron.app.quit();
    }
  });
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("before-quit", () => {
  if (appInstance) {
    appInstance.cleanup();
  }
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
});
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
});
