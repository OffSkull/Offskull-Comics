(() => {
  "use strict";

  async function load(fallbackData) {
    const fallback = normalize(fallbackData);

    if (!window.OffSkullSupabase?.isConfigured()) {
      return fallback;
    }

    try {
      const client = window.OffSkullSupabase.getClient();

      const { data, error } = await client
        .from("site_content")
        .select("content")
        .eq("id", "main")
        .maybeSingle();

      if (error) throw error;
      if (!data?.content) return fallback;

      return normalize(data.content, fallback);
    } catch (error) {
      console.warn("Не удалось загрузить данные из Supabase. Используется content.js.", error);
      return fallback;
    }
  }

  function normalize(value, fallback = {}) {
    const data = value && typeof value === "object"
      ? JSON.parse(JSON.stringify(value))
      : JSON.parse(JSON.stringify(fallback || {}));

    if (!data.site || typeof data.site !== "object") {
      data.site = fallback.site || {
        name: "OffSkull Comics",
        heroTitle: "Мир авторских комиксов",
        heroText: "",
        authorName: "Автор",
        authorText: ""
      };
    }

    if (!Array.isArray(data.comics)) data.comics = [];
    if (!Array.isArray(data.characters)) data.characters = [];

    return data;
  }

  window.OffSkullSiteData = { load, normalize };
})();
