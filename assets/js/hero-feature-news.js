(async () => {
  "use strict";

  const root =
    document.querySelector(
      "#hero-feature-news"
    );

  if (!root) {
    return;
  }

  let siteData =
    window.OFFSKULL_DATA || {};

  try {
    await prepareSiteData();

    if (window.OffSkullSiteData?.load) {
      siteData =
        await window.OffSkullSiteData.load(
          window.OFFSKULL_DATA || {}
        );
    }
  } catch (error) {
    console.warn(
      "Новость загружена из резервных данных.",
      error
    );
  }

  const news =
    siteData.heroNews;

  if (
    !news ||
    news.visible === false ||
    !String(news.title || "").trim()
  ) {
    root.hidden = true;
    return;
  }

  const image =
    document.querySelector(
      "#hero-feature-news-image"
    );

  const label =
    document.querySelector(
      "#hero-feature-news-label"
    );

  const title =
    document.querySelector(
      "#hero-feature-news-title"
    );

  const text =
    document.querySelector(
      "#hero-feature-news-text"
    );

  const link =
    document.querySelector(
      "#hero-feature-news-link"
    );

  const buttonText =
    document.querySelector(
      "#hero-feature-news-button-text"
    );

  image.src =
    safeImage(
      news.image ||
      "assets/images/banner.svg"
    );

  image.alt =
    news.imageAlt ||
    news.title ||
    "Новость OffSkull Comics";

  label.textContent =
    news.label || "Скоро";

  title.textContent =
    news.title;

  text.textContent =
    news.text || "";

  buttonText.textContent =
    news.buttonText ||
    "Узнать больше";

  if (news.link) {
    link.href =
      safeLink(news.link);

    link.hidden = false;
  } else {
    link.hidden = true;
  }

  root.hidden = false;

  function safeImage(value) {
    const address =
      String(value || "").trim();

    if (
      !address ||
      /^javascript:/i.test(address) ||
      /^data:text\/html/i.test(address)
    ) {
      return "assets/images/banner.svg";
    }

    return address;
  }

  function safeLink(value) {
    const address =
      String(value || "").trim();

    if (
      !address ||
      /^javascript:/i.test(address) ||
      /^data:/i.test(address)
    ) {
      return "#";
    }

    return address;
  }

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
        const absolute =
          new URL(
            source,
            document.baseURI
          ).href;

        const existing =
          Array.from(document.scripts)
            .find(script => {
              return script.src === absolute;
            });

        if (existing) {
          existing.addEventListener(
            "load",
            resolve,
            { once: true }
          );

          setTimeout(resolve, 700);

          return;
        }

        const script =
          document.createElement("script");

        script.src = source;
        script.async = true;

        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
      }
    );
  }
})();
