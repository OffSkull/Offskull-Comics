(async () => {
  "use strict";

  const root = document.querySelector("#admin-root");
  const status = document.querySelector("#admin-status");
  const saveButton = document.querySelector("#save-site");
  const admin = window.OffSkullAdmin;

  const session = await admin.requireAdmin();
  if (!session) return;

  let state = await admin.loadData();
  state.schemaVersion = 2;

  render();

  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  root.addEventListener("click", handleClick);

  document.querySelector("#logout").addEventListener("click", async () => {
    await admin.signOut();
    location.replace("admin-login.html");
  });

  document.querySelector("#restore-seed").addEventListener("click", () => {
    if (!confirm("Вернуть стартовые комиксы, обложки и персонажей?")) return;
    state = window.OffSkullData.clone(window.OFFSKULL_SEED);
    render();
    message("Стартовые данные восстановлены в редакторе. Нажмите «Сохранить на сайт».", "success");
  });

  saveButton.addEventListener("click", saveAll);

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }

  function render() {
    root.innerHTML = `
      <section class="admin-section">
        <div class="admin-section-title"><div><p class="eyebrow">Главная страница</p><h2>Сайт и новость</h2></div></div>
        <div class="admin-grid two">
          <div class="admin-card">
            <h3>Тексты сайта</h3>
            ${field("Название сайта","site","name",state.site.name)}
            ${field("Заголовок баннера","site","heroTitle",state.site.heroTitle)}
            ${area("Описание баннера","site","heroText",state.site.heroText)}
            ${field("Имя автора","site","authorName",state.site.authorName)}
            ${field("Роль автора","site","authorRole",state.site.authorRole)}
            ${area("Описание автора","site","authorText",state.site.authorText)}
            <label>Фото автора<input type="file" accept="image/*" data-file="author"></label>
            <img class="admin-preview author" src="${esc(state.site.authorImage || "assets/images/author/author-placeholder.svg")}" alt="">
          </div>

          <div class="admin-card">
            <h3>Новость на баннере</h3>
            ${field("Маленькая надпись","news","label",state.heroNews.label)}
            ${field("Заголовок","news","title",state.heroNews.title)}
            ${area("Описание","news","text",state.heroNews.text)}
            ${field("Ссылка кнопки","news","link",state.heroNews.link)}
            ${field("Текст кнопки","news","buttonText",state.heroNews.buttonText)}
            <label class="check"><input type="checkbox" data-scope="news" data-field="visible" ${state.heroNews.visible !== false ? "checked" : ""}> Показывать новость</label>
            <label>Изображение новости<input type="file" accept="image/*" data-file="news"></label>
            <img class="admin-preview" src="${esc(state.heroNews.image || "assets/images/comics/ten-goroda/cover.png")}" alt="">
          </div>
        </div>
      </section>

      <section class="admin-section">
        <div class="admin-section-title">
          <div><p class="eyebrow">Каталог</p><h2>Комиксы</h2></div>
          <button class="button" type="button" data-action="add-comic">+ Добавить комикс</button>
        </div>
        <div class="admin-list">
          ${state.comics.map((comic, ci) => comicEditor(comic, ci)).join("")}
        </div>
      </section>

      <section class="admin-section">
        <div class="admin-section-title">
          <div><p class="eyebrow">Вселенная</p><h2>Персонажи</h2></div>
          <button class="button" type="button" data-action="add-character">+ Добавить персонажа</button>
        </div>
        <div class="admin-list">
          ${state.characters.map((character, ci) => characterEditor(character, ci)).join("")}
        </div>
      </section>
    `;
  }

  function field(label, scope, name, value, extra="") {
    return `<label>${label}<input type="text" value="${esc(value)}" data-scope="${scope}" data-field="${name}" ${extra}></label>`;
  }

  function area(label, scope, name, value) {
    return `<label>${label}<textarea data-scope="${scope}" data-field="${name}">${esc(value)}</textarea></label>`;
  }

  function comicEditor(comic, ci) {
    return `
      <article class="admin-card comic-editor" data-comic="${ci}">
        <div class="editor-head">
          <h3>${esc(comic.title || `Комикс ${ci + 1}`)}</h3>
          <div>
            <button class="mini" type="button" data-action="move-comic-up" data-comic="${ci}">↑</button>
            <button class="mini" type="button" data-action="move-comic-down" data-comic="${ci}">↓</button>
            <button class="mini danger" type="button" data-action="delete-comic" data-comic="${ci}">Удалить</button>
          </div>
        </div>
        <div class="admin-grid two">
          <div>
            ${field("ID","comic","id",comic.id,`data-comic="${ci}"`)}
            ${field("Название","comic","title",comic.title,`data-comic="${ci}"`)}
            ${areaComic("Описание","description",comic.description,ci)}
            ${field("Жанр","comic","genre",comic.genre,`data-comic="${ci}"`)}
            ${field("Возраст","comic","age",comic.age,`data-comic="${ci}"`)}
            ${field("Статус","comic","status",comic.status,`data-comic="${ci}"`)}
            <label class="check"><input type="checkbox" data-scope="comic" data-field="featured" data-comic="${ci}" ${comic.featured !== false ? "checked" : ""}> Показывать на главной</label>
          </div>
          <div>
            <label>Обложка<input type="file" accept="image/*" data-file="comic-cover" data-comic="${ci}"></label>
            <img class="admin-preview cover" src="${esc(comic.cover || "assets/images/hero-banner.png")}" alt="">
          </div>
        </div>
        <div class="subsection-head"><h4>Выпуски</h4><button class="button button-small" type="button" data-action="add-issue" data-comic="${ci}">+ Выпуск</button></div>
        <div class="issue-editors">
          ${(comic.issues || []).map((issue, ii) => issueEditor(issue, ci, ii)).join("")}
        </div>
      </article>
    `;
  }

  function areaComic(label, name, value, ci) {
    return `<label>${label}<textarea data-scope="comic" data-field="${name}" data-comic="${ci}">${esc(value)}</textarea></label>`;
  }

  function issueEditor(issue, ci, ii) {
    const pages = Array.isArray(issue.pages) ? issue.pages : [];
    return `
      <div class="issue-editor" data-comic="${ci}" data-issue="${ii}">
        <div class="editor-head">
          <strong>Выпуск ${esc(issue.number)}</strong>
          <div>
            <button class="mini" type="button" data-action="move-issue-up" data-comic="${ci}" data-issue="${ii}">↑</button>
            <button class="mini" type="button" data-action="move-issue-down" data-comic="${ci}" data-issue="${ii}">↓</button>
            <button class="mini danger" type="button" data-action="delete-issue" data-comic="${ci}" data-issue="${ii}">Удалить</button>
          </div>
        </div>
        <div class="admin-grid three">
          ${fieldIssue("Номер","number",issue.number,ci,ii)}
          ${fieldIssue("Название","title",issue.title,ci,ii)}
          ${fieldIssue("Дата","date",issue.date,ci,ii)}
        </div>
        <label>Добавить страницы<input type="file" multiple accept="image/*" data-file="issue-pages" data-comic="${ci}" data-issue="${ii}"></label>
        <div class="page-list">
          ${pages.map((page, pi) => `
            <div class="page-thumb">
              <img src="${esc(page)}" alt="Страница ${pi + 1}">
              <div>
                <button class="mini" type="button" data-action="move-page-up" data-comic="${ci}" data-issue="${ii}" data-page="${pi}">←</button>
                <button class="mini" type="button" data-action="move-page-down" data-comic="${ci}" data-issue="${ii}" data-page="${pi}">→</button>
                <button class="mini danger" type="button" data-action="delete-page" data-comic="${ci}" data-issue="${ii}" data-page="${pi}">×</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function fieldIssue(label, name, value, ci, ii) {
    return `<label>${label}<input type="text" value="${esc(value)}" data-scope="issue" data-field="${name}" data-comic="${ci}" data-issue="${ii}"></label>`;
  }

  function characterEditor(character, ci) {
    return `
      <article class="admin-card character-editor" data-character="${ci}">
        <div class="editor-head">
          <h3>${esc(character.name || `Персонаж ${ci + 1}`)}</h3>
          <div>
            <button class="mini" type="button" data-action="move-character-up" data-character="${ci}">↑</button>
            <button class="mini" type="button" data-action="move-character-down" data-character="${ci}">↓</button>
            <button class="mini danger" type="button" data-action="delete-character" data-character="${ci}">Удалить</button>
          </div>
        </div>
        <div class="admin-grid two">
          <div>
            ${fieldCharacter("ID","id",character.id,ci)}
            ${fieldCharacter("Имя","name",character.name,ci)}
            ${fieldCharacter("Возраст","age",character.age,ci)}
            ${fieldCharacter("Способности","ability",character.ability,ci)}
            <label>Описание<textarea data-scope="character" data-field="description" data-character="${ci}">${esc(character.description || "")}</textarea></label>
          </div>
          <div>
            <label>Фотография<input type="file" accept="image/*" data-file="character" data-character="${ci}"></label>
            <img class="admin-preview cover" src="${esc(character.image || "assets/images/author/author-placeholder.svg")}" alt="">
          </div>
        </div>
      </article>
    `;
  }

  function fieldCharacter(label, name, value, ci) {
    return `<label>${label}<input type="text" value="${esc(value)}" data-scope="character" data-field="${name}" data-character="${ci}"></label>`;
  }

  function handleInput(event) {
    const el = event.target;
    const scope = el.dataset.scope;
    if (!scope) return;
    const value = el.type === "checkbox" ? el.checked : el.value;

    if (scope === "site") state.site[el.dataset.field] = value;
    if (scope === "news") state.heroNews[el.dataset.field] = value;
    if (scope === "comic") state.comics[Number(el.dataset.comic)][el.dataset.field] = value;
    if (scope === "issue") state.comics[Number(el.dataset.comic)].issues[Number(el.dataset.issue)][el.dataset.field] =
      el.dataset.field === "number" ? Number(value) || value : value;
    if (scope === "character") state.characters[Number(el.dataset.character)][el.dataset.field] = value;
  }

  function handleChange(event) {
    handleInput(event);
    const el = event.target;
    if (!el.dataset.file) return;

    const files = [...(el.files || [])];
    if (!files.length) return;

    if (el.dataset.file === "author") {
      state.site.__imageFile = files[0];
      document.querySelector(".admin-preview.author").src = URL.createObjectURL(files[0]);
    }

    if (el.dataset.file === "news") {
      state.heroNews.__imageFile = files[0];
      el.closest(".admin-card").querySelector(".admin-preview").src = URL.createObjectURL(files[0]);
    }

    if (el.dataset.file === "comic-cover") {
      const comic = state.comics[Number(el.dataset.comic)];
      comic.__coverFile = files[0];
      el.closest(".admin-card").querySelector(".admin-preview.cover").src = URL.createObjectURL(files[0]);
    }

    if (el.dataset.file === "character") {
      const character = state.characters[Number(el.dataset.character)];
      character.__imageFile = files[0];
      el.closest(".admin-card").querySelector(".admin-preview.cover").src = URL.createObjectURL(files[0]);
    }

    if (el.dataset.file === "issue-pages") {
      const issue = state.comics[Number(el.dataset.comic)].issues[Number(el.dataset.issue)];
      issue.__newFiles = files.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true}));
      message(`Выбрано страниц: ${files.length}. Они загрузятся после сохранения.`, "busy");
    }
  }

  function handleClick(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const ci = Number(button.dataset.comic);
    const ii = Number(button.dataset.issue);
    const pi = Number(button.dataset.page);
    const ch = Number(button.dataset.character);

    if (action === "add-comic") {
      state.comics.push({
        id: `comic-${Date.now()}`,
        title: "Новый комикс",
        cover: "assets/images/hero-banner.png",
        description: "",
        genre: "",
        age: "12+",
        status: "Скоро",
        featured: true,
        issues: []
      });
    }

    if (action === "delete-comic" && confirm("Удалить комикс?")) state.comics.splice(ci,1);
    if (action === "move-comic-up") swap(state.comics, ci, ci-1);
    if (action === "move-comic-down") swap(state.comics, ci, ci+1);

    if (action === "add-issue") {
      const issues = state.comics[ci].issues ||= [];
      issues.push({ number: issues.length + 1, title: "Новый выпуск", date: "", pages: [] });
    }
    if (action === "delete-issue" && confirm("Удалить выпуск?")) state.comics[ci].issues.splice(ii,1);
    if (action === "move-issue-up") swap(state.comics[ci].issues, ii, ii-1);
    if (action === "move-issue-down") swap(state.comics[ci].issues, ii, ii+1);

    const pages = state.comics[ci]?.issues?.[ii]?.pages;
    if (action === "delete-page") pages.splice(pi,1);
    if (action === "move-page-up") swap(pages, pi, pi-1);
    if (action === "move-page-down") swap(pages, pi, pi+1);

    if (action === "add-character") {
      state.characters.push({
        id: `character-${Date.now()}`,
        name: "Новый персонаж",
        image: "assets/images/author/author-placeholder.svg",
        age: "",
        ability: "",
        description: ""
      });
    }
    if (action === "delete-character" && confirm("Удалить персонажа?")) state.characters.splice(ch,1);
    if (action === "move-character-up") swap(state.characters, ch, ch-1);
    if (action === "move-character-down") swap(state.characters, ch, ch+1);

    render();
  }

  function swap(array, a, b) {
    if (!array || b < 0 || b >= array.length) return;
    [array[a], array[b]] = [array[b], array[a]];
  }

  async function saveAll() {
    saveButton.disabled = true;
    saveButton.textContent = "Сохраняем…";
    message("Загружаем изображения и сохраняем данные…", "busy");

    try {
      if (state.site.__imageFile) {
        state.site.authorImage = await admin.upload(state.site.__imageFile, "author", "author");
      }
      if (state.heroNews.__imageFile) {
        state.heroNews.image = await admin.upload(state.heroNews.__imageFile, "news", state.heroNews.title || "news");
      }

      for (const comic of state.comics) {
        if (comic.__coverFile) {
          comic.cover = await admin.upload(comic.__coverFile, `comics/${comic.id}`, "cover");
        }

        for (const issue of comic.issues || []) {
          if (issue.__newFiles?.length) {
            for (const file of issue.__newFiles) {
              const url = await admin.upload(file, `comics/${comic.id}/issue-${issue.number}`, file.name.replace(/\.[^.]+$/,""));
              issue.pages.push(url);
            }
          }
        }
      }

      for (const character of state.characters) {
        if (character.__imageFile) {
          character.image = await admin.upload(character.__imageFile, "characters", character.name || character.id);
        }
      }

      state = await admin.saveData(state);
      render();
      message("Сайт сохранён. Откройте публичную страницу и нажмите Ctrl + F5.", "success");
    } catch (error) {
      console.error(error);
      message(error.message || "Не удалось сохранить сайт.", "error");
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Сохранить на сайт";
    }
  }

  function message(text, type) {
    status.textContent = text;
    status.className = `admin-message ${type || ""}`;
  }
})();
