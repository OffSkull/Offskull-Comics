(() => {
  "use strict";

  let client = null;

  function getConfig() {
    return window.OFFSKULL_SUPABASE_CONFIG || {};
  }

  function isConfigured() {
    const config = getConfig();

    return (
      typeof config.url === "string" &&
      /^https:\/\/.+\.supabase\.co$/i.test(config.url.trim()) &&
      typeof config.publishableKey === "string" &&
      config.publishableKey.trim().length > 20 &&
      !config.publishableKey.includes("PASTE_")
    );
  }

  function getClient() {
    if (!isConfigured()) return null;
    if (client) return client;

    if (!window.supabase?.createClient) {
      throw new Error("Библиотека Supabase не загрузилась.");
    }

    const config = getConfig();

    client = window.supabase.createClient(
      config.url.trim(),
      config.publishableKey.trim(),
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

  function getBucket() {
    return String(getConfig().bucket || "offskull-media").trim();
  }

  window.OffSkullSupabase = {
    getConfig,
    isConfigured,
    getClient,
    getBucket
  };
})();
