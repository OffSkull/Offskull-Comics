(async () => {
  "use strict";

  const root = document.querySelector("#reader-page");

  if (!root) {
    return;
  }

  const fallbackData = window.OFFSKULL_DATA || {
    site: {
      name: "OffSkull Comics"
    },

    comics: [],

    characters: []
  };

  let data = fallbackData;

  /*
   * Если Supabase настроен,
   * загружаем комиксы из базы.
   *
   * Если не настроен,
   * используются данные content.js.
   */

  try {
    if (window.OffSkullSiteData?.load) {
      data = await window.OffSkullSiteData.load(
        fallbackData
      );
    }
  } catch (error) {
    console.warn(
      "Не удалось загрузить данные из Supabase. " +
      "Используется content.js.",
      error
    );
  }

  window.OFFSKULL_DATA = data;

  const parameters =
    new URLSearchParams(location.search);

  const comicId =
    parameters.get("id");

  const requestedIssue =
    Number(parameters.get("issue") || 1);

  const comics =
    Array.isArray(data.comics)
      ? data.comics
      : [];

  const comic =
    comics.find(item => item.id === comicId) ||
    comics[0];

  /*
   * Если комикс не найден.
   */

  if (!comic) {
    renderEmpty(
      "Комикс не найден",
      "Вернуться на главную",
      "index.html"
    );

    return;
  }

  const issues =
    Array.isArray(comic.issues)
      ? comic.issues
      : [];

  const issue =
    issues.find(
      item =>
        Number(item.number) === requestedIssue
    ) ||
    issues[0];

  const pages =
    Array.isArray(issue?.pages)
      ? issue.pages.filter(Boolean)
      : [];

  /*
   * Если выпуск или страницы отсутствуют.
   */

  if (!issue || pages.length === 0) {
    renderEmpty(
      "Страницы пока не загружены",
      "Вернуться к комиксу",
      `comic.html?id=${encodeURIComponent(
        comic.id
      )}`
    );

    return;
  }

  document.title =
    `${comic.title} — ` +
    `${issue.title || `Выпуск ${issue.number}`}`;

  /*
   * Вывод всех страниц одной вертикальной лентой.
   */

  root.innerHTML = `
    <header class="vertical-reader-toolbar">

      <a
        class="vertical-reader-back"
        href="comic.html?id=${encodeURIComponent(
          comic.id
        )}"
      >
        ← К выпускам
      </a>

      <div class="vertical-reader-title">

        <strong>
          ${escapeHtml(comic.title)}
        </strong>

        <span>
          ${escapeHtml(
            issue.title ||
            `Выпуск ${issue.number}`
          )}
        </span>

      </div>

      <div
        class="vertical-reader-progress"
        id="vertical-reader-progress"
        aria-live="polite"
      >
        1 / ${pages.length}
      </div>

    </header>

    <main
      class="vertical-reader-pages"
      id="vertical-reader-pages"
    >

      ${pages.map((pageUrl, index) => `
        <figure
          class="vertical-reader-page"
          data-page-number="${index + 1}"
        >

          <img
            src="${safeUrl(pageUrl)}"
            alt="${escapeHtml(
              comic.title
            )}, страница ${index + 1}"

            ${
              index === 0
                ? 'fetchpriority="high"'
                : 'loading="lazy"'
            }
          >

          <figcaption>
            Страница ${index + 1}
            из ${pages.length}
          </figcaption>

        </figure>
      `).join("")}

    </main>

    <footer class="vertical-reader-finish">

      <strong>
        Конец выпуска
      </strong>

      <span>
        ${escapeHtml(
          issue.title ||
          `Выпуск ${issue.number}`
        )}
      </span>

      <a
        class="button"
        href="comic.html?id=${encodeURIComponent(
          comic.id
        )}"
      >
        Вернуться к выпускам
      </a>

    </footer>
  `;

  /*
   * Запускаем определение текущей страницы.
   */

  startPageCounter();

  function startPageCounter() {
    const progress =
      document.querySelector(
        "#vertical-reader-progress"
      );

    const pageElements =
      Array.from(
        document.querySelectorAll(
          ".vertical-reader-page"
        )
      );

    if (!progress || !pageElements.length) {
      return;
    }

    /*
     * Для старых браузеров.
     */

    if (!("IntersectionObserver" in window)) {
      progress.textContent =
        `1 / ${pageElements.length}`;

      return;
    }

    const visibility = new Map();

    const observer =
      new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            visibility.set(
              entry.target,

              entry.isIntersecting
                ? entry.intersectionRatio
                : 0
            );
          }

          let current = pageElements[0];
          let bestRatio = -1;

          for (const page of pageElements) {
            const ratio =
              visibility.get(page) || 0;

            if (ratio > bestRatio) {
              current = page;
              bestRatio = ratio;
            }
          }

          const number =
            Number(
              current.dataset.pageNumber || 1
            );

          progress.textContent =
            `${number} / ${pageElements.length}`;
        },

        {
          root: null,

          rootMargin:
            "-15% 0px -35% 0px",

          threshold: [
            0,
            0.1,
            0.25,
            0.5,
            0.75,
            1
          ]
        }
      );

    pageElements.forEach(
      page => observer.observe(page)
    );
  }

  /*
   * Сообщение, если комикса или страниц нет.
   */

  function renderEmpty(
    title,
    buttonText,
    href
  ) {
    root.innerHTML = `
      <header class="vertical-reader-toolbar">

        <a
          class="vertical-reader-back"
          href="${href}"
        >
          ← Назад
        </a>

        <div class="vertical-reader-title">
          <strong>
            OffSkull Comics
          </strong>
        </div>

      </header>

      <main class="vertical-reader-empty">

        <strong>
          ${escapeHtml(title)}
        </strong>

        <a
          class="button"
          href="${href}"
        >
          ${escapeHtml(buttonText)}
        </a>

      </main>
    `;
  }

  /*
   * Проверка адреса изображения.
   */

  function safeUrl(value) {
    const url =
      String(value || "").trim();

    if (
      !url ||
      /^javascript:/i.test(url) ||
      /^data:text\/html/i.test(url)
    ) {
      return "assets/images/banner.svg";
    }

    return escapeHtml(url);
  }

  /*
   * Защита текста перед выводом в HTML.
   */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
