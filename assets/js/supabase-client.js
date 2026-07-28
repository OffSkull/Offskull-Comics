(() => {
  "use strict";

  let client = null;

  function config() {
    return window.OFFSKULL_SUPABASE_CONFIG || {};
  }

  function isConfigured() {
    const value = config();
    return (
      typeof value.url === "string" &&
      /^https:\/\/.+\.supabase\.co$/i.test(value.url.trim()) &&
      typeof value.publishableKey === "string" &&
      value.publishableKey.trim().length > 20 &&
      !value.publishableKey.includes("PASTE_")
    );
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (client) return client;
    if (!window.supabase?.createClient) {
      throw new Error("Библиотека Supabase не загрузилась.");
    }

    const value = config();
    client = window.supabase.createClient(
      value.url.trim(),
      value.publishableKey.trim(),
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    return client;
  }

  function bucket() {
    return String(config().bucket || "offskull-media").trim();
  }

  window.OffSkullSupabase = {
    isConfigured,
    getClient,
    bucket
  };
})();
