(async () => {
  "use strict";

  const data = await window.OffSkullData.load();
  window.OFFSKULL_DATA = data;

  const page = document.body.dataset.page || "";

  const qs = name => new URLSearchParams(location.search).get(name);

  const escapeHtml = value =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const safeUrl = (value, fallback = "assets/images/hero-banner.png") => {
    const url = String(value || "").trim();
    if (!url || /^javascript:/i.test(url) || /^data:text\/html/i.test(url)) return fallback;
    return escapeHtml(url);
  };

  function setCommonText() {
    document.querySelectorAll("[data-site-name]").forEach(el => {
      el.textContent = data.site.name || "OffSkull Comics";
    });
    document.querySelectorAll("[data-author-name]").forEach(el => {
      el.textContent = data.site.authorName || "Автор";
    });
    document.querySelectorAll("[data-year]").forEach(el => {
      el.textContent = new Date().getFullYear();
    });
  }

  function card(comic) {
    const issues = Array.isArray(comic.issues) ? comic.issues : [];
    return `
      <article class="comic-card">
        <a class="cover-wrap" href="comic.html?id=${encodeURIComponent(comic.id)}">
          <img src="${safeUrl(comic.cover)}" alt="Обложка ${escapeHtml(comic.title)}">
          ${comic.age ? `<span class="age-badge">${escapeHtml(comic.age)}</span>` : ""}
        </a>
        <div class="comic-card-body">
          <p class="eyebrow">${escapeHtml(comic.genre || "Авторский комикс")}</p>
          <h2>${escapeHtml(comic.title)}</h2>
          <p>${escapeHtml(comic.description || "")}</p>
          <div class="card-footer">
            <span>${issues.length} выпуск(а)</span>
            <a class="text-link" href="comic.html?id=${encodeURIComponent(comic.id)}">Открыть →</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderHome() {
    const title = document.querySelector("#hero-title");
    if (!title) return;

    title.textContent = data.site.heroTitle || "Мир авторских комиксов";
    document.querySelector("#hero-text").textContent = data.site.heroText || "";

    const comics = data.comics.filter(comic => comic.featured !== false);
    const grid = document.querySelector("#featured-comics");
    grid.innerHTML = comics.length
      ? comics.map(card).join("")
      : `<div class="empty-state"><strong>Комиксы скоро появятся</strong></div>`;

    const first = comics[0] || data.comics[0];
    const read = document.querySelector("#hero-read-link");
    if (read) read.href = first ? `comic.html?id=${encodeURIComponent(first.id)}` : "comic.html";

    renderHeroNews();
  }

  function renderHeroNews() {
    const root = document.querySelector("#hero-feature-news");
    if (!root) return;

    const news = data.heroNews || {};
    if (news.visible === false || !String(news.title || "").trim()) {
      root.hidden = true;
      return;
    }

    root.hidden = false;
    root.querySelector("[data-news-image]").src = safeUrl(news.image);
    root.querySelector("[data-news-image]").alt = news.imageAlt || news.title || "Новость";
    root.querySelector("[data-news-label]").textContent = news.label || "Скоро";
    root.querySelector("[data-news-title]").textContent = news.title || "";
    root.querySelector("[data-news-text]").textContent = news.text || "";

    const link = root.querySelector("[data-news-link]");
    link.href = news.link || "comic.html";
    link.querySelector("span").textContent = news.buttonText || "Узнать больше";
  }

  function renderCatalog() {
    const root = document.querySelector("#comic-page");
    if (!root) return;

    const id = qs("id");
    if (!id) {
      root.innerHTML = `
        <section class="page-hero">
          <p class="eyebrow">Каталог OffSkull</p>
          <h1>Все комиксы</h1>
          <p>Выберите историю, чтобы открыть описание и список выпусков.</p>
        </section>
        <section class="section">
          <div class="comics-grid">
            ${data.comics.length ? data.comics.map(card).join("") : `<div class="empty-state"><strong>Комиксов пока нет</strong></div>`}
          </div>
        </section>
      `;
      return;
    }

    const comic = data.comics.find(item => String(item.id) === String(id));
    if (!comic) {
      root.innerHTML = `<section class="section"><div class="empty-state"><strong>Комикс не найден</strong><a class="button" href="comic.html">Все комиксы</a></div></section>`;
      return;
    }

    const issues = Array.isArray(comic.issues) ? comic.issues : [];
    document.title = `${comic.title} — ${data.site.name || "OffSkull Comics"}`;

    root.innerHTML = `
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
          <a class="button button-secondary" href="comic.html">← Все комиксы</a>
        </div>
      </section>
      <section class="section">
        <div class="section-heading"><div><p class="eyebrow">Чтение</p><h2>Список выпусков</h2></div></div>
        <div class="issues-list">
          ${issues.length ? issues.map(issue => {
            const pages = Array.isArray(issue.pages) ? issue.pages : [];
            return `
              <article class="issue-row">
                <div class="issue-number">#${escapeHtml(issue.number)}</div>
                <div><h3>${escapeHtml(issue.title || `Выпуск ${issue.number}`)}</h3><p>${pages.length} стр. · ${escapeHtml(issue.date || "")}</p></div>
                ${pages.length ? `<a class="button button-small" href="reader.html?id=${encodeURIComponent(comic.id)}&issue=${encodeURIComponent(issue.number)}">Читать</a>` : `<span>Скоро</span>`}
              </article>
            `;
          }).join("") : `<div class="empty-state"><strong>Выпусков пока нет</strong></div>`}
        </div>
      </section>
    `;
  }

  function renderCharacters() {
    const grid = document.querySelector("#characters-grid");
    if (!grid) return;

    grid.innerHTML = data.characters.length
      ? data.characters.map(character => `
          <article class="character-card">
            <img src="${safeUrl(character.image)}" alt="${escapeHtml(character.name)}">
            <div class="character-info">
              <p class="eyebrow">Персонаж</p>
              <h2>${escapeHtml(character.name)}</h2>
              <dl>
                <div><dt>Возраст</dt><dd>${escapeHtml(character.age || "Неизвестно")}</dd></div>
                <div><dt>Способности</dt><dd>${escapeHtml(character.ability || "Не указаны")}</dd></div>
              </dl>
              <p>${escapeHtml(character.description || "")}</p>
            </div>
          </article>
        `).join("")
      : `<div class="empty-state"><strong>Персонажи скоро появятся</strong></div>`;
  }

  function renderAuthor() {
    const name = document.querySelector("#author-name");
    if (!name) return;
    name.textContent = data.site.authorName || "Автор";
    document.querySelector("#author-role").textContent = data.site.authorRole || "Автор";
    document.querySelector("#author-text").textContent = data.site.authorText || "";
    document.querySelector("#author-image").src = safeUrl(data.site.authorImage, "assets/images/author/author-placeholder.svg");
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

  setCommonText();
  mobileMenu();

  if (page === "home") renderHome();
  if (page === "comics") renderCatalog();
  if (page === "characters") renderCharacters();
  if (page === "author") renderAuthor();
})();
