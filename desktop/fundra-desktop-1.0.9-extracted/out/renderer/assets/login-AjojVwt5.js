(function() {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById(
    "errorMessage"
  );
  const userLoginDataInput = document.getElementById(
    "userLoginData"
  );
  const passwordInput = document.getElementById("password");
  const minimizeBtn = document.getElementById(
    "minimizeBtn"
  );
  const closeBtn = document.getElementById("closeBtn");
  const autoLaunchGroup = document.getElementById("autoLaunchGroup");
  const autoLaunchCheckbox = document.getElementById(
    "autoLaunch"
  );
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
  (async () => {
    try {
      const settings = await window.electronAPI.getSettings();
      if (settings?.isFirstRun !== false && autoLaunchGroup) {
        autoLaunchGroup.style.display = "flex";
      }
    } catch {
    }
  })();
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
    setTimeout(() => errorMessage.classList.remove("show"), 5e3);
  }
  function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    userLoginDataInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
    loginBtn.innerHTML = isLoading ? '<span class="loading-spinner"></span>Giriş yapılıyor...' : "Giriş Yap";
  }
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userLoginData = userLoginDataInput.value.trim();
    const password = passwordInput.value;
    const autoLaunch = autoLaunchCheckbox?.checked ?? false;
    if (!userLoginData || !password) {
      showError("Lütfen tüm alanları doldurun");
      return;
    }
    setLoading(true);
    try {
      const result = await window.electronAPI.login({
        userLoginData,
        password,
        autoLaunch
      });
      if (result.success) {
        window.electronAPI.log("info", "Login successful");
      } else {
        showError(
          result.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol edin."
        );
        setLoading(false);
      }
    } catch (error) {
      window.electronAPI.log(
        "error",
        "Login error:",
        error instanceof Error ? error : String(error)
      );
      showError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  });
  window.electronAPI.onLoginError((error) => {
    showError(error);
    setLoading(false);
  });
  userLoginDataInput.focus();
  userLoginDataInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") passwordInput.focus();
  });
})();
