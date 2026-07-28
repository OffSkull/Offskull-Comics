(async () => {
  "use strict";

  const newsRoot =
    document.querySelector("#hero-news");

  if (!newsRoot) {
    return;
  }

  let siteData =
    window.OFFSKULL_DATA || {
      news: []
    };

  /*
   * Ждём загрузки системы сайта.
   */

  try {
    await prepareSiteData();

    if (window.OffSkullSiteData?.load) {
      siteData =
        await window.OffSkullSiteData.load(
          window.OFFSKULL_DATA || siteData
        );
    }
  } catch (error) {
    console.warn(
      "Новости загружены из резервных данных.",
      error
    );
  }

  const news =
    Array.isArray(siteData.news)
      ? siteData.news
      : [];

  const publishedNews =
    news
      .filter(item => item.published !== false)
      .slice(0, 4);

  renderNews(publishedNews);

  /*
   * Вывод новостей.
   */

  function renderNews(items) {
    if (items.length === 0) {
      newsRoot.innerHTML = `
        <div class="hero-news-header">
          <h2>Новости</h2>

          <span class="hero-news-label">
            OffSkull
          </span>
        </div>

        <div class="hero-news-empty">
          Скоро здесь появятся новости
          о новых комиксах и выпусках.
        </div>
      `;

      return;
    }

    newsRoot.innerHTML = `
      <div class="hero-news-header">
        <h2>Новости</h2>

        <span class="hero-news-label">
          Скоро
        </span>
      </div>

      <div class="hero-news-list">

        ${items.map(item => `
          <article class="hero-news-item">

            ${
              item.date
                ? `
                  <span class="hero-news-date">
                    ${escapeHtml(item.date)}
                  </span>
                `
                : ""
            }

            <h3 class="hero-news-title">
              ${escapeHtml(
                item.title || "Новая публикация"
              )}
            </h3>

            ${
              item.text
                ? `
                  <p class="hero-news-text">
                    ${escapeHtml(item.text)}
                  </p>
                `
                : ""
            }

            ${
              item.link
                ? `
                  <a
                    class="hero-news-link"
                    href="${safeLink(item.link)}"
                  >
                    ${escapeHtml(
                      item.buttonText ||
                      "Подробнее"
                    )}
                  </a>
                `
                : ""
            }

          </article>
        `).join("")}

      </div>
    `;
  }

  /*
   * Подключение файлов Supabase,
   * когда они ещё не загрузились.
   */

  async function prepareSiteData() {
    if (!window.OFFSKULL_SUPABASE_CONFIG) {
      await loadScript(
        "assets/js/supabase-config.js?v=10"
      );
    }

    if (!window.supabase?.createClient) {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/" +
        "@supabase/supabase-js@2"
      );
    }

    if (!window.OffSkullSupabase) {
      await loadScript(
        "assets/js/supabase-client.js?v=10"
      );
    }

    if (!window.OffSkullSiteData) {
      await loadScript(
        "assets/js/site-data.js?v=10"
      );
    }
  }

  function loadScript(source) {
    return new Promise(
      (resolve, reject) => {
        const existing =
          Array.from(document.scripts)
            .find(script => {
              try {
                return (
                  new URL(
                    script.src,
                    document.baseURI
                  ).href ===
                  new URL(
                    source,
                    document.baseURI
                  ).href
                );
              } catch (_) {
                return false;
              }
            });

        if (existing) {
          if (
            existing.dataset.loaded === "true"
          ) {
            resolve();
            return;
          }

          existing.addEventListener(
            "load",
            resolve,
            { once: true }
          );

          existing.addEventListener(
            "error",
            reject,
            { once: true }
          );

          setTimeout(resolve, 1500);

          return;
        }

        const script =
          document.createElement("script");

        script.src = source;
        script.async = true;

        script.addEventListener(
          "load",
          () => {
            script.dataset.loaded = "true";
            resolve();
          },
          { once: true }
        );

        script.addEventListener(
          "error",
          reject,
          { once: true }
        );

        document.head.appendChild(script);
      }
    );
  }

  function safeLink(value) {
    const link =
      String(value || "").trim();

    if (
      !link ||
      /^javascript:/i.test(link) ||
      /^data:/i.test(link)
    ) {
      return "#";
    }

    return escapeHtml(link);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
