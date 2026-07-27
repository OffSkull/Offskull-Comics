(async function () {
  "use strict";

  const fallbackData = window.OFFSKULL_DATA || {
    site: {
      name: "OffSkull Comics",
      heroTitle: "Мир авторских комиксов",
      heroText: "",
      authorName: "Автор",
      authorText: ""
    },
    comics: [],
    characters: []
  };

  const data = await window.OffSkullSiteData.load(fallbackData);
  window.OFFSKULL_DATA = data;

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function safeUrl(value, fallback = "assets/images/banner.svg") {
    const url = String(value || "").trim();
    if (!url) return fallback;
    if (/^javascript:/i.test(url)) return fallback;
    return escapeHtml(url);
  }

  function comicById(id) {
    if (!data.comics.length) return null;
    return data.comics.find(comic => comic.id === id) || data.comics[0];
  }

  function setSiteText() {
    document.querySelectorAll("[data-site-name]").forEach(element => {
      element.textContent = data.site.name || "OffSkull Comics";
    });

    document.querySelectorAll("[data-author-name]").forEach(element => {
      element.textContent = data.site.authorName || "Автор";
    });

    const year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  function renderHome() {
    const heroTitle = document.querySelector("#hero-title");
    if (!heroTitle) return;

    heroTitle.textContent = data.site.heroTitle || "Мир авторских комиксов";

    const heroText = document.querySelector("#hero-text");
    if (heroText) heroText.textContent = data.site.heroText || "";

    const featured = document.querySelector("#featured-comics");
    const readLink = document.querySelector("#hero-read-link");
    const visibleComics = data.comics.filter(comic => comic.featured !== false);
    const firstComic = visibleComics[0] || data.comics[0];

    if (readLink) {
      if (firstComic?.issues?.[0]?.pages?.length) {
        readLink.href =
          `reader.html?id=${encodeURIComponent(firstComic.id)}` +
          `&issue=${encodeURIComponent(firstComic.issues[0].number || 1)}&page=1`;
        readLink.hidden = false;
      } else {
        readLink.href = "comic.html";
        readLink.textContent = "Смотреть комиксы";
      }
    }

    if (!featured) return;

    if (!visibleComics.length) {
      featured.innerHTML = `
        <div class="empty-state">
          <strong>Комиксы скоро появятся</strong>
          <p>Автор ещё не опубликовал первый выпуск.</p>
        </div>
      `;
      return;
    }

    featured.innerHTML = visibleComics.map(comic => `
      <article class="comic-card">
        <a class="cover-wrap" href="comic.html?id=${encodeURIComponent(comic.id)}">
          <img src="${safeUrl(comic.cover)}" alt="Обложка комикса ${escapeHtml(comic.title)}">
          <span class="age-badge">${escapeHtml(comic.age || "")}</span>
        </a>
        <div class="comic-card-body">
          <p class="eyebrow">${escapeHtml(comic.genre || "")}</p>
          <h3>${escapeHtml(comic.title || "Без названия")}</h3>
          <p>${escapeHtml(comic.description || "")}</p>
          <a class="text-link" href="comic.html?id=${encodeURIComponent(comic.id)}">
            Открыть комикс →
          </a>
        </div>
      </article>
    `).join("");
  }

  function renderComic() {
    const container = document.querySelector("#comic-page");
    if (!container) return;

    const comic = comicById(qs("id"));

    if (!comic) {
      container.innerHTML = `
        <section class="section">
          <div class="empty-state">
            <strong>Комиксов пока нет</strong>
            <p>Первый комикс ещё не опубликован.</p>
          </div>
        </section>
      `;
      return;
    }

    const issues = Array.isArray(comic.issues) ? comic.issues : [];
    document.title = `${comic.title} — ${data.site.name || "OffSkull Comics"}`;

    container.innerHTML = `
      <section class="comic-hero section">
        <img class="comic-main-cover" src="${safeUrl(comic.cover)}" alt="Обложка ${escapeHtml(comic.title)}">
        <div>
          <p class="eyebrow">Комикс</p>
          <h1>${escapeHtml(comic.title)}</h1>
          <p class="lead">${escapeHtml(comic.description || "")}</p>
          <div class="meta-grid">
            <div><span>Жанр</span><strong>${escapeHtml(comic.genre || "Не указан")}</strong></div>
            <div><span>Возраст</span><strong>${escapeHtml(comic.age || "Не указан")}</strong></div>
            <div><span>Статус</span><strong>${escapeHtml(comic.status || "Не указан")}</strong></div>
            <div><span>Выпусков</span><strong>${issues.length}</strong></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Чтение</p>
          <h2>Список выпусков</h2>
        </div>
        <div class="issues-list">
          ${issues.length ? issues.map(issue => {
            const pages = Array.isArray(issue.pages) ? issue.pages : [];
            return `
              <article class="issue-row">
                <div class="issue-number">#${escapeHtml(issue.number || "")}</div>
                <div>
                  <h3>${escapeHtml(issue.title || `Выпуск ${issue.number || ""}`)}</h3>
                  <p>${pages.length} стр. · ${escapeHtml(issue.date || "")}</p>
                </div>
                ${pages.length
                  ? `<a class="button button-small" href="reader.html?id=${encodeURIComponent(comic.id)}&issue=${encodeURIComponent(issue.number || 1)}&page=1">Читать</a>`
                  : `<span>Страницы скоро появятся</span>`
                }
              </article>
            `;
          }).join("") : `
            <div class="empty-state">
              <strong>Выпусков пока нет</strong>
              <p>Автор ещё не загрузил страницы этого комикса.</p>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function renderReader() {
    const root = document.querySelector("#reader-page");
    if (!root) return;

    const comic = comicById(qs("id"));

    if (!comic) {
      root.innerHTML = `
        <div class="reader-toolbar">
          <a class="reader-back" href="index.html">← На главную</a>
        </div>
        <main class="reader-stage">
          <div class="empty-state"><strong>Комикс не найден</strong></div>
        </main>
      `;
      return;
    }

    const issues = Array.isArray(comic.issues) ? comic.issues : [];
    const issueNumber = Number(qs("issue") || 1);
    const issue = issues.find(item => Number(item.number) === issueNumber) || issues[0];
    const pages = Array.isArray(issue?.pages) ? issue.pages : [];

    if (!issue || !pages.length) {
      root.innerHTML = `
        <div class="reader-toolbar">
          <a class="reader-back" href="comic.html?id=${encodeURIComponent(comic.id)}">← К комиксу</a>
          <div><strong>${escapeHtml(comic.title)}</strong></div>
        </div>
        <main class="reader-stage">
          <div class="empty-state">
            <strong>Страницы пока не загружены</strong>
          </div>
        </main>
      `;
      return;
    }

    let page = Number(qs("page") || 1);
    page = Math.min(Math.max(page, 1), pages.length);

    document.title =
      `${comic.title}: ${issue.title || `Выпуск ${issue.number}`} — страница ${page}`;

    const previous = page > 1
      ? `reader.html?id=${encodeURIComponent(comic.id)}&issue=${encodeURIComponent(issue.number)}&page=${page - 1}`
      : `comic.html?id=${encodeURIComponent(comic.id)}`;

    const next = page < pages.length
      ? `reader.html?id=${encodeURIComponent(comic.id)}&issue=${encodeURIComponent(issue.number)}&page=${page + 1}`
      : `comic.html?id=${encodeURIComponent(comic.id)}`;

    root.innerHTML = `
      <div class="reader-toolbar">
        <a class="reader-back" href="comic.html?id=${encodeURIComponent(comic.id)}">← К выпускам</a>
        <div>
          <strong>${escapeHtml(comic.title)}</strong>
          <span>${escapeHtml(issue.title || `Выпуск ${issue.number}`)} · ${page}/${pages.length}</span>
        </div>
      </div>

      <main class="reader-stage">
        <a class="reader-arrow" href="${previous}" aria-label="Предыдущая страница">←</a>
        <img class="reader-image" src="${safeUrl(pages[page - 1])}" alt="${escapeHtml(comic.title)}, страница ${page}">
        <a class="reader-arrow" href="${next}" aria-label="Следующая страница">→</a>
      </main>

      <div class="reader-controls">
        <a class="button button-secondary" href="${previous}">← Назад</a>
        <span>Страница ${page} из ${pages.length}</span>
        <a class="button" href="${next}">
          ${page < pages.length ? "Далее →" : "Завершить"}
        </a>
      </div>
    `;
  }

  function renderCharacters() {
    const grid = document.querySelector("#characters-grid");
    if (!grid) return;

    if (!data.characters.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <strong>Персонажи скоро появятся</strong>
        </div>
      `;
      return;
    }

    grid.innerHTML = data.characters.map(character => `
      <article class="character-card">
        <img src="${safeUrl(character.image)}" alt="${escapeHtml(character.name)}">
        <div class="character-info">
          <h2>${escapeHtml(character.name)}</h2>
          <dl>
            <div>
              <dt>Возраст</dt>
              <dd>${escapeHtml(character.age || "Неизвестно")}</dd>
            </div>
            <div>
              <dt>Способности</dt>
              <dd>${escapeHtml(character.ability || "Не указаны")}</dd>
            </div>
          </dl>
          <p>${escapeHtml(character.description || "")}</p>
        </div>
      </article>
    `).join("");
  }

  function renderAuthor() {
    const name = document.querySelector("#author-name");
    if (!name) return;

    name.textContent = data.site.authorName || "Автор";

    const text = document.querySelector("#author-text");
    if (text) text.textContent = data.site.authorText || "";
  }

  function mobileMenu() {
    const button = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".site-nav");
    if (!button || !nav) return;

    button.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      button.setAttribute("aria-expanded", String(open));
    });
  }

  setSiteText();
  renderHome();
  renderComic();
  renderReader();
  renderCharacters();
  renderAuthor();
  mobileMenu();
})();
