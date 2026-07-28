(async () => {
  "use strict";

  const form = document.querySelector("#login-form");
  const status = document.querySelector("#login-status");

  if (!window.OffSkullSupabase?.isConfigured()) {
    status.textContent = "Сначала настройте Supabase в assets/js/supabase-config.js.";
    status.className = "admin-message error";
    form.querySelector("button").disabled = true;
    return;
  }

  const db = window.OffSkullSupabase.getClient();

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    status.textContent = "Проверяем данные…";
    status.className = "admin-message busy";

    try {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: isAdmin, error: roleError } = await db.rpc("is_site_admin");
      if (roleError) throw roleError;
      if (isAdmin !== true) {
        await db.auth.signOut();
        throw new Error("У этого аккаунта нет прав администратора.");
      }

      location.replace("admin.html");
    } catch (error) {
      status.textContent = /invalid login credentials/i.test(error.message)
        ? "Неверный логин или пароль."
        : error.message;
      status.className = "admin-message error";
    }
  });

  document.querySelector("#toggle-password").addEventListener("click", () => {
    form.password.type = form.password.type === "password" ? "text" : "password";
  });
})();
