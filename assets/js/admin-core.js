(() => {
  "use strict";

  const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

  function getClient() {
    if (!window.OffSkullSupabase?.isConfigured()) {
      throw new Error(
        "Supabase не настроен. Заполните assets/js/supabase-config.js."
      );
    }

    return window.OffSkullSupabase.getClient();
  }

  async function getSession() {
    const client = getClient();
    const { data, error } = await client.auth.getSession();

    if (error) throw error;
    if (!data?.session) return null;

    const { data: isAdmin, error: adminError } =
      await client.rpc("is_site_admin");

    if (adminError) throw adminError;
    if (isAdmin !== true) return null;

    return data.session;
  }

  async function requireSession() {
    try {
      const session = await getSession();

      if (!session) {
        redirectToLogin();
        return null;
      }

      return session;
    } catch (error) {
      console.error(error);
      redirectToLogin();
      return null;
    }
  }

  function redirectToLogin() {
    const returnTo = encodeURIComponent(
      location.pathname.split("/").pop() || "admin.html"
    );
    location.replace(`admin-login.html?return=${returnTo}`);
  }

  async function clearSession() {
    try {
      await getClient().auth.signOut();
    } finally {
      for (const key of [
        "offskull_admin_session_v2",
        "offskull_admin_session_v3"
      ]) {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (_) {}
      }
    }
  }

  function friendlyError(error) {
    const message = String(error?.message || "");

    if (/jwt|session|not authenticated|auth session missing/i.test(message)) {
      return "Сеанс администратора завершён. Войдите ещё раз.";
    }

    if (/row-level security|permission denied|not authorized/i.test(message)) {
      return "У аккаунта нет прав на изменение сайта.";
    }

    if (/bucket not found/i.test(message)) {
      return "Хранилище offskull-media не создано. Выполните SQL-настройку.";
    }

    if (/payload too large|maximum allowed size/i.test(message)) {
      return "Файл слишком большой.";
    }

    return message || "Неизвестная ошибка.";
  }

  function validateImage(file) {
    if (!file) throw new Error("Изображение не выбрано.");

    if (!String(file.type || "").startsWith("image/")) {
      throw new Error("Выбранный файл не является изображением.");
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(
        "Размер одного изображения должен быть не больше 20 МБ."
      );
    }
  }

  function extensionFor(file) {
    const byType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    };

    if (byType[file.type]) return byType[file.type];

    const fromName = String(file.name || "")
      .split(".")
      .pop()
      .toLowerCase();

    return ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)
      ? fromName
      : "jpg";
  }

  function slugify(value) {
    const map = {
      а:"a", б:"b", в:"v", г:"g", д:"d", е:"e", ё:"e",
      ж:"zh", з:"z", и:"i", й:"y", к:"k", л:"l", м:"m",
      н:"n", о:"o", п:"p", р:"r", с:"s", т:"t", у:"u",
      ф:"f", х:"h", ц:"ts", ч:"ch", ш:"sh", щ:"sch",
      ы:"y", э:"e", ю:"yu", я:"ya", ь:"", ъ:""
    };

    return String(value || "")
      .toLowerCase()
      .split("")
      .map(char => map[char] ?? char)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  }

  function cleanData(data) {
    const clean = JSON.parse(JSON.stringify(data || {}));

    if (!clean.site || typeof clean.site !== "object") clean.site = {};
    if (!Array.isArray(clean.comics)) clean.comics = [];
    if (!Array.isArray(clean.characters)) clean.characters = [];

    clean.characters.forEach(character => {
      delete character._adminKey;
      delete character._selectedFile;
    });

    clean.comics.forEach(comic => {
      delete comic._adminKey;
      delete comic._coverFile;

      if (!Array.isArray(comic.issues)) comic.issues = [];

      comic.issues.forEach(issue => {
        delete issue._adminKey;

        if (!Array.isArray(issue.pages)) issue.pages = [];

        issue.pages = issue.pages
          .map(page => {
            if (typeof page === "string") return page;
            return page?.path || "";
          })
          .filter(Boolean);
      });
    });

    return clean;
  }

  function makeContentFile(data) {
    return (
      `window.OFFSKULL_DATA = ` +
      `${JSON.stringify(cleanData(data), null, 2)};\n`
    );
  }

  async function loadRemoteData() {
    const client = getClient();

    const { data, error } = await client
      .from("site_content")
      .select("content")
      .eq("id", "main")
      .maybeSingle();

    if (error) throw error;

    if (data?.content) {
      return JSON.parse(JSON.stringify(data.content));
    }

    return JSON.parse(JSON.stringify(
      window.OFFSKULL_DATA || {
        site: {
          name: "OffSkull Comics",
          authorName: "Автор"
        },
        comics: [],
        characters: []
      }
    ));
  }

  async function saveData(data) {
    const client = getClient();
    const clean = cleanData(data);

    const { data: saved, error } = await client
      .from("site_content")
      .upsert(
        {
          id: "main",
          content: clean,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      )
      .select("content")
      .single();

    if (error) throw error;
    return saved;
  }

  async function uploadImage(file, path) {
    validateImage(file);

    const client = getClient();
    const bucket = window.OffSkullSupabase.getBucket();

    const { error } = await client.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false
      });

    if (error) throw error;

    const { data } = client.storage
      .from(bucket)
      .getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new Error("Не удалось получить ссылку на изображение.");
    }

    return data.publicUrl;
  }

  async function uploadCharacterImage(file, characterName) {
    const extension = extensionFor(file);
    const name = slugify(characterName) || "character";
    const filename =
      `${name}-${Date.now()}-` +
      `${Math.random().toString(36).slice(2, 7)}.${extension}`;

    return uploadImage(
      file,
      `characters/${filename}`
    );
  }

  async function uploadComicCover(file, comicId, comicTitle) {
    const extension = extensionFor(file);
    const safeId = slugify(comicId || comicTitle) || "comic";
    const filename =
      `cover-${Date.now()}-` +
      `${Math.random().toString(36).slice(2, 7)}.${extension}`;

    return uploadImage(
      file,
      `comics/${safeId}/${filename}`
    );
  }

  async function uploadComicPage(
    file,
    comicId,
    issueNumber,
    pageNumber
  ) {
    const extension = extensionFor(file);
    const safeId = slugify(comicId) || "comic";
    const safeIssue = Math.max(1, Number(issueNumber) || 1);
    const safePage = Math.max(1, Number(pageNumber) || 1);

    const filename =
      `page-${String(safePage).padStart(3, "0")}-` +
      `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.` +
      `${extension}`;

    return uploadImage(
      file,
      `comics/${safeId}/issue-${safeIssue}/${filename}`
    );
  }

  function downloadText(filename, content) {
    const blob = new Blob(
      [content],
      { type: "text/javascript;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.OffSkullAdmin = {
    getSession,
    requireSession,
    clearSession,
    friendlyError,
    slugify,
    cleanData,
    makeContentFile,
    loadRemoteData,
    saveData,
    uploadImage,
    uploadCharacterImage,
    uploadComicCover,
    uploadComicPage,
    downloadText
  };
})();
