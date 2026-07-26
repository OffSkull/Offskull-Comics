(() => {
  "use strict";

  const session = OffSkullAdmin.requireSession();
  if (!session) return;

  let workingData = JSON.parse(JSON.stringify(window.OFFSKULL_DATA));
  const imageFiles = new Map();
  const objectUrls = new Map();

  const list = document.querySelector("#admin-character-list");
  const statusBox = document.querySelector("#admin-status");

  document.querySelector("#admin-session-repo").textContent =
    `${session.owner}/${session.repo} · ${session.branch}`;

  assignKeys();
  renderCharacters();

  document.querySelector("#admin-logout").addEventListener("click", logout);
  document.querySelector("#add-character").addEventListener("click", addCharacter);
  document.querySelector("#reload-from-github").addEventListener("click", reloadFromGitHub);
  document.querySelector("#download-backup").addEventListener("click", downloadBackup);
  document.querySelector("#save-to-github").addEventListener("click", saveToGitHub);

  list.addEventListener("input", event => {
    const field = event.target.dataset.field;
    if (!field) return;

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.index);
    workingData.characters[index][field] = event.target.value;
  });

  list.addEventListener("change", event => {
    if (!event.target.classList.contains("character-image-input")) return;
    chooseImage(event);
  });

  list.addEventListener("click", event => {
    if (!event.target.classList.contains("delete-character")) return;

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.index);
    const character = workingData.characters[index];

    if (!confirm(`Удалить персонажа «${character.name || "Без имени"}»?`)) return;

    cleanupCharacterResources(character._adminKey);
    workingData.characters.splice(index, 1);
    renderCharacters();
  });

  function randomKey() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function assignKeys() {
    workingData.characters.forEach(character => {
      character._adminKey = character._adminKey || randomKey();
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderCharacters() {
    list.innerHTML = workingData.characters.map((character, index) => {
      const localPreview = objectUrls.get(character._adminKey);
      const imageSource = localPreview || character.image || "assets/images/banner.svg";

      return `
        <article class="admin-character-editor" data-index="${index}">
          <div class="character-image-editor">
            <img class="character-preview" src="${escapeHtml(imageSource)}" alt="Предпросмотр">
            <label class="image-picker">
              Выбрать новую картинку
              <input class="character-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
            </label>
            <p class="image-path">
              ${localPreview
                ? "Новая картинка будет загружена при публикации."
                : escapeHtml(character.image || "Картинка не выбрана")}
            </p>
          </div>

          <div class="character-fields">
            <div class="character-editor-heading">
              <h3>${escapeHtml(character.name || `Персонаж ${index + 1}`)}</h3>
              <button class="delete-character" type="button">Удалить</button>
            </div>

            <label>
              <span>Имя</span>
              <input data-field="name" type="text" value="${escapeHtml(character.name)}">
            </label>

            <label>
              <span>Возраст</span>
              <input data-field="age" type="text" value="${escapeHtml(character.age)}">
            </label>

            <label class="wide">
              <span>Способности</span>
              <input data-field="ability" type="text" value="${escapeHtml(character.ability)}">
            </label>

            <label class="wide">
              <span>Описание</span>
              <textarea data-field="description">${escapeHtml(character.description)}</textarea>
            </label>
          </div>
        </article>
      `;
    }).join("");
  }

  function addCharacter() {
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
  }

  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showStatus("error", "Ошибка", "Выберите файл изображения.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showStatus("error", "Слишком большой файл", "Размер изображения должен быть не больше 15 МБ.");
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
  }

  async function reloadFromGitHub() {
    setBusy(true);
    showStatus("busy", "Загружаем данные", "Получаем последнюю версию с GitHub.");

    try {
      workingData = await OffSkullAdmin.loadRemoteData(session);
      imageFiles.clear();
      for (const url of objectUrls.values()) URL.revokeObjectURL(url);
      objectUrls.clear();
      assignKeys();
      renderCharacters();
      showStatus("success", "Данные обновлены", "Загружена последняя версия персонажей.");
    } catch (error) {
      showStatus("error", "Не удалось обновить", OffSkullAdmin.friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  function downloadBackup() {
    const content = OffSkullAdmin.makeContentFile(workingData);
    OffSkullAdmin.downloadText("content-backup.js", content);
    showStatus("success", "Резервная копия скачана", "Файл content-backup.js сохранён на компьютере.");
  }

  async function saveToGitHub() {
    if (!workingData.characters.length) {
      showStatus("error", "Нет персонажей", "Добавьте хотя бы одного персонажа.");
      return;
    }

    for (const character of workingData.characters) {
      if (!String(character.name || "").trim()) {
        showStatus("error", "Не заполнено имя", "У каждого персонажа должно быть имя.");
        return;
      }
    }

    setBusy(true);

    try {
      for (let index = 0; index < workingData.characters.length; index += 1) {
        const character = workingData.characters[index];
        const file = imageFiles.get(character._adminKey);
        if (!file) continue;

        showStatus(
          "busy",
          "Загружаем изображения",
          `${index + 1} из ${workingData.characters.length}: ${character.name}`
        );

        character.image = await OffSkullAdmin.uploadCharacterImage(file, character.name, session);
      }

      showStatus("busy", "Публикуем изменения", "Обновляем список персонажей.");
      await OffSkullAdmin.saveData(
        workingData,
        "Обновлены персонажи через панель администратора",
        session
      );

      imageFiles.clear();
      for (const url of objectUrls.values()) URL.revokeObjectURL(url);
      objectUrls.clear();
      renderCharacters();

      showStatus(
        "success",
        "Изменения опубликованы",
        "GitHub принял новые данные. Обновите страницу персонажей через несколько минут."
      );
    } catch (error) {
      showStatus("error", "Не удалось сохранить", OffSkullAdmin.friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  function cleanupCharacterResources(key) {
    const url = objectUrls.get(key);
    if (url) URL.revokeObjectURL(url);
    objectUrls.delete(key);
    imageFiles.delete(key);
  }

  function logout() {
    OffSkullAdmin.clearSession();
    location.replace("admin-login.html");
  }

  function setBusy(busy) {
    document.querySelectorAll("button").forEach(button => {
      button.disabled = busy;
    });
  }

  function showStatus(type, title, message) {
    statusBox.className = `admin-status visible ${type}`;
    statusBox.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;

    clearTimeout(showStatus.timer);
    if (type !== "busy") {
      showStatus.timer = setTimeout(() => statusBox.classList.remove("visible"), 9000);
    }
  }
})();
