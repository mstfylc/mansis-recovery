import { C as CONNECTION_CHECK_INTERVAL_MS, U as UPDATE_ERROR_DISPLAY_MS } from "./constants-QTx2PBAd.js";
let isMenuOpen = false;
function initializeEventListeners() {
  const minimizeBtn = document.getElementById("minimizeBtn");
  const closeBtn = document.getElementById("closeBtn");
  minimizeBtn?.addEventListener("click", () => {
    window.electronAPI.minimizeWindow();
  });
  closeBtn?.addEventListener("click", () => {
    window.electronAPI.closeWindow();
  });
  const userBoxBtn = document.getElementById("userBoxBtn");
  const userMenu = document.getElementById("userMenu");
  if (userBoxBtn && userMenu) {
    userBoxBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isMenuOpen = !isMenuOpen;
      if (isMenuOpen) {
        userMenu.classList.add("active");
      } else {
        userMenu.classList.remove("active");
      }
    });
    document.addEventListener("click", (e) => {
      const target = e.target;
      if (isMenuOpen && userMenu && !userMenu.contains(target) && !userBoxBtn.contains(target)) {
        isMenuOpen = false;
        userMenu.classList.remove("active");
      }
    });
  }
  const settingsBtn = document.getElementById("settingsBtn");
  settingsBtn?.addEventListener("click", () => {
    window.electronAPI.openSettings();
  });
  const printerSettingsBtn = document.getElementById("printerSettingsBtn");
  if (printerSettingsBtn) {
    printerSettingsBtn.addEventListener("click", () => {
      window.electronAPI.openSettings();
    });
  }
}
const logoutBtn = document.getElementById("logoutBtn");
logoutBtn?.addEventListener("click", async () => {
  await window.electronAPI.logout();
});
async function loadUserInfo() {
  try {
    const settings = await window.electronAPI.getSettings();
    window.electronAPI.log("info", "Loaded settings:", settings);
    if (!settings || Object.keys(settings).length === 0) {
      window.electronAPI.log("warn", "No user settings available");
      return;
    }
    const fullName = `${settings.name || ""} ${settings.surname || ""}`.trim();
    const initials = getInitials(fullName);
    const userNameEl = document.getElementById("userName");
    const menuUserNameEl = document.getElementById("menuUserName");
    if (userNameEl) userNameEl.textContent = fullName || "Kullanıcı";
    if (menuUserNameEl) menuUserNameEl.textContent = fullName || "Kullanıcı";
    const userAvatarEl = document.getElementById("userAvatar");
    const menuUserAvatarEl = document.getElementById("menuUserAvatar");
    if (userAvatarEl) userAvatarEl.textContent = initials;
    if (menuUserAvatarEl) menuUserAvatarEl.textContent = initials;
    const roleMap = {
      BRANCH_ADMIN: "Şube Yöneticisi",
      COMPANY_ADMIN: "Şirket Yöneticisi",
      SUPER_ADMIN: "Sistem Yöneticisi",
      EMPLOYEE: "Çalışan"
    };
    const role = settings.role || "EMPLOYEE";
    const roleDisplay = roleMap[role] || role;
    const userRoleDisplayEl = document.getElementById("userRoleDisplay");
    if (userRoleDisplayEl) userRoleDisplayEl.textContent = roleDisplay;
    const branchName = settings.branchName || "Şube Bilgisi Yok";
    const menuBranchNameEl = document.getElementById("menuBranchName");
    if (menuBranchNameEl) menuBranchNameEl.textContent = branchName;
  } catch (error) {
    window.electronAPI.log(
      "error",
      "Failed to load user info:",
      error instanceof Error ? error : String(error)
    );
  }
}
function getInitials(name) {
  if (!name) return "U";
  const parts = name.split(" ").filter((part) => part.length > 0);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function updateConnectionStatus(connected) {
  const statusIndicator = document.getElementById("statusIndicator");
  const connectionStatus = document.getElementById("connectionStatus");
  if (connected) {
    statusIndicator?.classList.remove("disconnected");
    if (connectionStatus) {
      connectionStatus.textContent = "Bağlı";
    }
  } else {
    statusIndicator?.classList.add("disconnected");
    if (connectionStatus) {
      connectionStatus.textContent = "Bağlantı Kesildi";
    }
  }
}
window.electronAPI.onConnectionStatus((data) => {
  updateConnectionStatus(data.connected);
});
async function checkConnectionStatus() {
  try {
    const connected = await window.electronAPI.checkAuthStatus();
    updateConnectionStatus(connected);
  } catch (error) {
    window.electronAPI.log(
      "error",
      "Error checking connection status:",
      error instanceof Error ? error : String(error)
    );
    updateConnectionStatus(false);
  }
}
async function loadSystemStatus() {
  try {
    const printer = await window.electronAPI.getCurrentPrinter();
    const printerStatus = document.getElementById("printerStatus");
    if (printerStatus) {
      if (printer && printer.name) {
        printerStatus.textContent = `${printer.name}`;
      } else {
        printerStatus.textContent = "Yapılandırılmadı";
      }
    }
    const version = await window.electronAPI.getAppVersion();
    const appVersion = document.getElementById("appVersion");
    if (appVersion) {
      appVersion.textContent = `v${version}`;
    }
  } catch (error) {
    window.electronAPI.log(
      "error",
      "Error loading system status:",
      error instanceof Error ? error : String(error)
    );
    const printerStatus = document.getElementById("printerStatus");
    if (printerStatus) {
      printerStatus.textContent = "Hata";
    }
  }
}
function handleUpdateStatus(status) {
  const banner = document.getElementById("updateBanner");
  const message = document.getElementById("updateBannerMessage");
  const icon = document.getElementById("updateBannerIcon");
  const progress = document.getElementById("updateProgress");
  const progressBar = document.getElementById("updateProgressBar");
  const installBtn = document.getElementById("updateInstallBtn");
  if (!banner || !message || !icon) return;
  switch (status.status) {
    case "checking":
      break;
    case "available":
      banner.classList.add("visible");
      icon.textContent = "⬇️";
      message.textContent = `Yeni güncelleme indiriliyor: v${status.version}`;
      if (installBtn) installBtn.style.display = "none";
      break;
    case "downloading":
      banner.classList.add("visible");
      icon.textContent = "⬇️";
      if (status.progress) {
        const pct = Math.round(status.progress.percent);
        message.textContent = `Güncelleme indiriliyor: %${pct}`;
        if (progress) progress.classList.add("visible");
        if (progressBar) progressBar.style.width = `${pct}%`;
      }
      if (installBtn) installBtn.style.display = "none";
      break;
    case "downloaded":
      banner.classList.add("visible");
      icon.textContent = "✅";
      message.textContent = `v${status.version} indirildi — yeniden başlattığınızda yüklenecek`;
      if (progress) progress.classList.remove("visible");
      if (installBtn) installBtn.style.display = "inline-block";
      break;
    case "error":
      banner.classList.add("visible");
      icon.textContent = "⚠️";
      message.textContent = "Güncelleme hatası";
      if (progress) progress.classList.remove("visible");
      if (installBtn) installBtn.style.display = "none";
      setTimeout(
        () => banner.classList.remove("visible"),
        UPDATE_ERROR_DISPLAY_MS
      );
      break;
    case "not-available":
      banner.classList.remove("visible");
      break;
  }
}
function initUpdateBanner() {
  const installBtn = document.getElementById("updateInstallBtn");
  const dismissBtn = document.getElementById("updateDismissBtn");
  const banner = document.getElementById("updateBanner");
  installBtn?.addEventListener("click", () => {
    window.electronAPI.installUpdate();
  });
  dismissBtn?.addEventListener("click", () => {
    banner?.classList.remove("visible");
  });
  window.electronAPI.onUpdateStatus(handleUpdateStatus);
  window.electronAPI.getUpdateStatus().then(handleUpdateStatus);
}
function initialize() {
  initializeEventListeners();
  loadUserInfo();
  checkConnectionStatus();
  loadSystemStatus();
  initUpdateBanner();
  setInterval(checkConnectionStatus, CONNECTION_CHECK_INTERVAL_MS);
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
