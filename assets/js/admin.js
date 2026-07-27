(() => {
  "use strict";

  const session = OffSkullAdmin.requireSession();
  if (!session) return;

  const fallbackData = {
    site: {
      name: "OffSkull Comics",
      authorName: "Дмитрий Черепов"
    },
    comics: [],
    characters: []
  };

  let workingData = JSON.parse(JSON.stringify(window.OFFSKULL_DATA || fallbackData));

  if (!workingData.site || typeof workingData.site !== "object") {
    workingData.site = fallbackData.site;
  }
  if (!Array.isArray(workingData.comics)) workingData.comics = [];
  if (!Array.isArray(workingData.characters)) workingData.characters = [];

  const characterFiles = new Map();
  const characterUrls = new Map();
  const coverFiles = new Map();
  const coverUrls = new Map();
  const pageFiles = new Map();
  const pageUrls = new Map();

  const comicList = document.querySelector("#admin-comic-list");
  const characterList = document.querySelector("#admin-character-list");
  const statusBox = document.querySelector("#admin-status");

  document.querySelector("#admin-session-repo").textContent =
    `${session.owner}/${session.repo} · ${session.branch}`;

  normalizeWorkingData();
  renderAll();

  document.querySelector("#admin-logout").addEventListener("click", logout);
  document.querySelector("#add-comic").addEventListener("click", addComic);
  document.querySelector("#add-character").addEventListener("click", addCharacter);
  document.querySelector("#reload-from-github").addEventListener("click", reloadFromGitHub);
  document.querySelector("#download-backup").addEventListener("click", downloadBackup);
  document.querySelector("#save-to-github").addEventListener("click", saveToGitHub);

  document.querySelectorAll("[data-admin-tab]").forEach(button => {
    button.addEventListener("click", () => openTab(button.dataset.adminTab));
  });

  comicList.addEventListener("input", handleComicInput);
  comicList.addEventListener("change", handleComicChange);
  comicList.addEventListener("click", handleComicClick);

  characterList.addEventListener("input", handleCharacterInput);
  characterList.addEventListener("change", handleCharacterChange);
  characterList.addEventListener("click", handleCharacterClick);

  function randomKey(prefix = "item") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function normalizeWorkingData() {
    workingData.comics.forEach(comic => {
      comic._adminKey = comic._adminKey || randomKey("comic");
      comic.id = String(comic.id || OffSkullAdmin.slugify(comic.title) || "comic");
      comic.title = String(comic.title || "Новый комикс");
      comic.cover = String(comic.cover || "assets/images/banner.svg");
      comic.description = String(comic.description || "");
      comic.genre = String(comic.genre || "");
      comic.age = String(comic.age || "16+");
      comic.status = String(comic.status || "Выходит");
      comic.featured = comic.featured !== false;
      if (!Array.isArray(comic.issues)) comic.issues = [];

      comic.issues.forEach((issue, issueIndex) => {
        issue._adminKey = issue._adminKey || randomKey("issue");
        issue.number = Number(issue.number) || issueIndex + 1;
        issue.title = String(issue.title || `Выпуск ${issue.number}`);
        issue.date = String(issue.date || "");
        if (!Array.isArray(issue.pages)) issue.pages = [];

        issue.pages = issue.pages.map(page => {
          if (typeof page === "string") {
            return {
              path: page,
              _adminKey: randomKey("page")
            };
          }

          return {
            path: String(page?.path || ""),
            _adminKey: page?._adminKey || randomKey("page")
          };
        });
      });
    });

    workingData.characters.forEach(character => {
      character._adminKey = character._adminKey || randomKey("character");
      character.name = String(character.name || "Новый персонаж");
      character.image = String(character.image || "assets/images/banner.svg");
      character.age = String(character.age || "");
      character.ability = String(character.ability || "");
      character.description = String(character.description || "");
    });
  }

  function renderAll() {
    renderComics();
    renderCharacters();
  }

  function openTab(name) {
    document.querySelectorAll("[data-admin-tab]").forEach(button => {
      button.classList.toggle("active", button.dataset.adminTab === name);
    });

    document.querySelectorAll("[data-admin-panel]").forEach(panel => {
      panel.hidden = panel.dataset.adminPanel !== name;
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderComics() {
    if (!workingData.comics.length) {
      comicList.innerHTML = `
        <div class="admin-empty-state">
          <strong>Комиксов пока нет</strong>
          <p>Нажмите «+ Добавить комикс», чтобы создать первый комикс.</p>
        </div>
      `;
      return;
    }

    comicList.innerHTML = workingData.comics.map((comic, comicIndex) => {
      const coverPreview = coverUrls.get(comic._adminKey) || comic.cover || "assets/images/banner.svg";

      return `
        <article class="admin-comic-editor" data-comic-index="${comicIndex}">
          <div class="admin-comic-heading">
            <div>
              <p class="eyebrow">Комикс ${comicIndex + 1}</p>
              <h3>${escapeHtml(comic.title)}</h3>
            </div>
            <div class="admin-item-actions">
              <a
                class="button button-secondary button-small"
                href="comic.html?id=${encodeURIComponent(comic.id)}"
                target="_blank"
                rel="noopener"
              >
                Открыть
              </a>
              <button class="delete-comic" type="button">Удалить комикс</button>
            </div>
          </div>

          <div class="admin-comic-main">
            <div class="comic-cover-editor">
              <img
                class="comic-cover-preview"
                src="${escapeHtml(coverPreview)}"
                alt="Обложка ${escapeHtml(comic.title)}"
              >
              <label class="image-picker">
                Выбрать новую обложку
                <input
                  class="comic-cover-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                >
              </label>
              <p class="image-path">
                ${coverUrls.has(comic._adminKey)
                  ? "Новая обложка будет загружена при сохранении."
                  : escapeHtml(comic.cover)}
              </p>
            </div>

            <div class="comic-fields">
              <label>
                <span>Название</span>
                <input
                  data-comic-field="title"
                  type="text"
                  value="${escapeHtml(comic.title)}"
                  placeholder="Название комикса"
                >
              </label>

              <label>
                <span>ID — адрес комикса</span>
                <input
                  data-comic-field="id"
                  type="text"
                  value="${escapeHtml(comic.id)}"
                  placeholder="viking"
                >
                <small>Только английские буквы, цифры и дефисы.</small>
              </label>

              <label>
                <span>Жанр</span>
                <input
                  data-comic-field="genre"
                  type="text"
                  value="${escapeHtml(comic.genre)}"
                  placeholder="Фэнтези, приключения"
                >
              </label>

              <label>
                <span>Возраст</span>
                <input
                  data-comic-field="age"
                  type="text"
                  value="${escapeHtml(comic.age)}"
                  placeholder="16+"
                >
              </label>

              <label>
                <span>Статус</span>
                <select data-comic-field="status">
                  ${["Выходит", "Завершён", "Скоро", "Приостановлен"].map(status => `
                    <option value="${status}" ${comic.status === status ? "selected" : ""}>
                      ${status}
                    </option>
                  `).join("")}
                </select>
              </label>

              <label class="comic-featured-label">
                <input
                  data-comic-field="featured"
                  type="checkbox"
                  ${comic.featured ? "checked" : ""}
                >
                <span>Показывать на главной странице</span>
              </label>

              <label class="wide">
                <span>Описание</span>
                <textarea
                  data-comic-field="description"
                  placeholder="Краткое описание комикса"
                >${escapeHtml(comic.description)}</textarea>
              </label>
            </div>
          </div>

          <div class="admin-issues-section">
            <div class="admin-subheading">
              <div>
                <h4>Выпуски и страницы</h4>
                <p>Страницы будут показаны читателю в указанном ниже порядке.</p>
              </div>
              <button class="button button-secondary button-small add-issue" type="button">
                + Добавить выпуск
              </button>
            </div>

            <div class="admin-issue-list">
              ${comic.issues.length
                ? comic.issues.map((issue, issueIndex) =>
                    renderIssue(comicIndex, issue, issueIndex)
                  ).join("")
                : `
                  <div class="admin-empty-state compact">
                    <strong>Выпусков пока нет</strong>
                    <p>Добавьте выпуск, затем загрузите его страницы.</p>
                  </div>
                `}
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderIssue(comicIndex, issue, issueIndex) {
    return `
      <article
        class="admin-issue-editor"
        data-comic-index="${comicIndex}"
        data-issue-index="${issueIndex}"
      >
        <div class="issue-editor-heading">
          <h5>Выпуск ${issue.number}</h5>
          <div class="admin-item-actions">
            <button class="move-issue" data-direction="-1" type="button" title="Поднять выпуск">↑</button>
            <button class="move-issue" data-direction="1" type="button" title="Опустить выпуск">↓</button>
            <button class="delete-issue" type="button">Удалить выпуск</button>
          </div>
        </div>

        <div class="issue-fields">
          <label>
            <span>Номер</span>
            <input
              data-issue-field="number"
              type="number"
              min="1"
              value="${escapeHtml(issue.number)}"
            >
          </label>

          <label>
            <span>Название выпуска</span>
            <input
              data-issue-field="title"
              type="text"
              value="${escapeHtml(issue.title)}"
              placeholder="Начало пути"
            >
          </label>

          <label>
            <span>Дата</span>
            <input
              data-issue-field="date"
              type="text"
              value="${escapeHtml(issue.date)}"
              placeholder="27 июля 2026"
            >
          </label>
        </div>

        <div class="page-upload-row">
          <label class="image-picker page-picker">
            + Выбрать страницы
            <input
              class="comic-pages-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
            >
          </label>
          <p>
            Можно выбрать сразу несколько файлов. Перед выбором назовите их
            page-1, page-2, page-3 — браузер обычно добавит их по имени.
          </p>
        </div>

        <div class="admin-pages-grid">
          ${issue.pages.length
            ? issue.pages.map((page, pageIndex) =>
                renderPage(page, pageIndex)
              ).join("")
            : `
              <div class="admin-empty-pages">
                Страницы пока не загружены.
              </div>
            `}
        </div>
      </article>
    `;
  }

  function renderPage(page, pageIndex) {
    const preview = pageUrls.get(page._adminKey) || page.path || "assets/images/banner.svg";

    return `
      <article class="admin-page-card" data-page-index="${pageIndex}">
        <span class="admin-page-number">${pageIndex + 1}</span>
        <img src="${escapeHtml(preview)}" alt="Страница ${pageIndex + 1}">
        <div class="admin-page-actions">
          <button class="move-page" data-direction="-1" type="button" title="Переместить влево">←</button>
          <button class="move-page" data-direction="1" type="button" title="Переместить вправо">→</button>
          <button class="delete-page" type="button" title="Удалить из выпуска">×</button>
        </div>
      </article>
    `;
  }

  function renderCharacters() {
    if (!workingData.characters.length) {
      characterList.innerHTML = `
        <div class="admin-empty-state">
          <strong>Персонажей пока нет</strong>
          <p>Нажмите «+ Добавить персонажа».</p>
        </div>
      `;
      return;
    }

    characterList.innerHTML = workingData.characters.map((character, index) => {
      const localPreview = characterUrls.get(character._adminKey);
      const imageSource = localPreview || character.image || "assets/images/banner.svg";

      return `
        <article class="admin-character-editor" data-character-index="${index}">
          <div class="character-image-editor">
            <img class="character-preview" src="${escapeHtml(imageSource)}" alt="Предпросмотр">
            <label class="image-picker">
              Выбрать новую картинку
              <input
                class="character-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
              >
            </label>
            <p class="image-path">
              ${localPreview
                ? "Новая картинка будет загружена при сохранении."
                : escapeHtml(character.image)}
            </p>
          </div>

          <div class="character-fields">
            <div class="character-editor-heading">
              <h3>${escapeHtml(character.name)}</h3>
              <button class="delete-character" type="button">Удалить</button>
            </div>

            <label>
              <span>Имя</span>
              <input
                data-character-field="name"
                type="text"
                value="${escapeHtml(character.name)}"
              >
            </label>

            <label>
              <span>Возраст</span>
              <input
                data-character-field="age"
                type="text"
                value="${escapeHtml(character.age)}"
              >
            </label>

            <label class="wide">
              <span>Способности</span>
              <input
                data-character-field="ability"
                type="text"
                value="${escapeHtml(character.ability)}"
              >
            </label>

            <label class="wide">
              <span>Описание</span>
              <textarea data-character-field="description">${escapeHtml(character.description)}</textarea>
            </label>
          </div>
        </article>
      `;
    }).join("");
  }

  function handleComicInput(event) {
    const editor = event.target.closest(".admin-comic-editor");
    if (!editor) return;

    const comicIndex = Number(editor.dataset.comicIndex);
    const comic = workingData.comics[comicIndex];

    const comicField = event.target.dataset.comicField;
    if (comicField) {
      if (event.target.type === "checkbox") {
        comic[comicField] = event.target.checked;
      } else {
        comic[comicField] = event.target.value;
      }

      if (comicField === "id") {
        comic.id = OffSkullAdmin.slugify(comic.id);
      }

      return;
    }

    const issueEditor = event.target.closest(".admin-issue-editor");
    const issueField = event.target.dataset.issueField;

    if (issueEditor && issueField) {
      const issueIndex = Number(issueEditor.dataset.issueIndex);
      const issue = comic.issues[issueIndex];

      issue[issueField] = issueField === "number"
        ? Math.max(1, Number(event.target.value) || 1)
        : event.target.value;
    }
  }

  function handleComicChange(event) {
    const editor = event.target.closest(".admin-comic-editor");
    if (!editor) return;

    const comicIndex = Number(editor.dataset.comicIndex);
    const comic = workingData.comics[comicIndex];

    if (event.target.classList.contains("comic-cover-input")) {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!validateLocalImage(file)) {
        event.target.value = "";
        return;
      }

      replaceObjectUrl(coverUrls, comic._adminKey, file);
      coverFiles.set(comic._adminKey, file);
      renderComics();
      return;
    }

    if (event.target.classList.contains("comic-pages-input")) {
      const issueEditor = event.target.closest(".admin-issue-editor");
      const issueIndex = Number(issueEditor.dataset.issueIndex);
      const issue = comic.issues[issueIndex];
      const files = Array.from(event.target.files || []);

      if (!files.length) return;

      files
        .sort((a, b) => a.name.localeCompare(b.name, "ru", {
          numeric: true,
          sensitivity: "base"
        }))
        .forEach(file => {
          if (!validateLocalImage(file, false)) return;

          const page = {
            path: "",
            _adminKey: randomKey("page")
          };

          pageFiles.set(page._adminKey, file);
          pageUrls.set(page._adminKey, URL.createObjectURL(file));
          issue.pages.push(page);
        });

      renderComics();
    }
  }

  function handleComicClick(event) {
    const editor = event.target.closest(".admin-comic-editor");
    if (!editor) return;

    const comicIndex = Number(editor.dataset.comicIndex);
    const comic = workingData.comics[comicIndex];

    if (event.target.closest(".delete-comic")) {
      if (!confirm(`Удалить комикс «${comic.title}» из сайта?`)) return;

      cleanupComicResources(comic);
      workingData.comics.splice(comicIndex, 1);
      renderComics();
      return;
    }

    if (event.target.closest(".add-issue")) {
      const nextNumber = comic.issues.length
        ? Math.max(...comic.issues.map(issue => Number(issue.number) || 0)) + 1
        : 1;

      comic.issues.push({
        number: nextNumber,
        title: `Выпуск ${nextNumber}`,
        date: "",
        pages: [],
        _adminKey: randomKey("issue")
      });

      renderComics();
      return;
    }

    const issueEditor = event.target.closest(".admin-issue-editor");
    if (!issueEditor) return;

    const issueIndex = Number(issueEditor.dataset.issueIndex);
    const issue = comic.issues[issueIndex];

    const deleteIssue = event.target.closest(".delete-issue");
    if (deleteIssue) {
      if (!confirm(`Удалить выпуск «${issue.title}» из списка?`)) return;

      cleanupIssueResources(issue);
      comic.issues.splice(issueIndex, 1);
      renderComics();
      return;
    }

    const moveIssue = event.target.closest(".move-issue");
    if (moveIssue) {
      moveArrayItem(
        comic.issues,
        issueIndex,
        issueIndex + Number(moveIssue.dataset.direction)
      );
      renderComics();
      return;
    }

    const pageCard = event.target.closest(".admin-page-card");
    if (!pageCard) return;

    const pageIndex = Number(pageCard.dataset.pageIndex);
    const page = issue.pages[pageIndex];

    if (event.target.closest(".delete-page")) {
      cleanupPageResources(page);
      issue.pages.splice(pageIndex, 1);
      renderComics();
      return;
    }

    const movePage = event.target.closest(".move-page");
    if (movePage) {
      moveArrayItem(
        issue.pages,
        pageIndex,
        pageIndex + Number(movePage.dataset.direction)
      );
      renderComics();
    }
  }

  function handleCharacterInput(event) {
    const field = event.target.dataset.characterField;
    if (!field) return;

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.characterIndex);
    workingData.characters[index][field] = event.target.value;
  }

  function handleCharacterChange(event) {
    if (!event.target.classList.contains("character-image-input")) return;

    const file = event.target.files?.[0];
    if (!file || !validateLocalImage(file)) return;

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.characterIndex);
    const character = workingData.characters[index];

    replaceObjectUrl(characterUrls, character._adminKey, file);
    characterFiles.set(character._adminKey, file);
    renderCharacters();
  }

  function handleCharacterClick(event) {
    if (!event.target.closest(".delete-character")) return;

    const editor = event.target.closest(".admin-character-editor");
    const index = Number(editor.dataset.characterIndex);
    const character = workingData.characters[index];

    if (!confirm(`Удалить персонажа «${character.name}» из сайта?`)) return;

    cleanupCharacterResources(character);
    workingData.characters.splice(index, 1);
    renderCharacters();
  }

  function addComic() {
    const number = workingData.comics.length + 1;
    const comic = {
      id: `new-comic-${number}`,
      title: `Новый комикс ${number}`,
      cover: "assets/images/banner.svg",
      description: "",
      genre: "Приключения",
      age: "16+",
      status: "Скоро",
      featured: true,
      issues: [],
      _adminKey: randomKey("comic")
    };

    workingData.comics.push(comic);
    openTab("comics");
    renderComics();

    comicList.lastElementChild?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function addCharacter() {
    workingData.characters.push({
      name: "Новый персонаж",
      image: "assets/images/banner.svg",
      age: "Неизвестно",
      ability: "Укажите способности",
      description: "Добавьте описание персонажа.",
      _adminKey: randomKey("character")
    });

    openTab("characters");
    renderCharacters();

    characterList.lastElementChild?.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function validateLocalImage(file, showError = true) {
    if (!String(file.type || "").startsWith("image/")) {
      if (showError) showStatus("error", "Неверный файл", "Выберите JPG, PNG, WEBP или GIF.");
      return false;
    }

    if (file.size > 20 * 1024 * 1024) {
      if (showError) showStatus("error", "Слишком большой файл", "Размер одного изображения — не больше 20 МБ.");
      return false;
    }

    return true;
  }

  function replaceObjectUrl(map, key, file) {
    const previous = map.get(key);
    if (previous) URL.revokeObjectURL(previous);
    map.set(key, URL.createObjectURL(file));
  }

  function moveArrayItem(array, from, to) {
    if (to < 0 || to >= array.length || from === to) return;
    const [item] = array.splice(from, 1);
    array.splice(to, 0, item);
  }

  async function reloadFromGitHub() {
    setBusy(true);
    showStatus("busy", "Загружаем данные", "Получаем последнюю версию content.js.");

    try {
      clearPendingFiles();
      workingData = await OffSkullAdmin.loadRemoteData(session);

      if (!workingData.site || typeof workingData.site !== "object") {
        workingData.site = fallbackData.site;
      }
      if (!Array.isArray(workingData.comics)) workingData.comics = [];
      if (!Array.isArray(workingData.characters)) workingData.characters = [];

      normalizeWorkingData();
      renderAll();

      showStatus(
        "success",
        "Данные обновлены",
        "Загружена последняя версия комиксов и персонажей."
      );
    } catch (error) {
      showStatus("error", "Не удалось обновить", OffSkullAdmin.friendlyError(error));
    } finally {
      setBusy(false);
    }
  }

  function downloadBackup() {
    OffSkullAdmin.downloadText(
      "offskull-content-backup.js",
      OffSkullAdmin.makeContentFile(workingData)
    );

    showStatus(
      "success",
      "Резервная копия скачана",
      "Сохранён файл offskull-content-backup.js."
    );
  }

  function validateBeforeSave() {
    const usedIds = new Set();

    for (const comic of workingData.comics) {
      comic.title = String(comic.title || "").trim();
      comic.id = OffSkullAdmin.slugify(comic.id || comic.title);

      if (!comic.title) {
        throw new Error("У каждого комикса должно быть название.");
      }

      if (!comic.id) {
        throw new Error(`Не удалось создать ID для комикса «${comic.title}».`);
      }

      if (usedIds.has(comic.id)) {
        throw new Error(`ID «${comic.id}» используется у двух комиксов.`);
      }

      usedIds.add(comic.id);

      for (const issue of comic.issues) {
        issue.number = Math.max(1, Number(issue.number) || 1);
        issue.title = String(issue.title || `Выпуск ${issue.number}`).trim();
      }
    }

    for (const character of workingData.characters) {
      if (!String(character.name || "").trim()) {
        throw new Error("У каждого персонажа должно быть имя.");
      }
    }
  }

  async function saveToGitHub() {
    try {
      validateBeforeSave();
    } catch (error) {
      showStatus("error", "Проверьте данные", error.message);
      return;
    }

    setBusy(true);

    try {
      let uploadCounter = 0;
      const totalUploads =
        characterFiles.size +
        coverFiles.size +
        pageFiles.size;

      for (const character of workingData.characters) {
        const file = characterFiles.get(character._adminKey);
        if (!file) continue;

        uploadCounter += 1;
        showUploadProgress(uploadCounter, totalUploads, `Персонаж: ${character.name}`);

        character.image = await OffSkullAdmin.uploadCharacterImage(
          file,
          character.name,
          session
        );
      }

      for (const comic of workingData.comics) {
        const coverFile = coverFiles.get(comic._adminKey);

        if (coverFile) {
          uploadCounter += 1;
          showUploadProgress(uploadCounter, totalUploads, `Обложка: ${comic.title}`);

          comic.cover = await OffSkullAdmin.uploadComicCover(
            coverFile,
            comic.id,
            comic.title,
            session
          );
        }

        for (const issue of comic.issues) {
          for (let pageIndex = 0; pageIndex < issue.pages.length; pageIndex += 1) {
            const page = issue.pages[pageIndex];
            const file = pageFiles.get(page._adminKey);
            if (!file) continue;

            uploadCounter += 1;
            showUploadProgress(
              uploadCounter,
              totalUploads,
              `${comic.title}, выпуск ${issue.number}, страница ${pageIndex + 1}`
            );

            page.path = await OffSkullAdmin.uploadComicPage(
              file,
              comic.id,
              issue.number,
              pageIndex + 1,
              session
            );
          }
        }
      }

      showStatus(
        "busy",
        "Публикуем данные",
        "Обновляем assets/js/content.js."
      );

      await OffSkullAdmin.saveData(
        workingData,
        "Обновлены комиксы, страницы и персонажи через админ-панель",
        session
      );

      clearPendingFiles();
      normalizeWorkingData();
      renderAll();

      showStatus(
        "success",
        "Сайт обновлён",
        "Комиксы, обложки, выпуски и страницы сохранены. Обновите сайт через Ctrl + F5."
      );
    } catch (error) {
      showStatus(
        "error",
        "Не удалось сохранить",
        OffSkullAdmin.friendlyError(error)
      );
    } finally {
      setBusy(false);
    }
  }

  function showUploadProgress(current, total, name) {
    showStatus(
      "busy",
      "Загружаем изображения",
      `${current} из ${total}: ${name}`
    );
  }

  function clearPendingFiles() {
    characterFiles.clear();
    coverFiles.clear();
    pageFiles.clear();

    for (const url of characterUrls.values()) URL.revokeObjectURL(url);
    for (const url of coverUrls.values()) URL.revokeObjectURL(url);
    for (const url of pageUrls.values()) URL.revokeObjectURL(url);

    characterUrls.clear();
    coverUrls.clear();
    pageUrls.clear();
  }

  function cleanupCharacterResources(character) {
    const url = characterUrls.get(character._adminKey);
    if (url) URL.revokeObjectURL(url);
    characterUrls.delete(character._adminKey);
    characterFiles.delete(character._adminKey);
  }

  function cleanupPageResources(page) {
    const url = pageUrls.get(page._adminKey);
    if (url) URL.revokeObjectURL(url);
    pageUrls.delete(page._adminKey);
    pageFiles.delete(page._adminKey);
  }

  function cleanupIssueResources(issue) {
    issue.pages.forEach(cleanupPageResources);
  }

  function cleanupComicResources(comic) {
    const coverUrl = coverUrls.get(comic._adminKey);
    if (coverUrl) URL.revokeObjectURL(coverUrl);
    coverUrls.delete(comic._adminKey);
    coverFiles.delete(comic._adminKey);
    comic.issues.forEach(cleanupIssueResources);
  }

  function logout() {
    OffSkullAdmin.clearSession();
    location.replace("admin-login.html");
  }

  function setBusy(busy) {
    document.querySelectorAll("button, input, textarea, select").forEach(element => {
      element.disabled = busy;
    });
  }

  function showStatus(type, title, message) {
    statusBox.className = `admin-status visible ${type}`;
    statusBox.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
    `;

    clearTimeout(showStatus.timer);

    if (type !== "busy") {
      showStatus.timer = setTimeout(() => {
        statusBox.classList.remove("visible");
      }, 10000);
    }
  }
})();
