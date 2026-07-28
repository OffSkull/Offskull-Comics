(async function () {
  "use strict";

  /*
   * Резервные данные из content.js.
   */

  const fallbackData = normalizeData(
    window.OFFSKULL_DATA || {
      site: {
        name: "OffSkull Comics",
        heroTitle: "Мир авторских комиксов",
        heroText: "",
        authorName: "Автор",
        authorText: ""
      },

      comics: [],
      characters: []
    }
  );

  /*
   * Пытаемся загрузить данные из Supabase.
   */

  let remoteData = fallbackData;

  try {
    if (window.OffSkullSiteData?.load) {
      remoteData = normalizeData(
        await window.OffSkullSiteData.load(
          fallbackData
        )
      );
    }
  } catch (error) {
    console.warn(
      "Не удалось загрузить данные из Supabase. Используется content.js.",
      error
    );
  }

  /*
   * Объединяем данные content.js и Supabase.
   *
   * Благодаря этому старые персонажи и комиксы
   * не пропадут, даже если Supabase временно пуст.
   */

  const data = {
    ...fallbackData,
    ...remoteData,

    site: {
      ...(fallbackData.site || {}),
      ...(remoteData.site || {})
    },

    comics: mergeById(
      fallbackData.comics,
      remoteData.comics
    ),

    characters: mergeById(
      fallbackData.characters,
      remoteData.characters
    )
  };

  window.OFFSKULL_DATA = data;

  /*
   * Исправляем структуру данных.
   */

  function normalizeData(value) {
    const source =
      value && typeof value === "object"
        ? JSON.parse(
            JSON.stringify(value)
          )
        : {};

    if (
      !source.site ||
      typeof source.site !== "object"
    ) {
      source.site = {};
    }

    source.comics =
      Array.isArray(source.comics)
        ? source.comics.map(
            (comic, index) => {
              const title =
                String(
                  comic?.title ||
                  `Комикс ${index + 1}`
                ).trim();

              return {
                ...comic,

                id: String(
                  comic?.id ||
                  slugify(title) ||
                  `comic-${index + 1}`
                ),

                title,

                issues:
                  Array.isArray(
                    comic?.issues
                  )
                    ? comic.issues.map(
                        (
                          issue,
                          issueIndex
                        ) => ({
                          ...issue,

                          number:
                            issue?.number ??
                            issueIndex + 1,

                          pages:
                            Array.isArray(
                              issue?.pages
                            )
                              ? issue.pages
                                  .filter(
                                    Boolean
                                  )
                              : []
                        })
                      )
                    : []
              };
            }
          )
        : [];

    source.characters =
      Array.isArray(
        source.characters
      )
        ? source.characters.map(
            (
              character,
              index
            ) => {
              const name =
                String(
                  character?.name ||
                  `Персонаж ${
                    index + 1
                  }`
                ).trim();

              return {
                ...character,

                id: String(
                  character?.id ||
                  slugify(name) ||
                  `character-${
                    index + 1
                  }`
                ),

                name
              };
            }
          )
        : [];

    return source;
  }

  /*
   * Объединение объектов без повторов.
   */

  function mergeById(
    localItems,
    remoteItems
  ) {
    const result = new Map();

    const addItems = items => {
      if (!Array.isArray(items)) {
        return;
      }

      items.forEach(
        (item, index) => {
          const key =
            String(
              item?.id ||
              slugify(
                item?.title ||
                item?.name
              ) ||
              `item-${index + 1}`
            );

          result.set(
            key,
            item
          );
        }
      );
    };

    addItems(localItems);
    addItems(remoteItems);

    return Array.from(
      result.values()
    );
  }

  /*
   * Создание ID из русского названия.
   */

  function slugify(value) {
    const map = {
      а: "a",
      б: "b",
      в: "v",
      г: "g",
      д: "d",
      е: "e",
      ё: "e",
      ж: "zh",
      з: "z",
      и: "i",
      й: "y",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "h",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "sch",
      ы: "y",
      э: "e",
      ю: "yu",
      я: "ya",
      ь: "",
      ъ: ""
    };

    return String(
      value || ""
    )
      .toLowerCase()
      .split("")
      .map(
        character =>
          map[character] ??
          character
      )
      .join("")
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      );
  }

  /*
   * Получение параметра из адреса.
   */

  function qs(name) {
    return new URLSearchParams(
      window.location.search
    ).get(name);
  }

  /*
   * Защита текста перед выводом.
   */

  function escapeHtml(value) {
    return String(
      value ?? ""
    )
      .replaceAll(
        "&",
        "&amp;"
      )
      .replaceAll(
        "<",
        "&lt;"
      )
      .replaceAll(
        ">",
        "&gt;"
      )
      .replaceAll(
        '"',
        "&quot;"
      )
      .replaceAll(
        "'",
        "&#039;"
      );
  }

  /*
   * Безопасная ссылка на изображение.
   */

  function safeUrl(
    value,
    fallback =
      "assets/images/banner.svg"
  ) {
    const url =
      String(
        value || ""
      ).trim();

    if (
      !url ||
      /^javascript:/i.test(url) ||
      /^data:text\/html/i.test(
        url
      )
    ) {
      return fallback;
    }

    return escapeHtml(url);
  }

  /*
   * Поиск комикса по ID.
   */

  function comicById(id) {
    if (!data.comics.length) {
      return null;
    }

    if (!id) {
      return data.comics[0];
    }

    return (
      data.comics.find(
        comic =>
          String(comic.id) ===
          String(id)
      ) || null
    );
  }

  /*
   * Имя сайта, имя автора и год.
   */

  function setSiteText() {
    document
      .querySelectorAll(
        "[data-site-name]"
      )
      .forEach(element => {
        element.textContent =
          data.site.name ||
          "OffSkull Comics";
      });

    document
      .querySelectorAll(
        "[data-author-name]"
      )
      .forEach(element => {
        element.textContent =
          data.site.authorName ||
          "Автор";
      });

    const year =
      document.querySelector(
        "[data-year]"
      );

    if (year) {
      year.textContent =
        new Date()
          .getFullYear();
    }
  }

  /*
   * Создание карточки комикса.
   */

  function createComicCard(
    comic
  ) {
    const issues =
      Array.isArray(
        comic.issues
      )
        ? comic.issues
        : [];

    return `
      <article class="comic-card">

        <a
          class="cover-wrap"
          href="comic.html?id=${encodeURIComponent(
            comic.id
          )}"
        >

          <img
            src="${safeUrl(
              comic.cover
            )}"
            alt="Обложка комикса ${escapeHtml(
              comic.title
            )}"
          >

          ${
            comic.age
              ? `
                <span class="age-badge">
                  ${escapeHtml(
                    comic.age
                  )}
                </span>
              `
              : ""
          }

        </a>

        <div class="comic-card-body">

          <p class="eyebrow">
            ${escapeHtml(
              comic.genre ||
              "Авторский комикс"
            )}
          </p>

          <h3>
            ${escapeHtml(
              comic.title ||
              "Без названия"
            )}
          </h3>

          <p>
            ${escapeHtml(
              comic.description ||
              "Описание скоро появится."
            )}
          </p>

          <p>
            <strong>
              Выпусков:
              ${issues.length}
            </strong>
          </p>

          <a
            class="text-link"
            href="comic.html?id=${encodeURIComponent(
              comic.id
            )}"
          >
            Открыть комикс →
          </a>

        </div>
      </article>
    `;
  }

  /*
   * Главная страница.
   */

  function renderHome() {
    const heroTitle =
      document.querySelector(
        "#hero-title"
      );

    if (!heroTitle) {
      return;
    }

    heroTitle.textContent =
      data.site.heroTitle ||
      "Мир авторских комиксов";

    const heroText =
      document.querySelector(
        "#hero-text"
      );

    if (heroText) {
      heroText.textContent =
        data.site.heroText ||
        "";
    }

    const featured =
      document.querySelector(
        "#featured-comics"
      );

    const readLink =
      document.querySelector(
        "#hero-read-link"
      );

    const visibleComics =
      data.comics.filter(
        comic =>
          comic.featured !==
          false
      );

    const firstComic =
      visibleComics[0] ||
      data.comics[0];

    /*
     * Кнопка на баннере.
     */

    if (readLink) {
      if (
        firstComic
          ?.issues?.[0]
          ?.pages?.length
      ) {
        readLink.href =
          `reader.html?id=${encodeURIComponent(
            firstComic.id
          )}` +
          `&issue=${encodeURIComponent(
            firstComic
              .issues[0]
              .number || 1
          )}` +
          `&page=1`;

        readLink.textContent =
          "Начать читать";
      } else {
        readLink.href =
          "comic.html";

        readLink.textContent =
          "Смотреть комиксы";
      }
    }

    if (!featured) {
      return;
    }

    if (
      !visibleComics.length
    ) {
      featured.innerHTML = `
        <div class="empty-state">

          <strong>
            Комиксы скоро появятся
          </strong>

          <p>
            Автор ещё не опубликовал
            первый выпуск.
          </p>

        </div>
      `;

      return;
    }

    featured.innerHTML =
      visibleComics
        .map(
          createComicCard
        )
        .join("");
  }

  /*
   * Раздел «Комиксы».
   */

  function renderComic() {
    const container =
      document.querySelector(
        "#comic-page"
      );

    if (!container) {
      return;
    }

    const requestedComicId =
      qs("id");

    /*
     * Если ID отсутствует,
     * показываем весь каталог.
     */

    if (!requestedComicId) {
      renderComicCatalog(
        container
      );

      return;
    }

    const comic =
      comicById(
        requestedComicId
      );

    if (!comic) {
      container.innerHTML = `
        <section class="section">

          <div class="empty-state">

            <strong>
              Комикс не найден
            </strong>

            <p>
              Возможно, ссылка устарела
              или комикс был удалён.
            </p>

            <a
              class="button"
              href="comic.html"
            >
              Смотреть все комиксы
            </a>

          </div>
        </section>
      `;

      return;
    }

    const issues =
      Array.isArray(
        comic.issues
      )
        ? comic.issues
        : [];

    document.title =
      `${comic.title} — ` +
      `${
        data.site.name ||
        "OffSkull Comics"
      }`;

    container.innerHTML = `
      <section class="comic-hero section">

        <img
          class="comic-main-cover"
          src="${safeUrl(
            comic.cover
          )}"
          alt="Обложка ${escapeHtml(
            comic.title
          )}"
        >

        <div>

          <p class="eyebrow">
            Комикс
          </p>

          <h1>
            ${escapeHtml(
              comic.title
            )}
          </h1>

          <p class="lead">
            ${escapeHtml(
              comic.description ||
              ""
            )}
          </p>

          <div class="meta-grid">

            <div>
              <span>
                Жанр
              </span>

              <strong>
                ${escapeHtml(
                  comic.genre ||
                  "Не указан"
                )}
              </strong>
            </div>

            <div>
              <span>
                Возраст
              </span>

              <strong>
                ${escapeHtml(
                  comic.age ||
                  "Не указан"
                )}
              </strong>
            </div>

            <div>
              <span>
                Статус
              </span>

              <strong>
                ${escapeHtml(
                  comic.status ||
                  "Не указан"
                )}
              </strong>
            </div>

            <div>
              <span>
                Выпусков
              </span>

              <strong>
                ${issues.length}
              </strong>
            </div>

          </div>

          <a
            class="button button-secondary"
            href="comic.html"
            style="margin-top: 25px;"
          >
            ← Все комиксы
          </a>

        </div>
      </section>

      <section class="section">

        <div class="section-heading">

          <div>
            <p class="eyebrow">
              Чтение
            </p>

            <h2>
              Список выпусков
            </h2>
          </div>

        </div>

        <div class="issues-list">

          ${
            issues.length
              ? issues
                  .map(
                    issue =>
                      createIssueRow(
                        comic,
                        issue
                      )
                  )
                  .join("")
              : `
                <div class="empty-state">

                  <strong>
                    Выпусков пока нет
                  </strong>

                  <p>
                    Автор ещё не загрузил
                    страницы этого комикса.
                  </p>

                </div>
              `
          }

        </div>
      </section>
    `;
  }

  /*
   * Каталог всех комиксов.
   */

  function renderComicCatalog(
    container
  ) {
    document.title =
      `Комиксы — ` +
      `${
        data.site.name ||
        "OffSkull Comics"
      }`;

    container.innerHTML = `
      <section class="page-hero">

        <div class="narrow">

          <p class="eyebrow">
            Каталог OffSkull
          </p>

          <h1>
            Все комиксы
          </h1>

          <p>
            Выберите комикс,
            чтобы посмотреть описание
            и доступные выпуски.
          </p>

        </div>
      </section>

      <section class="section">

        ${
          data.comics.length
            ? `
              <div class="comics-grid">

                ${data.comics
                  .map(
                    createComicCard
                  )
                  .join("")}

              </div>
            `
            : `
              <div class="empty-state">

                <strong>
                  Комиксов пока нет
                </strong>

                <p>
                  Добавьте первый комикс
                  через панель администратора.
                </p>

              </div>
            `
        }

      </section>
    `;
  }

  /*
   * Одна строка выпуска.
   */

  function createIssueRow(
    comic,
    issue
  ) {
    const pages =
      Array.isArray(
        issue.pages
      )
        ? issue.pages
        : [];

    return `
      <article class="issue-row">

        <div class="issue-number">
          #${escapeHtml(
            issue.number || ""
          )}
        </div>

        <div>

          <h3>
            ${escapeHtml(
              issue.title ||
              `Выпуск ${
                issue.number || ""
              }`
            )}
          </h3>

          <p>
            ${pages.length} стр.

            ${
              issue.date
                ? `· ${escapeHtml(
                    issue.date
                  )}`
                : ""
            }
          </p>

        </div>

        ${
          pages.length
            ? `
              <a
                class="button button-small"
                href="reader.html?id=${encodeURIComponent(
                  comic.id
                )}&issue=${encodeURIComponent(
                  issue.number || 1
                )}&page=1"
              >
                Читать
              </a>
            `
            : `
              <span>
                Страницы скоро появятся
              </span>
            `
        }

      </article>
    `;
  }

  /*
   * Обычная постраничная читалка.
   *
   * Если используется отдельная вертикальная
   * читалка reader-vertical.js, эта функция
   * просто не найдёт #reader-page на других
   * страницах и ничего не изменит.
   */

  function renderReader() {
    const root =
      document.querySelector(
        "#reader-page"
      );

    if (!root) {
      return;
    }

    const comic =
      comicById(
        qs("id")
      );

    if (!comic) {
      root.innerHTML = `
        <div class="reader-toolbar">

          <a
            class="reader-back"
            href="index.html"
          >
            ← На главную
          </a>

        </div>

        <main class="reader-stage">

          <div class="empty-state">

            <strong>
              Комикс не найден
            </strong>

          </div>

        </main>
      `;

      return;
    }

    const issues =
      Array.isArray(
        comic.issues
      )
        ? comic.issues
        : [];

    const issueNumber =
      Number(
        qs("issue") || 1
      );

    const issue =
      issues.find(
        item =>
          Number(
            item.number
          ) ===
          issueNumber
      ) ||
      issues[0];

    const pages =
      Array.isArray(
        issue?.pages
      )
        ? issue.pages
        : [];

    if (
      !issue ||
      !pages.length
    ) {
      root.innerHTML = `
        <div class="reader-toolbar">

          <a
            class="reader-back"
            href="comic.html?id=${encodeURIComponent(
              comic.id
            )}"
          >
            ← К комиксу
          </a>

          <div>
            <strong>
              ${escapeHtml(
                comic.title
              )}
            </strong>
          </div>

        </div>

        <main class="reader-stage">

          <div class="empty-state">

            <strong>
              Страницы пока
              не загружены
            </strong>

          </div>

        </main>
      `;

      return;
    }

    let page =
      Number(
        qs("page") || 1
      );

    page =
      Math.min(
        Math.max(
          page,
          1
        ),
        pages.length
      );

    document.title =
      `${comic.title}: ` +
      `${
        issue.title ||
        `Выпуск ${issue.number}`
      } — ` +
      `страница ${page}`;

    const previous =
      page > 1
        ? `reader.html?id=${encodeURIComponent(
            comic.id
          )}&issue=${encodeURIComponent(
            issue.number
          )}&page=${page - 1}`
        : `comic.html?id=${encodeURIComponent(
            comic.id
          )}`;

    const next =
      page < pages.length
        ? `reader.html?id=${encodeURIComponent(
            comic.id
          )}&issue=${encodeURIComponent(
            issue.number
          )}&page=${page + 1}`
        : `comic.html?id=${encodeURIComponent(
            comic.id
          )}`;

    root.innerHTML = `
      <div class="reader-toolbar">

        <a
          class="reader-back"
          href="comic.html?id=${encodeURIComponent(
            comic.id
          )}"
        >
          ← К выпускам
        </a>

        <div>

          <strong>
            ${escapeHtml(
              comic.title
            )}
          </strong>

          <span>
            ${escapeHtml(
              issue.title ||
              `Выпуск ${
                issue.number
              }`
            )}

            · ${page}/${pages.length}
          </span>

        </div>
      </div>

      <main class="reader-stage">

        <a
          class="reader-arrow"
          href="${previous}"
          aria-label="Предыдущая страница"
        >
          ←
        </a>

        <img
          class="reader-image"
          src="${safeUrl(
            pages[page - 1]
          )}"
          alt="${escapeHtml(
            comic.title
          )}, страница ${page}"
        >

        <a
          class="reader-arrow"
          href="${next}"
          aria-label="Следующая страница"
        >
          →
        </a>

      </main>

      <div class="reader-controls">

        <a
          class="button button-secondary"
          href="${previous}"
        >
          ← Назад
        </a>

        <span>
          Страница ${page}
          из ${pages.length}
        </span>

        <a
          class="button"
          href="${next}"
        >
          ${
            page < pages.length
              ? "Далее →"
              : "Завершить"
          }
        </a>

      </div>
    `;
  }

  /*
   * Страница персонажей.
   */

  function renderCharacters() {
    const grid =
      document.querySelector(
        "#characters-grid"
      );

    if (!grid) {
      return;
    }

    if (
      !data.characters.length
    ) {
      grid.innerHTML = `
        <div class="empty-state">

          <strong>
            Персонажи скоро появятся
          </strong>

        </div>
      `;

      return;
    }

    grid.innerHTML =
      data.characters
        .map(
          character => `
            <article class="character-card">

              <img
                src="${safeUrl(
                  character.image
                )}"
                alt="${escapeHtml(
                  character.name
                )}"
              >

              <div class="character-info">

                <h2>
                  ${escapeHtml(
                    character.name
                  )}
                </h2>

                <dl>

                  <div>
                    <dt>
                      Возраст
                    </dt>

                    <dd>
                      ${escapeHtml(
                        character.age ||
                        "Неизвестно"
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Способности
                    </dt>

                    <dd>
                      ${escapeHtml(
                        character.ability ||
                        "Не указаны"
                      )}
                    </dd>
                  </div>

                </dl>

                <p>
                  ${escapeHtml(
                    character.description ||
                    ""
                  )}
                </p>

              </div>
            </article>
          `
        )
        .join("");
  }

  /*
   * Страница автора.
   */

  function renderAuthor() {
    const name =
      document.querySelector(
        "#author-name"
      );

    if (!name) {
      return;
    }

    name.textContent =
      data.site.authorName ||
      "Автор";

    const text =
      document.querySelector(
        "#author-text"
      );

    if (text) {
      text.textContent =
        data.site.authorText ||
        "";
    }
  }

  /*
   * Мобильное меню.
   */

  function mobileMenu() {
    const button =
      document.querySelector(
        ".menu-toggle"
      );

    const nav =
      document.querySelector(
        ".site-nav"
      );

    if (
      !button ||
      !nav
    ) {
      return;
    }

    button.addEventListener(
      "click",
      () => {
        const open =
          nav.classList.toggle(
            "open"
          );

        button.setAttribute(
          "aria-expanded",
          String(open)
        );
      }
    );
  }

  /*
   * Запуск функций.
   */

  setSiteText();
  renderHome();
  renderComic();
  renderReader();
  renderCharacters();
  renderAuthor();
  mobileMenu();
})();
