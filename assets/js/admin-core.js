(() => {
  "use strict";

  const SESSION_KEY = "offskull_admin_session_v3";
  const LEGACY_KEYS = [
    "offskull_admin_session_v2",
    "offskull_admin_session_v3"
  ];
  const SESSION_LIFETIME_MS = 2 * 60 * 60 * 1000;

  function safeGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (_) {
      return false;
    }
  }

  function safeRemove(storage, key) {
    try {
      storage.removeItem(key);
    } catch (_) {}
  }

  function normalizeSession(parsed) {
    if (!parsed || typeof parsed !== "object") return null;

    const session = {
      owner: String(parsed.owner || "").trim(),
      repo: String(parsed.repo || "").trim(),
      branch: String(parsed.branch || "main").trim() || "main",
      token: String(parsed.token || "").trim(),
      createdAt: Number(parsed.createdAt || Date.now()),
      expiresAt: Number(parsed.expiresAt || 0)
    };

    if (!session.owner || !session.repo || !session.token) return null;

    if (!session.expiresAt) {
      session.expiresAt = session.createdAt + SESSION_LIFETIME_MS;
    }

    if (Date.now() >= session.expiresAt) return null;
    return session;
  }

  function parseStored(raw) {
    if (!raw) return null;

    try {
      return normalizeSession(JSON.parse(raw));
    } catch (_) {
      return null;
    }
  }

  function getSession() {
    let session = parseStored(safeGet(sessionStorage, SESSION_KEY));

    if (!session) {
      session = parseStored(safeGet(localStorage, SESSION_KEY));

      if (session) {
        safeSet(sessionStorage, SESSION_KEY, JSON.stringify(session));
      }
    }

    if (!session) {
      clearSession();
      return null;
    }

    return session;
  }

  function setSession(session) {
    const normalized = normalizeSession({
      ...session,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_LIFETIME_MS
    });

    if (!normalized) {
      throw new Error("Не удалось создать сеанс администратора.");
    }

    const serialized = JSON.stringify(normalized);
    safeSet(sessionStorage, SESSION_KEY, serialized);
    safeSet(localStorage, SESSION_KEY, serialized);

    LEGACY_KEYS
      .filter(key => key !== SESSION_KEY)
      .forEach(key => {
        safeRemove(sessionStorage, key);
        safeRemove(localStorage, key);
      });
  }

  function clearSession() {
    for (const key of LEGACY_KEYS) {
      safeRemove(sessionStorage, key);
      safeRemove(localStorage, key);
    }
  }

  function requireSession() {
    const session = getSession();

    if (!session) {
      const returnTo = encodeURIComponent(
        location.pathname.split("/").pop() || "admin.html"
      );
      location.replace(`admin-login.html?return=${returnTo}`);
      return null;
    }

    return session;
  }

  async function githubFetch(path, options = {}, session = getSession()) {
    if (!session) throw new Error("Сеанс администратора не найден.");

    return fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${session.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  }

  async function verifySession(session) {
    const response = await githubFetch(
      `/repos/${encodeURIComponent(session.owner)}/${encodeURIComponent(session.repo)}`,
      { method: "GET" },
      session
    );

    if (!response.ok) throw await apiError(response);
    return response.json();
  }

  function encodePath(path) {
    return String(path).split("/").map(encodeURIComponent).join("/");
  }

  async function getGitHubFile(path, allowMissing = false, session = getSession()) {
    if (!session) throw new Error("Сначала войдите как администратор.");

    const response = await githubFetch(
      `/repos/${encodeURIComponent(session.owner)}/${encodeURIComponent(session.repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(session.branch)}`,
      { method: "GET" },
      session
    );

    if (allowMissing && response.status === 404) return null;
    if (!response.ok) throw await apiError(response);
    return response.json();
  }

  async function putGitHubFile(path, base64Content, message, session = getSession()) {
    if (!session) throw new Error("Сначала войдите как администратор.");

    const current = await getGitHubFile(path, true, session);
    const body = {
      message,
      content: base64Content,
      branch: session.branch
    };

    if (current?.sha) body.sha = current.sha;

    const response = await githubFetch(
      `/repos/${encodeURIComponent(session.owner)}/${encodeURIComponent(session.repo)}/contents/${encodePath(path)}`,
      {
        method: "PUT",
        body: JSON.stringify(body)
      },
      session
    );

    if (!response.ok) throw await apiError(response);
    return response.json();
  }

  async function apiError(response) {
    let message = `GitHub вернул ошибку ${response.status}.`;

    try {
      const body = await response.json();
      if (body.message) message += ` ${body.message}`;
    } catch (_) {}

    const error = new Error(message);
    error.status = response.status;
    return error;
  }

  function friendlyError(error) {
    if (error?.status === 401) return "Токен неверный, просрочен или был отозван.";
    if (error?.status === 403) return "У токена нет разрешения Contents: Read and write.";
    if (error?.status === 404) return "Репозиторий, ветка или файл не найден.";
    if (error?.status === 409) return "Возник конфликт сохранения. Обновите страницу и повторите.";
    return error?.message || "Неизвестная ошибка.";
  }

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return btoa(binary);
  }

  function base64ToUtf8(base64) {
    const binary = atob(String(base64).replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("Не удалось прочитать изображение."));
      reader.readAsDataURL(file);
    });
  }

  function extensionFor(file) {
    const byType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    };

    if (byType[file.type]) return byType[file.type];

    const fromName = String(file.name || "").split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)
      ? fromName
      : "jpg";
  }

  function slugify(value) {
    const map = {
      а:"a", б:"b", в:"v", г:"g", д:"d", е:"e", ё:"e", ж:"zh", з:"z",
      и:"i", й:"y", к:"k", л:"l", м:"m", н:"n", о:"o", п:"p", р:"r",
      с:"s", т:"t", у:"u", ф:"f", х:"h", ц:"ts", ч:"ch", ш:"sh",
      щ:"sch", ы:"y", э:"e", ю:"yu", я:"ya", ь:"", ъ:""
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
    const clean = JSON.parse(JSON.stringify(data));
    clean.characters?.forEach(character => {
      delete character._adminKey;
      delete character._selectedFile;
    });
    return clean;
  }

  function makeContentFile(data) {
    return `window.OFFSKULL_DATA = ${JSON.stringify(cleanData(data), null, 2)};\n`;
  }

  async function loadRemoteData(session = getSession()) {
    const remote = await getGitHubFile("assets/js/content.js", false, session);
    const source = base64ToUtf8(remote.content);
    const marker = "window.OFFSKULL_DATA =";
    const markerIndex = source.indexOf(marker);

    if (markerIndex < 0) {
      throw new Error("Не удалось распознать файл content.js.");
    }

    const jsonText = source
      .slice(markerIndex + marker.length)
      .trim()
      .replace(/;\s*$/, "");

    return JSON.parse(jsonText);
  }

  async function saveData(data, message = "Обновлены персонажи через сайт", session = getSession()) {
    const content = makeContentFile(data);

    return putGitHubFile(
      "assets/js/content.js",
      utf8ToBase64(content),
      message,
      session
    );
  }

  async function uploadCharacterImage(file, characterName, session = getSession()) {
    if (!file) return null;
    if (!file.type.startsWith("image/")) {
      throw new Error("Выбранный файл не является изображением.");
    }
    if (file.size > 15 * 1024 * 1024) {
      throw new Error("Размер изображения должен быть не больше 15 МБ.");
    }

    const extension = extensionFor(file);
    const name = slugify(characterName) || "character";
    const filename = `${name}-${Date.now()}.${extension}`;
    const path = `assets/images/characters/${filename}`;
    const content = await fileToBase64(file);

    await putGitHubFile(
      path,
      content,
      `Добавлено изображение персонажа ${characterName || "Без имени"}`,
      session
    );

    return path;
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], {
      type: "text/javascript;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.OffSkullAdmin = {
    getSession,
    setSession,
    clearSession,
    requireSession,
    verifySession,
    friendlyError,
    getGitHubFile,
    putGitHubFile,
    utf8ToBase64,
    base64ToUtf8,
    fileToBase64,
    extensionFor,
    slugify,
    cleanData,
    makeContentFile,
    loadRemoteData,
    saveData,
    uploadCharacterImage,
    downloadText
  };
})();
