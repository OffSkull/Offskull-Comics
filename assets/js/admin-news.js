(async () => {
  "use strict";

  const list =
    document.querySelector(
      "#news-admin-list"
    );

  const addButton =
    document.querySelector(
      "#add-home-news"
    );

  const saveButton =
    document.querySelector(
      "#save-home-news"
    );

  const logoutButton =
    document.querySelector(
      "#news-admin-logout"
    );

  const statusBox =
    document.querySelector(
      "#news-admin-status"
    );

  let newsItems = [];

  /*
   * Проверяем вход администратора.
   */

  const session =
    await window.OffSkullAdmin
      .requireSession();

  if (!session) {
    return;
  }

  await loadNews();

  addButton.addEventListener(
    "click",
    () => {
      newsItems = collectNews();

      newsItems.push({
        id: makeId(),
        title: "Новая новость",
        text: "",
        date: "Скоро",
        link: "",
        buttonText: "Подробнее",
        published: true
      });

      renderNewsEditors();
    }
  );

  saveButton.addEventListener(
    "click",
    saveNews
  );

  logoutButton.addEventListener(
    "click",
    async () => {
      await window.OffSkullAdmin
        .clearSession();

      location.replace(
        "admin-login.html"
      );
    }
  );

  /*
   * Кнопки карточек:
   * вверх, вниз и удалить.
   */

  list.addEventListener(
    "click",
    event => {
      const button =
        event.target.closest(
          "[data-news-action]"
        );

      if (!button) {
        return;
      }

      newsItems = collectNews();

      const card =
        button.closest(
          ".news-editor-card"
        );

      const index =
        Number(card.dataset.index);

      const action =
        button.dataset.newsAction;

      if (action === "up" && index > 0) {
        [
          newsItems[index - 1],
          newsItems[index]
        ] = [
          newsItems[index],
          newsItems[index - 1]
        ];
      }

      if (
        action === "down" &&
        index < newsItems.length - 1
      ) {
        [
          newsItems[index + 1],
          newsItems[index]
        ] = [
          newsItems[index],
          newsItems[index + 1]
        ];
      }

      if (action === "delete") {
        const accepted =
          confirm(
            "Удалить эту новость?"
          );

        if (!accepted) {
          return;
        }

        newsItems.splice(index, 1);
      }

      renderNewsEditors();
    }
  );

  /*
   * Загружаем существующие новости.
   */

  async function loadNews() {
    setStatus(
      "busy",
      "Загружаем новости…"
    );

    try {
      const data =
        await window.OffSkullAdmin
          .loadRemoteData();

      newsItems =
        Array.isArray(data.news)
          ? data.news
          : [];

      renderNewsEditors();

      setStatus("", "");
    } catch (error) {
      setStatus(
        "error",
        window.OffSkullAdmin
          .friendlyError(error)
      );
    }
  }

  /*
   * Сохраняем только раздел новостей.
   *
   * Перед сохранением заново загружаем
   * комиксы и персонажей, чтобы случайно
   * не заменить их старой версией.
   */

  async function saveNews() {
    const preparedNews =
      collectNews()
        .filter(item => {
          return (
            item.title.trim() ||
            item.text.trim()
          );
        });

    saveButton.disabled = true;
    saveButton.textContent =
      "Сохраняем…";

    setStatus(
      "busy",
      "Публикуем новости…"
    );

    try {
      const latestData =
        await window.OffSkullAdmin
          .loadRemoteData();

      latestData.news =
        preparedNews;

      await window.OffSkullAdmin
        .saveData(latestData);

      newsItems =
        preparedNews;

      renderNewsEditors();

      setStatus(
        "success",
        "Новости сохранены. " +
        "Откройте главную страницу " +
        "и нажмите Ctrl + F5."
      );
    } catch (error) {
      setStatus(
        "error",
        window.OffSkullAdmin
          .friendlyError(error)
      );
    } finally {
      saveButton.disabled = false;
      saveButton.textContent =
        "Сохранить новости";
    }
  }

  /*
   * Вывод редакторов.
   */

  function renderNewsEditors() {
    if (newsItems.length === 0) {
      list.innerHTML = `
        <div class="news-editor-card">
          <strong>
            Новостей пока нет
          </strong>

          <p>
            Нажмите «Добавить новость».
          </p>
        </div>
      `;

      return;
    }

    list.innerHTML =
      newsItems.map(
        (item, index) => `
          <article
            class="news-editor-card"
            data-index="${index}"
            data-news-id="${escapeHtml(
              item.id || makeId()
            )}"
          >

            <div class="news-editor-card-header">

              <strong>
                Новость ${index + 1}
              </strong>

              <div class="news-editor-actions">

                <button
                  class="news-small-button"
                  type="button"
                  data-news-action="up"
                  title="Поднять выше"
                >
                  ↑
                </button>

                <button
                  class="news-small-button"
                  type="button"
                  data-news-action="down"
                  title="Опустить ниже"
                >
                  ↓
                </button>

                <button
                  class="
                    news-small-button
                    news-delete-button
                  "
                  type="button"
                  data-news-action="delete"
                  title="Удалить новость"
                >
                  ×
                </button>

              </div>
            </div>

            <div class="news-editor-grid">

              <label>
                Заголовок

                <input
                  type="text"
                  data-news-field="title"
                  value="${escapeHtml(
                    item.title || ""
                  )}"
                  placeholder="Скоро новый выпуск Викинга"
                >
              </label>

              <label>
                Дата или подпись

                <input
                  type="text"
                  data-news-field="date"
                  value="${escapeHtml(
                    item.date || ""
                  )}"
                  placeholder="Август 2026"
                >
              </label>

              <label class="news-full-width">
                Описание

                <textarea
                  data-news-field="text"
                  placeholder="Кратко расскажите о новости"
                >${escapeHtml(
                  item.text || ""
                )}</textarea>
              </label>

              <label>
                Ссылка

                <input
                  type="text"
                  data-news-field="link"
                  value="${escapeHtml(
                    item.link || ""
                  )}"
                  placeholder="comic.html?id=viking"
                >
              </label>

              <label>
                Текст ссылки

                <input
                  type="text"
                  data-news-field="buttonText"
                  value="${escapeHtml(
                    item.buttonText ||
                    "Подробнее"
                  )}"
                  placeholder="Подробнее"
                >
              </label>

              <label class="news-checkbox">

                <input
                  type="checkbox"
                  data-news-field="published"
                  ${
                    item.published !== false
                      ? "checked"
                      : ""
                  }
                >

                Показывать эту новость
                на главной странице

              </label>

            </div>
          </article>
        `
      ).join("");
  }

  /*
   * Получаем введённые значения.
   */

  function collectNews() {
    return Array.from(
      list.querySelectorAll(
        ".news-editor-card[data-index]"
      )
    ).map(card => {
      const getValue = field => {
        return (
          card.querySelector(
            `[data-news-field="${field}"]`
          )?.value || ""
        ).trim();
      };

      const published =
        card.querySelector(
          '[data-news-field="published"]'
        )?.checked !== false;

      return {
        id:
          card.dataset.newsId ||
          makeId(),

        title:
          getValue("title"),

        text:
          getValue("text"),

        date:
          getValue("date"),

        link:
          getValue("link"),

        buttonText:
          getValue("buttonText") ||
          "Подробнее",

        published
      };
    });
  }

  function makeId() {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    return (
      "news-" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );
  }

  function setStatus(type, message) {
    statusBox.className =
      type
        ? `news-status ${type}`
        : "news-status";

    statusBox.textContent =
      message;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
