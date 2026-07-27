(function () {
  const fallbackComic = {
    id: "viking",
    title: "Викинг",
    cover: "assets/images/comics/viking/cover.svg",
    description: "История сурового воина, которому предстоит пройти через битвы, древние тайны и опасные земли, чтобы защитить свой народ и узнать правду о собственном прошлом.",
    genre: "Фэнтези, приключения, боевик",
    age: "16+",
    status: "Выходит",
    featured: true,
    issues: [
      {
        number: 1,
        title: "Начало пути",
        date: "27 июля 2026",
        pages: [
          "assets/images/comics/viking/issue-1/page-1.svg",
          "assets/images/comics/viking/issue-1/page-2.svg",
          "assets/images/comics/viking/issue-1/page-3.svg",
          "assets/images/comics/viking/issue-1/page-4.svg"
        ]
      }
    ]
  };

  const fallbackSite = {
    name: "OffSkull Comics",
    slogan: "Истории, которые не боятся темноты",
    heroTitle: "Мир авторских комиксов",
    heroText: "Читайте новые выпуски, знакомьтесь с героями и следите за развитием вселенной OffSkull Comics.",
    authorName: "Дмитрий Черепов",
    authorText: "Автор и создатель проекта OffSkull Comics."
  };

  const fallbackCharacters = [
    {
      name: "Американец",
      image: "assets/images/characters/char-1.svg",
      age: "29 лет",
      ability: "Невероятная уверенность и сила",
      description: "Всегда заканчивает начатое, даже когда никто не понимает, что именно он начал."
    },
    {
      name: "Крот",
      image: "assets/images/characters/char-2.svg",
      age: "Неизвестно",
      ability: "Подземные тоннели и чувство земли",
      description: "Может прорыть путь почти куда угодно. Иногда — не в ту сторону."
    },
    {
      name: "Виноград",
      image: "assets/images/characters/char-3.svg",
      age: "24 года",
      ability: "Управление лозами и взрывными ягодами",
      description: "Превращает силу природы в оружие и никогда не забывает про витамины."
    },
    {
      name: "Стапарь",
      image: "assets/images/characters/char-4.svg",
      age: "35 лет",
      ability: "Кратковременное бессмертие",
      description: "После особого напитка становится неуязвимым. Время действия ограничено."
    }
  ];

  let data = window.OFFSKULL_DATA;

  if (!data || typeof data !== "object") {
    data = {
      site: fallbackSite,
      comics: [fallbackComic],
      characters: fallbackCharacters
    };
    window.OFFSKULL_DATA = data;
  }

  if (!data.site || typeof data.site !== "object") {
    data.site = fallbackSite;
  }

  if (!Array.isArray(data.characters)) {
    data.characters = fallbackCharacters;
  }

  if (!Array.isArray(data.comics)) {
    data.comics = [];
  }

  if (data.comics.length === 0) {
    data.comics.push(fallbackComic);
  }

  function qs(name) {
    return new URLSearchParams(location.search).get(name);
  }

  function comicById(id) {
    return data.comics.find(comic => comic.id === id) || data.comics[0];
  }

  function setSiteText() {
    document.querySelectorAll("[data-site-name]").forEach(element => {
      element.textContent = data.site.name || fallbackSite.name;
    });

    document.querySelectorAll("[data-author-name]").forEach(element => {
      element.textContent = data.site.authorName || fallbackSite.authorName;
    });

    const year = document.querySelector("[data-year]");
    if (year) year.textContent = new Date().getFullYear();
  }

  function renderHome() {
    const heroTitle = document.querySelector("#hero-title");
    if (!heroTitle) return;

    heroTitle.textContent = data.site.heroTitle || fallbackSite.heroTitle;

    const heroText = document.querySelector("#hero-text");
    if (heroText) {
      heroText.textContent = data.site.heroText || fallbackSite.heroText;
    }

    const featured = document.querySelector("#featured-comics");
    if (!featured) return;

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
    if (!comic) return;

    document.title = `${comic.title} — ${data.site.name || fallbackSite.name}`;

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
    if (!comic) return;

    const issueNumber = Number(qs("issue") || 1);
    const issue = comic.issues.find(item => item.number === issueNumber) || comic.issues[0];
    if (!issue) return;

    let page = Number(qs("page") || 1);
    page = Math.min(Math.max(page, 1), issue.pages.length);

    const previousLink = page > 1
      ? `reader.html?id=${comic.id}&issue=${issue.number}&page=${page - 1}`
      : `comic.html?id=${comic.id}`;

    const nextLink = page < issue.pages.length
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
        <a class="reader-arrow" href="${previousLink}">←</a>
        <img class="reader-image" src="${issue.pages[page - 1]}" alt="${comic.title}, страница ${page}">
        <a class="reader-arrow" href="${nextLink}">→</a>
      </main>

      <div class="reader-controls">
        <a class="button button-secondary" href="${previousLink}">← Назад</a>
        <span>Страница ${page} из ${issue.pages.length}</span>
        <a class="button" href="${nextLink}">${page < issue.pages.length ? "Далее →" : "Завершить"}</a>
      </div>
    `;
  }

  function renderCharacters() {
    const grid = document.querySelector("#characters-grid");
    if (!grid) return;

    grid.innerHTML = data.characters.map(character => `
      <article class="character-card">
        <img src="${character.image}" alt="${character.name}">
        <div class="character-info">
          <h2>${character.name}</h2>
          <dl>
            <div><dt>Возраст</dt><dd>${character.age}</dd></div>
            <div><dt>Способности</dt><dd>${character.ability}</dd></div>
          </dl>
          <p>${character.description}</p>
        </div>
      </article>
    `).join("");
  }

  function renderAuthor() {
    const name = document.querySelector("#author-name");
    if (!name) return;

    name.textContent = data.site.authorName || fallbackSite.authorName;

    const text = document.querySelector("#author-text");
    if (text) {
      text.textContent = data.site.authorText || fallbackSite.authorText;
    }
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
