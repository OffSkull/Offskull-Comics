(async () => {
  "use strict";

  const form = document.querySelector("#admin-login-form");
  const emailInput = document.querySelector("#login-email");
  const passwordInput = document.querySelector("#login-password");
  const statusBox = document.querySelector("#admin-login-status");
  const submitButton = form.querySelector('button[type="submit"]');

  removeLegacyGitHubSessions();

  document
    .querySelector("#toggle-login-password")
    .addEventListener("click", () => {
      passwordInput.type =
        passwordInput.type === "password" ? "text" : "password";
    });

  if (!window.OffSkullSupabase?.isConfigured()) {
    showStatus(
      "error",
      "Supabase ещё не настроен. Заполните assets/js/supabase-config.js."
    );
    submitButton.disabled = true;
    return;
  }

  const client = window.OffSkullSupabase.getClient();

  try {
    const { data } = await client.auth.getSession();

    if (data?.session) {
      const { data: isAdmin } = await client.rpc("is_site_admin");
      if (isAdmin === true) {
        location.replace("admin.html");
        return;
      }
    }
  } catch (_) {}

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showStatus("error", "Введите логин и пароль.");
      return;
    }

    setBusy(true);
    showStatus("busy", "Проверяем данные…");

    try {
      const { error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const { data: isAdmin, error: adminError } =
        await client.rpc("is_site_admin");

      if (adminError) throw adminError;

      if (isAdmin !== true) {
        await client.auth.signOut();
        throw new Error("У этого аккаунта нет прав администратора.");
      }

      showStatus("success", "Вход выполнен.");

      const returnPage =
        new URLSearchParams(location.search).get("return");

      const safeReturn = ["admin.html"].includes(returnPage)
        ? returnPage
        : "admin.html";

      setTimeout(() => location.replace(safeReturn), 250);
    } catch (error) {
      showStatus(
        "error",
        friendlyLoginError(error)
      );
      setBusy(false);
    }
  });

  function setBusy(busy) {
    emailInput.disabled = busy;
    passwordInput.disabled = busy;
    submitButton.disabled = busy;
    submitButton.textContent = busy ? "Входим…" : "Войти";
  }

  function showStatus(type, message) {
    statusBox.className =
      `admin-login-status visible ${type}`;
    statusBox.textContent = message;
  }

  function friendlyLoginError(error) {
    const message = String(error?.message || "");

    if (/invalid login credentials/i.test(message)) {
      return "Неверный логин или пароль.";
    }

    if (/email not confirmed/i.test(message)) {
      return "Аккаунт администратора не подтверждён.";
    }

    return message || "Не удалось выполнить вход.";
  }

  function removeLegacyGitHubSessions() {
    const keys = [
      "offskull_admin_session_v2",
      "offskull_admin_session_v3"
    ];

    for (const key of keys) {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch (_) {}
    }
  }
})();
