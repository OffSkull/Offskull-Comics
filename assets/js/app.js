(function () {
  const data = window.OFFSKULL_DATA;

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function comicById(id) {
    return data.comics.find(c => c.id === id) || data.comics[0];
  }

  function setSiteText() {
    document.querySelectorAll("[data-site-name]").forEach(el => el.textContent = data.site.name);
    document.querySelectorAll("[data-author-name]").forEach(el => el.textContent = data.site.authorName);
    const year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  function renderHome() {
    const heroTitle = document.querySelector("#hero-title");
    if (!heroTitle) return;
    heroTitle.textContent = data.site.heroTitle;
    document.querySelector("#hero-text").textContent = data.site.heroText;

    const featured = document.querySelector("#featured-comics");
    featured.innerHTML = data.comics.map(comic => `
      <article class="comic-card">
        <a class="cover-wrap" href="comic.html?id=${comic.id}">
          <img src="${comic.cover}" alt="Обложка комикса ${comic.title}">
          <span class="age-badge">${comic.age}</span>
        </a>
        <div class="comic-card-body">
          <p class="eyebrow">${comic.genre}</p>
          <h3>${comic.title}</h3>
          <p>${comic.description}</p>
          <a class="text-link" href="comic.html?id=${comic.id}">Открыть комикс →</a>
        </div>
      </article>
    `).join("");
  }

  function renderComic() {
    const container = document.querySelector("#comic-page");
    if (!container) return;
    const comic = comicById(qs("id"));
    document.title = `${comic.title} — ${data.site.name}`;

    container.innerHTML = `
      <section class="comic-hero section">
        <img class="comic-main-cover" src="${comic.cover}" alt="Обложка ${comic.title}">
        <div>
          <p class="eyebrow">Комикс</p>
          <h1>${comic.title}</h1>
          <p class="lead">${comic.description}</p>
          <div class="meta-grid">
            <div><span>Жанр</span><strong>${comic.genre}</strong></div>
            <div><span>Возраст</span><strong>${comic.age}</strong></div>
            <div><span>Статус</span><strong>${comic.status}</strong></div>
            <div><span>Выпусков</span><strong>${comic.issues.length}</strong></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-heading">
          <p class="eyebrow">Чтение</p>
          <h2>Список выпусков</h2>
        </div>
        <div class="issues-list">
          ${comic.issues.map(issue => `
            <article class="issue-row">
              <div class="issue-number">#${issue.number}</div>
              <div>
                <h3>${issue.title}</h3>
                <p>${issue.pages.length} стр. · ${issue.date}</p>
              </div>
              <a class="button button-small" href="reader.html?id=${comic.id}&issue=${issue.number}&page=1">Читать</a>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderReader() {
    const root = document.querySelector("#reader-page");
    if (!root) return;
    const comic = comicById(qs("id"));
    const issueNumber = Number(qs("issue") || 1);
    const issue = comic.issues.find(i => i.number === issueNumber) || comic.issues[0];
    let page = Number(qs("page") || 1);
    page = Math.min(Math.max(page, 1), issue.pages.length);

    document.title = `${comic.title}: ${issue.title} — страница ${page}`;

    const prev = page > 1
      ? `reader.html?id=${comic.id}&issue=${issue.number}&page=${page - 1}`
      : `comic.html?id=${comic.id}`;
    const next = page < issue.pages.length
      ? `reader.html?id=${comic.id}&issue=${issue.number}&page=${page + 1}`
      : `comic.html?id=${comic.id}`;

    root.innerHTML = `
      <div class="reader-toolbar">
        <a class="reader-back" href="comic.html?id=${comic.id}">← К выпускам</a>
        <div>
          <strong>${comic.title}</strong>
          <span>${issue.title} · ${page}/${issue.pages.length}</span>
        </div>
      </div>

      <main class="reader-stage">
        <a class="reader-arrow" href="${prev}" aria-label="Предыдущая страница">←</a>
        <img class="reader-image" src="${issue.pages[page - 1]}" alt="${comic.title}, страница ${page}">
        <a class="reader-arrow" href="${next}" aria-label="Следующая страница">→</a>
      </main>

      <div class="reader-controls">
        <a class="button button-secondary" href="${prev}">← Назад</a>
        <span>Страница ${page} из ${issue.pages.length}</span>
        <a class="button" href="${next}">${page < issue.pages.length ? "Далее →" : "Завершить"}</a>
      </div>
    `;
  }

  function renderCharacters() {
    const grid = document.querySelector("#characters-grid");
    if (!grid) return;
    grid.innerHTML = data.characters.map(char => `
      <article class="character-card">
        <img src="${char.image}" alt="${char.name}">
        <div class="character-info">
          <h2>${char.name}</h2>
          <dl>
            <div><dt>Возраст</dt><dd>${char.age}</dd></div>
            <div><dt>Способности</dt><dd>${char.ability}</dd></div>
          </dl>
          <p>${char.description}</p>
        </div>
      </article>
    `).join("");
  }

  function renderAuthor() {
    const name = document.querySelector("#author-name");
    if (!name) return;
    name.textContent = data.site.authorName;
    document.querySelector("#author-text").textContent = data.site.authorText;
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
