(() => {
  "use strict";

  const originalData = window.OFFSKULL_DATA;
  const workingData = JSON.parse(JSON.stringify(originalData));
  const imageFiles = new Map();
  const objectUrls = new Map();

  const list = document.querySelector("#admin-character-list");
  const statusBox = document.querySelector("#admin-status");
  const indicator = document.querySelector("#connection-indicator");

  const ownerInput = document.querySelector("#github-owner");
  const repoInput = document.querySelector("#github-repo");
  const branchInput = document.querySelector("#github-branch");
  const tokenInput = document.querySelector("#github-token");

  assignKeys();
  detectRepository();
  renderCharacters();

  function randomKey() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function assignKeys() {
    workingData.characters.forEach(character => {
      character._adminKey = randomKey();
    });
  }

  function detectRepository() {
    if (!location.hostname.endsWith(".github.io")) return;

    const owner = location.hostname.split(".")[0];
    const firstPath = location.pathname.split("/").filter(Boolean)[0];
    ownerInput.value = owner;

    if (firstPath && firstPath !== "admin.html") {
      repoInput.value = firstPath;
    } else {
      repoInput.value = `${owner}.github.io`;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderCharacters() {
    releaseUnusedObjectUrls();

    list.innerHTML = workingData.characters.map((character, index) => {
      const localPreview = objectUrls.get(character._adminKey);
      const imageSource = localPreview || character.image || "assets/images/banner.svg";

      return `
        <article class="admin-character-editor" data-index="${index}">
          <div class="character-image-editor">
            <img
              class="character-preview"
              src="${escapeHtml(imageSource)}"
              alt="Предпросмотр изображения персонажа"
            >
            <label class="image-picker">
              Выбрать новую картинку
              <input
                class="character-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              >
            </label>
            <p class="image-path">
              ${localPreview ? "Новая картинка выбрана и будет загружена при сохранении." : escapeHtml(character.image || "Картинка не выбрана")}
            </p>
          </div>

          <div class="character-fields">
            <div class="character-editor-heading">
              <h3>Персонаж ${index + 1}</h3>
              <button class="delete-character" type="button">Удалить</button>
            </div>

            <label>
              <span>Имя</span>
              <input data-field="name" type="text" value="${escapeHtml(character.name)}" placeholder="Имя персонажа">
            </label>

            <label>
              <span>Возраст</span>
              <input data-field="age" type="text" value="${escapeHtml(character.age)}" placeholder="Например: 29 лет">
            </label>

            <label class="wide">
              <span>Способности</span>
              <input data-field="ability" type="text" value="${escapeHtml(character.ability)}" placeholder="Главные способности">
            </label>

            <label class="wide">
              <span>Описание</span>
              <textarea data-field="description" placeholder="Краткое описание персонажа">${escapeHtml(character.description)}</textarea>
            </label>
          </div>
        </article>
      `;
    }).join("");
  }

  function releaseUnusedObjectUrls() {
    const activeKeys = new Set(workingData.characters.map(item => item._adminKey));
    for (const [key, url] of objectUrls) {
      if (!activeKeys.has(key)) {
        URL.revokeObjectURL(url);
        objectUrls.delete(key);
        imageFiles.delete(key);
      }
    }
  }

  list.addEventListener("input", event => {
    const field = event.target.dataset.field;
    if (!field) return;

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.index);
    workingData.characters[index][field] = event.target.value;
  });

  list.addEventListener("change", event => {
    if (!event.target.classList.contains("character-image-input")) return;

    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showStatus("error", "Ошибка", "Выберите файл изображения.");
      event.target.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showStatus("error", "Слишком большой файл", "Размер картинки должен быть не больше 15 МБ.");
      event.target.value = "";
      return;
    }

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.index);
    const character = workingData.characters[index];
    const oldUrl = objectUrls.get(character._adminKey);

    if (oldUrl) URL.revokeObjectURL(oldUrl);

    imageFiles.set(character._adminKey, file);
    objectUrls.set(character._adminKey, URL.createObjectURL(file));
    renderCharacters();
  });

  list.addEventListener("click", event => {
    if (!event.target.classList.contains("delete-character")) return;

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.index);
    const character = workingData.characters[index];

    if (!confirm(`Удалить персонажа «${character.name || "Без имени"}» из списка?`)) return;

    workingData.characters.splice(index, 1);
    renderCharacters();
  });

  document.querySelector("#add-character").addEventListener("click", () => {
    workingData.characters.push({
      name: "Новый персонаж",
      image: "assets/images/banner.svg",
      age: "Неизвестно",
      ability: "Укажите способности",
      description: "Добавьте описание персонажа.",
      _adminKey: randomKey()
    });

    renderCharacters();
    list.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  document.querySelector("#toggle-token").addEventListener("click", () => {
    tokenInput.type = tokenInput.type === "password" ? "text" : "password";
  });

  document.querySelector("#check-access").addEventListener("click", async () => {
    setBusy(true);
    showStatus("busy", "Проверяем доступ", "Подключаемся к вашему репозиторию GitHub.");

    try {
      const config = getConfig();
      const response = await githubFetch(`/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}`, {
        method: "GET"
      }, config.token);

      if (!response.ok) {
        throw await apiError(response);
      }

      indicator.textContent = "Доступ подтверждён";
      indicator.className = "connection-indicator success";
      showStatus("success", "Подключение работает", `Репозиторий ${config.owner}/${config.repo} доступен.`);
    } catch (error) {
      indicator.textContent = "Ошибка доступа";
      indicator.className = "connection-indicator error";
      showStatus("error", "Не удалось подключиться", friendlyError(error));
    } finally {
      setBusy(false);
    }
  });

  document.querySelector("#download-backup").addEventListener("click", () => {
    const cleanData = createCleanData();
    const content = makeContentFile(cleanData);
    downloadText("content-backup.js", content);
    showStatus("success", "Резервная копия скачана", "Сохраните файл, чтобы при необходимости вернуть прежние данные.");
  });

  document.querySelector("#save-to-github").addEventListener("click", saveToGitHub);

  async function saveToGitHub() {
    if (!workingData.characters.length) {
      showStatus("error", "Нет персонажей", "Добавьте хотя бы одного персонажа.");
      return;
    }

    for (const character of workingData.characters) {
      if (!character.name.trim()) {
        showStatus("error", "Не заполнено имя", "У каждого персонажа должно быть имя.");
        return;
      }
    }

    let config;
    try {
      config = getConfig();
    } catch (error) {
      showStatus("error", "Заполните подключение", friendlyError(error));
      return;
    }

    setBusy(true);

    try {
      showStatus("busy", "Создаём резервную копию", "Скачиваем текущий файл данных перед публикацией.");
      await downloadRemoteBackup(config);

      const cleanData = createCleanData();

      for (let index = 0; index < workingData.characters.length; index += 1) {
        const editorCharacter = workingData.characters[index];
        const selectedImage = imageFiles.get(editorCharacter._adminKey);

        if (!selectedImage) continue;

        showStatus(
          "busy",
          "Загружаем изображения",
          `${index + 1} из ${workingData.characters.length}: ${editorCharacter.name}`
        );

        const extension = extensionFor(selectedImage);
        const filename = `${slugify(editorCharacter.name) || "character"}-${Date.now()}-${index + 1}.${extension}`;
        const repoPath = `assets/images/characters/${filename}`;
        const base64 = await fileToBase64(selectedImage);

        await putGitHubFile(
          config,
          repoPath,
          base64,
          `Добавлена картинка персонажа ${editorCharacter.name}`
        );

        cleanData.characters[index].image = repoPath;
        editorCharacter.image = repoPath;
      }

      showStatus("busy", "Сохраняем персонажей", "Обновляем файл assets/js/content.js.");

      await putGitHubFile(
        config,
        "assets/js/content.js",
        utf8ToBase64(makeContentFile(cleanData)),
        "Обновлены персонажи через панель администратора"
      );

      imageFiles.clear();
      for (const url of objectUrls.values()) URL.revokeObjectURL(url);
      objectUrls.clear();
      renderCharacters();

      indicator.textContent = "Изменения сохранены";
      indicator.className = "connection-indicator success";
      showStatus(
        "success",
        "Сайт обновлён",
        "GitHub принял изменения. Откройте раздел «Персонажи» и обновите страницу через несколько минут."
      );
    } catch (error) {
      indicator.textContent = "Ошибка сохранения";
      indicator.className = "connection-indicator error";
      showStatus("error", "Не удалось сохранить", friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  function getConfig() {
    const config = {
      owner: ownerInput.value.trim(),
      repo: repoInput.value.trim(),
      branch: branchInput.value.trim() || "main",
      token: tokenInput.value.trim()
    };

    if (!config.owner) throw new Error("Укажите логин GitHub.");
    if (!config.repo) throw new Error("Укажите название репозитория.");
    if (!config.token) throw new Error("Вставьте fine-grained token.");
    return config;
  }

  function createCleanData() {
    const clean = JSON.parse(JSON.stringify(workingData));
    clean.characters.forEach(character => delete character._adminKey);
    return clean;
  }

  function makeContentFile(data) {
    return `window.OFFSKULL_DATA = ${JSON.stringify(data, null, 2)};\n`;
  }

  async function downloadRemoteBackup(config) {
    const remote = await getGitHubFile(config, "assets/js/content.js");

    if (!remote?.content) {
      downloadText("content-backup.js", makeContentFile(originalData));
      return;
    }

    const text = base64ToUtf8(remote.content.replace(/\n/g, ""));
    const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
    downloadText(`content-backup-${stamp}.js`, text);
  }

  async function putGitHubFile(config, path, base64Content, message) {
    const current = await getGitHubFile(config, path, true);
    const body = {
      message,
      content: base64Content,
      branch: config.branch
    };

    if (current?.sha) body.sha = current.sha;

    const response = await githubFetch(
      `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(path)}`,
      {
        method: "PUT",
        body: JSON.stringify(body)
      },
      config.token
    );

    if (!response.ok) throw await apiError(response);
    return response.json();
  }

  async function getGitHubFile(config, path, allowMissing = false) {
    const response = await githubFetch(
      `/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodePath(path)}?ref=${encodeURIComponent(config.branch)}`,
      { method: "GET" },
      config.token
    );

    if (allowMissing && response.status === 404) return null;
    if (!response.ok) throw await apiError(response);
    return response.json();
  }

  function githubFetch(path, options, token) {
    return fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
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
    if (error.status === 401) {
      return "Токен неверный, просрочен или был отозван.";
    }
    if (error.status === 403) {
      return "У токена нет права Contents: Read and write, либо доступ к репозиторию запрещён.";
    }
    if (error.status === 404) {
      return "Репозиторий, ветка или файл не найден. Проверьте логин и название репозитория.";
    }
    if (error.status === 409) {
      return "GitHub не смог выполнить сохранение из-за конфликта. Обновите админ-страницу и повторите.";
    }
    return error.message || "Неизвестная ошибка.";
  }

  function encodePath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function extensionFor(file) {
    const byType = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif"
    };

    if (byType[file.type]) return byType[file.type];

    const fromName = file.name.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "webp", "gif"].includes(fromName) ? fromName : "jpg";
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

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () => reject(new Error("Не удалось прочитать изображение."));
      reader.readAsDataURL(file);
    });
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
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function setBusy(isBusy) {
    document.querySelectorAll("button").forEach(button => {
      button.disabled = isBusy;
    });
  }

  function showStatus(type, title, message) {
    statusBox.className = `admin-status visible ${type}`;
    statusBox.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;

    if (type !== "busy") {
      clearTimeout(showStatus.timer);
      showStatus.timer = setTimeout(() => {
        statusBox.classList.remove("visible");
      }, 9000);
    }
  }
})();
