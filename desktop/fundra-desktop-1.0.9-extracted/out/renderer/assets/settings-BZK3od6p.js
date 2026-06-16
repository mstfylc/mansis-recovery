import { S as SUCCESS_MESSAGE_DURATION_MS } from "./constants-QTx2PBAd.js";
(function() {
  const minimizeBtn = document.getElementById(
    "minimizeBtn"
  );
  const closeBtn = document.getElementById(
    "closeBtn"
  );
  const successMessage = document.getElementById(
    "successMessage"
  );
  const userName = document.getElementById(
    "userName"
  );
  const userEmail = document.getElementById(
    "userEmail"
  );
  const userAvatar = document.getElementById(
    "userAvatar"
  );
  const connectionStatus = document.getElementById(
    "connectionStatus"
  );
  const printerName = document.getElementById(
    "printerName"
  );
  const apiUrl = document.getElementById("apiUrl");
  const reconnectInterval = document.getElementById(
    "reconnectInterval"
  );
  const saveBtn = document.getElementById(
    "saveBtn"
  );
  const testPrintBtn = document.getElementById(
    "testPrintBtn"
  );
  const logoutBtn = document.getElementById(
    "logoutBtn"
  );
  const backBtn = document.getElementById(
    "backBtn"
  );
  const logoEntranceTicket = document.getElementById(
    "logoEntranceTicket"
  );
  const logoOrderTicket = document.getElementById(
    "logoOrderTicket"
  );
  const logoTableCheck = document.getElementById(
    "logoTableCheck"
  );
  const logoTestPrint = document.getElementById(
    "logoTestPrint"
  );
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.electronAPI.backToMain();
    });
  }
  if (minimizeBtn) {
    minimizeBtn.addEventListener("click", () => {
      window.electronAPI.minimizeWindow();
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.electronAPI.closeWindow();
    });
  }
  function showSuccess(message) {
    if (!successMessage) return;
    successMessage.textContent = message;
    successMessage.classList.add("show");
    setTimeout(() => {
      if (successMessage) {
        successMessage.classList.remove("show");
      }
    }, SUCCESS_MESSAGE_DURATION_MS);
  }
  function updateConnectionStatus(isConnected) {
    if (!connectionStatus) return;
    if (isConnected) {
      connectionStatus.innerHTML = '<span class="status-dot"></span>Bağlı';
      connectionStatus.className = "status-badge connected";
    } else {
      connectionStatus.innerHTML = '<span class="status-dot"></span>Bağlantı Yok';
      connectionStatus.className = "status-badge disconnected";
    }
  }
  async function loadSettings() {
    try {
      const settings = await window.electronAPI.getSettings();
      window.electronAPI.log(
        "info",
        "Settings loaded in settings page:",
        settings
      );
      const fullName = `${settings.name || ""} ${settings.surname || ""}`.trim();
      const displayName = fullName || settings.username || settings.email || "Kullanıcı";
      if (userName) {
        userName.textContent = displayName;
      }
      if (userAvatar) {
        const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        userAvatar.textContent = initials || "U";
      }
      if (settings.email && userEmail) {
        userEmail.textContent = settings.email;
      }
      if (settings.apiUrl && apiUrl) apiUrl.value = settings.apiUrl;
      if (settings.reconnectInterval && reconnectInterval) {
        reconnectInterval.value = String(settings.reconnectInterval / 1e3);
      }
      if (settings.receiptLogoConfig) {
        if (logoEntranceTicket)
          logoEntranceTicket.checked = !!settings.receiptLogoConfig.entranceTicket;
        if (logoOrderTicket)
          logoOrderTicket.checked = !!settings.receiptLogoConfig.orderTicket;
        if (logoTableCheck)
          logoTableCheck.checked = !!settings.receiptLogoConfig.tableCheck;
        if (logoTestPrint)
          logoTestPrint.checked = !!settings.receiptLogoConfig.testPrint;
      }
      const authStatus = await window.electronAPI.checkAuthStatus();
      updateConnectionStatus(authStatus);
      await loadPrinters();
      const currentPrinter = await window.electronAPI.getCurrentPrinter();
      if (currentPrinter && currentPrinter.name && printerName) {
        printerName.value = currentPrinter.name;
      }
    } catch (error) {
      window.electronAPI.log(
        "error",
        "Error loading settings:",
        error instanceof Error ? error : String(error)
      );
    }
  }
  async function loadPrinters() {
    if (!printerName) return;
    try {
      const printers = await window.electronAPI.getPrinters();
      window.electronAPI.log("info", "Detected printers:", printers);
      printerName.innerHTML = "";
      if (printers && printers.length > 0) {
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Yazıcı seçiniz...";
        printerName.appendChild(defaultOption);
        printers.forEach((printer) => {
          const option = document.createElement("option");
          option.value = printer;
          option.textContent = printer;
          if (printerName) {
            printerName.appendChild(option);
          }
        });
      } else {
        const noOption = document.createElement("option");
        noOption.value = "";
        noOption.textContent = "Yazıcı bulunamadı - Lütfen yazıcı yükleyin";
        printerName.appendChild(noOption);
        printerName.disabled = true;
      }
    } catch (error) {
      window.electronAPI.log(
        "error",
        "Error loading printers:",
        error instanceof Error ? error : String(error)
      );
      if (printerName) {
        const errorOption = document.createElement("option");
        errorOption.value = "";
        errorOption.textContent = "Yazıcılar yüklenirken hata oluştu";
        printerName.innerHTML = "";
        printerName.appendChild(errorOption);
      }
    }
  }
  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      try {
        if (!saveBtn) return;
        saveBtn.disabled = true;
        saveBtn.textContent = "💾 Kaydediliyor...";
        if (!reconnectInterval) {
          throw new Error("Form elementleri bulunamadı");
        }
        const settings = {
          reconnectInterval: parseInt(reconnectInterval.value) * 1e3,
          receiptLogoConfig: {
            entranceTicket: logoEntranceTicket?.checked ?? false,
            orderTicket: logoOrderTicket?.checked ?? false,
            tableCheck: logoTableCheck?.checked ?? false,
            testPrint: logoTestPrint?.checked ?? false
          }
        };
        if (apiUrl) {
          settings.apiUrl = apiUrl.value;
        }
        window.electronAPI.log("info", "Saving settings:", settings);
        const settingsResult = await window.electronAPI.saveSettings(settings);
        window.electronAPI.log("info", "Settings result:", settingsResult);
        if (!settingsResult || !settingsResult.success) {
          throw new Error(settingsResult?.error || "Ayarlar kaydedilemedi");
        }
        if (printerName && printerName.value) {
          window.electronAPI.log("info", "Setting printer:", printerName.value);
          const printerResult = await window.electronAPI.setPrinter(
            printerName.value
          );
          window.electronAPI.log("info", "Printer result:", printerResult);
          if (!printerResult || !printerResult.success) {
            throw new Error(printerResult?.error || "Yazıcı ayarlanamadı");
          }
        }
        showSuccess("✅ Ayarlar başarıyla kaydedildi");
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Ayarları Kaydet";
      } catch (error) {
        window.electronAPI.log(
          "error",
          "Error saving settings:",
          error instanceof Error ? error : String(error)
        );
        const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
        alert(`Ayarlar kaydedilirken bir hata oluştu: ${errorMessage}`);
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Ayarları Kaydet";
      }
    });
  }
  if (testPrintBtn) {
    testPrintBtn.addEventListener("click", async () => {
      try {
        testPrintBtn.disabled = true;
        testPrintBtn.textContent = "🖨️ Yazdırılıyor...";
        const result = await window.electronAPI.testPrint();
        if (result.success) {
          showSuccess("✅ Test yazdırma başarılı!");
        } else {
          alert(`Test yazdırma başarısız: ${result.error}`);
        }
        testPrintBtn.disabled = false;
        testPrintBtn.textContent = "🖨️ Test Yazdır";
      } catch (error) {
        window.electronAPI.log(
          "error",
          "Error test printing:",
          error instanceof Error ? error : String(error)
        );
        alert("Test yazdırma başarısız oldu");
        testPrintBtn.disabled = false;
        testPrintBtn.textContent = "🖨️ Test Yazdır";
      }
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const confirmed = confirm("Çıkış yapmak istediğinizden emin misiniz?");
      if (!confirmed) return;
      try {
        await window.electronAPI.logout();
      } catch (error) {
        window.electronAPI.log(
          "error",
          "Error logging out:",
          error instanceof Error ? error : String(error)
        );
        alert("Çıkış yapılırken bir hata oluştu");
      }
    });
  }
  loadSettings();
  const checkUpdateBtn = document.getElementById(
    "checkUpdateBtn"
  );
  const updateVersionLabel = document.getElementById(
    "updateVersionLabel"
  );
  const updateStatusText = document.getElementById(
    "updateStatusText"
  );
  const updateProgressSection = document.getElementById(
    "updateProgressSection"
  );
  const updateProgressText = document.getElementById(
    "updateProgressText"
  );
  const settingsUpdateProgressBar = document.getElementById(
    "settingsUpdateProgressBar"
  );
  const updateInstallSection = document.getElementById(
    "updateInstallSection"
  );
  const settingsInstallBtn = document.getElementById(
    "settingsInstallBtn"
  );
  function handleSettingsUpdateStatus(status) {
    if (!updateStatusText) return;
    switch (status.status) {
      case "checking":
        updateStatusText.textContent = "Güncelleme kontrol ediliyor...";
        if (checkUpdateBtn) {
          checkUpdateBtn.disabled = true;
          checkUpdateBtn.textContent = "🔍 Kontrol ediliyor...";
        }
        break;
      case "available":
        updateStatusText.textContent = `Yeni sürüm mevcut: v${status.version}`;
        if (updateVersionLabel)
          updateVersionLabel.textContent = `v${status.version} indiriliyor`;
        if (checkUpdateBtn) {
          checkUpdateBtn.disabled = true;
          checkUpdateBtn.textContent = "⬇️ İndiriliyor...";
        }
        break;
      case "downloading":
        if (status.progress) {
          const pct = Math.round(status.progress.percent);
          if (updateProgressSection)
            updateProgressSection.style.display = "block";
          if (updateProgressText)
            updateProgressText.textContent = `İndiriliyor: %${pct}`;
          if (settingsUpdateProgressBar)
            settingsUpdateProgressBar.style.width = `${pct}%`;
        }
        if (updateInstallSection) updateInstallSection.style.display = "none";
        break;
      case "downloaded":
        updateStatusText.textContent = `v${status.version} indirildi — yüklemeye hazır`;
        if (updateVersionLabel)
          updateVersionLabel.textContent = `v${status.version} hazır`;
        if (updateProgressSection) updateProgressSection.style.display = "none";
        if (updateInstallSection) updateInstallSection.style.display = "block";
        if (checkUpdateBtn) {
          checkUpdateBtn.disabled = false;
          checkUpdateBtn.textContent = "🔍 Güncelleme Kontrol Et";
        }
        break;
      case "not-available":
        updateStatusText.textContent = "Uygulama güncel";
        if (checkUpdateBtn) {
          checkUpdateBtn.disabled = false;
          checkUpdateBtn.textContent = "🔍 Güncelleme Kontrol Et";
        }
        if (updateProgressSection) updateProgressSection.style.display = "none";
        if (updateInstallSection) updateInstallSection.style.display = "none";
        break;
      case "error":
        updateStatusText.textContent = `Güncelleme hatası: ${status.error || "Bilinmeyen hata"}`;
        if (checkUpdateBtn) {
          checkUpdateBtn.disabled = false;
          checkUpdateBtn.textContent = "🔍 Güncelleme Kontrol Et";
        }
        if (updateProgressSection) updateProgressSection.style.display = "none";
        break;
    }
  }
  if (checkUpdateBtn) {
    checkUpdateBtn.addEventListener("click", async () => {
      await window.electronAPI.checkForUpdate();
    });
  }
  if (settingsInstallBtn) {
    settingsInstallBtn.addEventListener("click", () => {
      window.electronAPI.installUpdate();
    });
  }
  window.electronAPI.onUpdateStatus(handleSettingsUpdateStatus);
  window.electronAPI.getUpdateStatus().then(handleSettingsUpdateStatus);
  window.electronAPI.getAppVersion().then((version) => {
    if (updateVersionLabel) {
      updateVersionLabel.textContent = `Mevcut sürüm: v${version}`;
    }
  });
  window.electronAPI.onPrintStatus((status) => {
    window.electronAPI.log("info", "Print status:", status);
  });
})();
