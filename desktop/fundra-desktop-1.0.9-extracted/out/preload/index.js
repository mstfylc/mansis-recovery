"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  login: (credentials) => electron.ipcRenderer.invoke("auth:login", credentials),
  logout: () => electron.ipcRenderer.invoke("auth:logout"),
  checkAuthStatus: () => electron.ipcRenderer.invoke("auth:check-status"),
  getPrinters: () => electron.ipcRenderer.invoke("printer:get-list"),
  setPrinter: (printerName) => electron.ipcRenderer.invoke("printer:set", { printerName }),
  getCurrentPrinter: () => electron.ipcRenderer.invoke("printer:get-current"),
  testPrint: () => electron.ipcRenderer.invoke("printer:test-print"),
  getSettings: () => electron.ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("settings:save", settings),
  getAppVersion: () => electron.ipcRenderer.invoke("app:get-version"),
  log: (level, ...messages) => {
    const serialized = messages.map((m) => {
      if (m instanceof Error) return m.message;
      if (typeof m === "object" && m !== null) {
        try {
          return JSON.stringify(m);
        } catch {
          return String(m);
        }
      }
      return String(m);
    });
    return electron.ipcRenderer.invoke("app:log", level, ...serialized);
  },
  minimizeWindow: () => electron.ipcRenderer.send("window:minimize"),
  closeWindow: () => electron.ipcRenderer.send("window:close"),
  openSettings: () => electron.ipcRenderer.send("window:open-settings"),
  backToMain: () => electron.ipcRenderer.send("window:back-to-main"),
  onLoginSuccess: (callback) => {
    electron.ipcRenderer.on("auth:login-success", callback);
    return () => electron.ipcRenderer.removeListener("auth:login-success", callback);
  },
  onLoginError: (callback) => {
    const handler = (_event, error) => callback(error);
    electron.ipcRenderer.on("auth:login-error", handler);
    return () => electron.ipcRenderer.removeListener("auth:login-error", handler);
  },
  onPrintStatus: (callback) => {
    electron.ipcRenderer.on(
      "print:status",
      (_event, status) => callback(status)
    );
    return () => electron.ipcRenderer.removeListener("print:status", callback);
  },
  onConnectionStatus: (callback) => {
    const handler = (_event, data) => callback(data);
    electron.ipcRenderer.on("connection:status", handler);
    return () => electron.ipcRenderer.removeListener("connection:status", handler);
  },
  checkForUpdate: () => electron.ipcRenderer.invoke("update:check"),
  downloadUpdate: () => electron.ipcRenderer.invoke("update:download"),
  installUpdate: () => electron.ipcRenderer.invoke("update:install"),
  getUpdateStatus: () => electron.ipcRenderer.invoke("update:get-status"),
  onUpdateStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    electron.ipcRenderer.on("update:status", handler);
    return () => electron.ipcRenderer.removeListener("update:status", handler);
  }
});
