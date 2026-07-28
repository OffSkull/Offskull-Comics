(() => {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalize(value) {
    const source = value && typeof value === "object" ? clone(value) : {};
    if (!source.site || typeof source.site !== "object") source.site = {};
    if (!source.heroNews || typeof source.heroNews !== "object") source.heroNews = {};
    if (!Array.isArray(source.comics)) source.comics = [];
    if (!Array.isArray(source.characters)) source.characters = [];

    source.comics = source.comics.map((comic, index) => ({
      ...comic,
      id: String(comic?.id || `comic-${index + 1}`),
      title: String(comic?.title || `Комикс ${index + 1}`),
      issues: Array.isArray(comic?.issues)
        ? comic.issues.map((issue, issueIndex) => ({
            ...issue,
            number: issue?.number ?? issueIndex + 1,
            pages: Array.isArray(issue?.pages) ? issue.pages.filter(Boolean) : []
          }))
        : []
    }));

    source.characters = source.characters.map((character, index) => ({
      ...character,
      id: String(character?.id || `character-${index + 1}`),
      name: String(character?.name || `Персонаж ${index + 1}`)
    }));

    return source;
  }

  async function load() {
    const seed = normalize(window.OFFSKULL_SEED || window.OFFSKULL_DATA || {});

    if (!window.OffSkullSupabase?.isConfigured()) {
      return seed;
    }

    try {
      const client = window.OffSkullSupabase.getClient();
      const { data, error } = await client
        .from("site_content")
        .select("content")
        .eq("id", "main")
        .maybeSingle();

      if (error) throw error;

      const remote = data?.content;
      if (!remote || Number(remote.schemaVersion || 0) < 2) {
        return seed;
      }

      return normalize(remote);
    } catch (error) {
      console.warn("Не удалось загрузить данные из Supabase. Используется встроенная копия.", error);
      return seed;
    }
  }

  window.OffSkullData = {
    clone,
    normalize,
    load
  };
})();
