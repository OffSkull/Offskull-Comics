(async () => {
  "use strict";

  const root =
    document.querySelector("#comic-page");

  if (!root) {
    return;
  }

  /*
   * Данные из content.js.
   */

  const fallbackData =
    window.OFFSKULL_DATA || {
      site: {
        name: "OffSkull Comics"
      },

      comics: [],

      characters: []
    };

  let remoteData = fallbackData;

  /*
   * Пытаемся получить данные из Supabase.
   */

  try {
    if (window.OffSkullSiteData?.load) {
      remoteData =
        await window.OffSkullSiteData.load(
          fallbackData
        );
    }
  } catch (error) {
    console.warn(
      "Не удалось загрузить Supabase. " +
      "Используются данные content.js.",
      error
    );
  }

  /*
   * Объединяем комиксы.
   *
   * Так отображаются:
   * - комиксы из content.js;
   * - комиксы из Supabase;
   * - комиксы, добавленные через админку.
   */

  const data = {
    ...fallbackData,
    ...remoteData,

    site: {
      ...(fallbackData.site || {}),
      ...(remoteData.site || {})
    },

    comics: mergeComics(
      fallbackData.comics,
      remoteData.comics
    )
  };

  const parameters =
    new URLSearchParams(location.search);

  const comicId =
    parameters.get("id");

  /*
   * Без ID показываем каталог.
   */

  if (!comicId) {
    renderCatalog();
    setSiteInformation();
    startMobileMenu();
    return;
  }

  /*
   * С ID показываем отдельный комикс.
   */

  const comic =
    data.comics.find(
      item =>
        String(item.id) ===
        String(comicId)
    );

  if (!comic) {
    renderNotFound();
    setSiteInformation();
    startMobileMenu();
    return;
  }

  renderComic(comic);
  setSiteInformation();
  startMobileMenu();

  /*
   * Каталог всех комиксов.
   */

  function renderCatalog() {
    document.title =
      `Комиксы — ${
        data.site.name ||
        "OffSkull Comics"
      }`;

    if (!data.comics.length) {
      root.innerHTML = `
        <section class="page-hero">
          <div class="narrow">

            <p class="eyebrow">
              Каталог OffSkull
            </p>

            <h1>
              Все комиксы
            </h1>

          </div>
        </section>

        <section class="section">

          <div class="empty-state">

            <strong>
              Комиксов пока нет
            </strong>

            <p>
              В content.js и Supabase
              не найдено ни одного комикса.
            </p>

          </div>

        </section>
      `;

      return;
    }

    root.innerHTML = `
      <section class="page-hero">

        <div class="narrow">

          <p class="eyebrow">
            Каталог OffSkull
          </p>

          <h1>
            Все комиксы
          </h1>

          <p>
            Выберите историю, чтобы посмотреть
            описание и доступные выпуски.
          </p>

        </div>

      </section>

      <section class="section">

        <div class="comics-grid">

          ${data.comics.map(comic => {
            const issues =
              Array.isArray(comic.issues)
                ? comic.issues
                : [];

            return `
              <article class="comic-card">

                <a
                  class="cover-wrap"
                  href="comic.html?id=${encodeURIComponent(
                    comic.id || ""
                  )}"
                >

                  <img
                    src="${safeUrl(
                      comic.cover,
                      "assets/images/banner.svg"
                    )}"
                    alt="Обложка комикса ${escapeHtml(
                      comic.title ||
                      "Без названия"
                    )}"
                  >

                  ${
                    comic.age
                      ? `
                        <span class="age-badge">
                          ${escapeHtml(comic.age)}
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

                  <h2>
                    ${escapeHtml(
                      comic.title ||
                      "Без названия"
                    )}
                  </h2>

                  <p>
                    ${escapeHtml(
                      comic.description ||
                      "Описание скоро появится."
                    )}
                  </p>

                  <p>
                    <strong>
                      Выпусков: ${issues.length}
                    </strong>
                  </p>

                  <a
                    class="button"
                    href="comic.html?id=${encodeURIComponent(
                      comic.id || ""
                    )}"
                  >
                    Открыть комикс
                  </a>

                </div>

              </article>
            `;
          }).join("")}

        </div>

      </section>
    `;
  }

  /*
   * Страница отдельного комикса.
   */

  function renderComic(comic) {
    const issues =
      Array.isArray(comic.issues)
        ? comic.issues
        : [];

    document.title =
      `${comic.title || "Комикс"} — ` +
      `${data.site.name || "OffSkull Comics"}`;

    root.innerHTML = `
      <section class="comic-hero section">

        <img
          class="comic-main-cover"
          src="${safeUrl(
            comic.cover,
            "assets/images/banner.svg"
          )}"
          alt="Обложка ${escapeHtml(
            comic.title || "комикса"
          )}"
        >

        <div>

          <p class="eyebrow">
            Комикс
          </p>

          <h1>
            ${escapeHtml(
              comic.title ||
              "Без названия"
            )}
          </h1>

          <p class="lead">
            ${escapeHtml(
              comic.description ||
              "Описание скоро появится."
            )}
          </p>

          <div class="meta-grid">

            <div>
              <span>Жанр</span>

              <strong>
                ${escapeHtml(
                  comic.genre ||
                  "Не указан"
                )}
              </strong>
            </div>

            <div>
              <span>Возраст</span>

              <strong>
                ${escapeHtml(
                  comic.age ||
                  "Не указан"
                )}
              </strong>
            </div>

            <div>
              <span>Статус</span>

              <strong>
                ${escapeHtml(
                  comic.status ||
                  "Не указан"
                )}
              </strong>
            </div>

            <div>
              <span>Выпусков</span>

              <strong>
                ${issues.length}
              </strong>
            </div>

          </div>

          <a
            class="button button-secondary"
            href="comic.html"
            style="margin-top: 24px;"
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
              ? issues.map(issue => {
                  const pages =
                    Array.isArray(issue.pages)
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
                              )}"
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
                }).join("")
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
   * Если ссылка ведёт на отсутствующий ID.
   */

  function renderNotFound() {
    root.innerHTML = `
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
  }

  /*
   * Объединяем комиксы без повторов.
   *
   * Версия из Supabase заменяет
   * версию с таким же ID из content.js.
   */

  function mergeComics(
    localComics,
    supabaseComics
  ) {
    const result = new Map();

    const local =
      Array.isArray(localComics)
        ? localComics
        : [];

    const remote =
      Array.isArray(supabaseComics)
        ? supabaseComics
        : [];

    for (const comic of local) {
      const id =
        String(
          comic.id ||
          comic.title ||
          Math.random()
        );

      result.set(id, comic);
    }

    for (const comic of remote) {
      const id =
        String(
          comic.id ||
          comic.title ||
          Math.random()
        );

      result.set(id, comic);
    }

    return Array.from(result.values());
  }

  /*
   * Текст в подвале.
   */

  function setSiteInformation() {
    document
      .querySelectorAll("[data-site-name]")
      .forEach(element => {
        element.textContent =
          data.site.name ||
          "OffSkull Comics";
      });

    document
      .querySelectorAll("[data-author-name]")
      .forEach(element => {
        element.textContent =
          data.site.authorName ||
          "Автор";
      });

    const year =
      document.querySelector("[data-year]");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }
  }

  /*
   * Мобильное меню.
   */

  function startMobileMenu() {
    const button =
      document.querySelector(".menu-toggle");

    const navigation =
      document.querySelector(".site-nav");

    if (!button || !navigation) {
      return;
    }

    button.addEventListener(
      "click",
      () => {
        const opened =
          navigation.classList.toggle("open");

        button.setAttribute(
          "aria-expanded",
          String(opened)
        );
      }
    );
  }

  /*
   * Безопасный адрес изображения.
   */

  function safeUrl(
    value,
    fallback
  ) {
    const url =
      String(value || "").trim();

    if (
      !url ||
      /^javascript:/i.test(url) ||
      /^data:text\/html/i.test(url)
    ) {
      return fallback;
    }

    return escapeHtml(url);
  }

  /*
   * Защита текста.
   */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
