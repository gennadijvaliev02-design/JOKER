(() => {
  const startScreen = document.getElementById("start-screen");
  const onlineButton = document.getElementById("online-button");
  const settingsButton = document.getElementById("settings-button");
  const languageButton = document.getElementById("language-toggle");

  if (!startScreen) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = "menu-toast";
  startScreen.append(toast);

  let toastTimer = null;
  let isEnglish = false;

  function showMenuToast(text) {
    toast.textContent = text;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 1900);
  }

  onlineButton?.addEventListener("click", () => {
    showMenuToast(isEnglish ? "Online mode is coming soon" : "Онлайн режим скоро будет");
  });

  settingsButton?.addEventListener("click", () => {
    showMenuToast(isEnglish ? "Settings will be added after the main menu" : "Настройки добавим после главного меню");
  });

  languageButton?.addEventListener("click", () => {
    isEnglish = !isEnglish;
    languageButton.textContent = isEnglish ? "RU" : "EN";
    showMenuToast(isEnglish ? "English preview enabled" : "Русский интерфейс включён");
  });
})();
