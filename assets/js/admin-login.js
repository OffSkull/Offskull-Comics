(() => {
  "use strict";

  const form = document.querySelector("#admin-login-form");
  const ownerInput = document.querySelector("#login-owner");
  const repoInput = document.querySelector("#login-repo");
  const branchInput = document.querySelector("#login-branch");
  const tokenInput = document.querySelector("#login-token");
  const status = document.querySelector("#admin-login-status");
  const submitButton = form.querySelector('button[type="submit"]');

  detectRepository();

  const currentSession = OffSkullAdmin.getSession();
  if (currentSession) {
    ownerInput.value = currentSession.owner;
    repoInput.value = currentSession.repo;
    branchInput.value = currentSession.branch;
  }

  document.querySelector("#toggle-login-token").addEventListener("click", () => {
    tokenInput.type = tokenInput.type === "password" ? "text" : "password";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const session = {
      owner: ownerInput.value.trim(),
      repo: repoInput.value.trim(),
      branch: branchInput.value.trim() || "main",
      token: tokenInput.value.trim()
    };

    if (!session.owner || !session.repo || !session.token) {
      showStatus("error", "Заполните все обязательные поля.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Проверяем доступ…";
    showStatus("busy", "Подключаемся к GitHub…");

    try {
      await OffSkullAdmin.verifySession(session);
      OffSkullAdmin.setSession(session);
      showStatus("success", "Вход выполнен. Открываем панель…");

      const returnPage = new URLSearchParams(location.search).get("return");
      const safeReturn = ["admin.html", "characters.html"].includes(returnPage)
        ? returnPage
        : "characters.html";

      setTimeout(() => location.replace(safeReturn), 350);
    } catch (error) {
      OffSkullAdmin.clearSession();
      showStatus("error", OffSkullAdmin.friendlyError(error));
      submitButton.disabled = false;
      submitButton.textContent = "Войти в панель";
    }
  });

  function detectRepository() {
    if (!location.hostname.endsWith(".github.io")) return;

    const owner = location.hostname.split(".")[0];
    const firstPath = location.pathname.split("/").filter(Boolean)[0];

    ownerInput.value = owner;
    repoInput.value = firstPath && !firstPath.endsWith(".html")
      ? firstPath
      : `${owner}.github.io`;
  }

  function showStatus(type, message) {
    status.className = `admin-login-status visible ${type}`;
    status.textContent = message;
  }
})();
