(async () => {
  "use strict";

  const preview =
    document.querySelector(
      "#hero-news-preview"
    );

  const fileInput =
    document.querySelector(
      "#hero-news-image-file"
    );

  const labelInput =
    document.querySelector(
      "#hero-news-label"
    );

  const titleInput =
    document.querySelector(
      "#hero-news-title"
    );

  const textInput =
    document.querySelector(
      "#hero-news-text"
    );

  const linkInput =
    document.querySelector(
      "#hero-news-link"
    );

  const buttonTextInput =
    document.querySelector(
      "#hero-news-button-text"
    );

  const visibleInput =
    document.querySelector(
      "#hero-news-visible"
    );

  const saveButton =
    document.querySelector(
      "#save-hero-news"
    );

  const logoutButton =
    document.querySelector(
      "#hero-news-logout"
    );

  const statusBox =
    document.querySelector(
      "#hero-news-admin-status"
    );

  let selectedFile = null;
  let currentImage = "";

  const session =
    await window.OffSkullAdmin
      .requireSession();

  if (!session) {
    return;
  }

  await loadCurrentNews();

  fileInput.addEventListener(
    "change",
    () => {
      selectedFile =
        fileInput.files?.[0] || null;

      if (!selectedFile) {
        return;
      }

      if (
        !String(selectedFile.type)
          .startsWith("image/")
      ) {
        showStatus(
          "error",
          "Выберите изображение."
        );

        selectedFile = null;
        return;
      }

      const localUrl =
        URL.createObjectURL(
          selectedFile
        );

      preview.src = localUrl;
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

  async function loadCurrentNews() {
    showStatus(
      "busy",
      "Загружаем новость…"
    );

    try {
      const data =
        await window.OffSkullAdmin
          .loadRemoteData();

      const news =
        data.heroNews || {
          label: "Скоро",
          title: "Скоро выход комикса",
          text:
            "Новая история. Новый герой. Новый мир.",
          link: "",
          buttonText: "Узнать больше",
          image: "",
          visible: true
        };

      currentImage =
        news.image || "";

      preview.src =
        currentImage ||
        "assets/images/banner.svg";

      labelInput.value =
        news.label || "Скоро";

      titleInput.value =
        news.title || "";

      textInput.value =
        news.text || "";

      linkInput.value =
        news.link || "";

      buttonTextInput.value =
        news.buttonText ||
        "Узнать больше";

      visibleInput.checked =
        news.visible !== false;

      showStatus("", "");
    } catch (error) {
      showStatus(
        "error",
        window.OffSkullAdmin
          .friendlyError(error)
      );
    }
  }

  async function saveNews() {
    const title =
      titleInput.value.trim();

    if (!title) {
      showStatus(
        "error",
        "Введите заголовок новости."
      );

      return;
    }

    saveButton.disabled = true;
    saveButton.textContent =
      "Сохраняем…";

    showStatus(
      "busy",
      "Публикуем новость…"
    );

    try {
      let imageUrl =
        currentImage;

      if (selectedFile) {
        const extension =
          getExtension(selectedFile);

        const path =
          `news/hero-${Date.now()}-` +
          `${Math.random()
            .toString(36)
            .slice(2, 7)}.` +
          `${extension}`;

        imageUrl =
          await window.OffSkullAdmin
            .uploadImage(
              selectedFile,
              path
            );
      }

      /*
       * Заново загружаем последние данные,
       * чтобы не заменить комиксы и персонажей.
       */

      const latestData =
        await window.OffSkullAdmin
          .loadRemoteData();

      latestData.heroNews = {
        label:
          labelInput.value.trim() ||
          "Скоро",

        title,

        text:
          textInput.value.trim(),

        link:
          linkInput.value.trim(),

        buttonText:
          buttonTextInput.value.trim() ||
          "Узнать больше",

        image:
          imageUrl,

        imageAlt:
          title,

        visible:
          visibleInput.checked
      };

      await window.OffSkullAdmin
        .saveData(latestData);

      currentImage =
        imageUrl;

      selectedFile = null;
      fileInput.value = "";

      preview.src =
        currentImage ||
        "assets/images/banner.svg";

      showStatus(
        "success",
        "Новость сохранена. Откройте главную страницу и нажмите Ctrl + F5."
      );
    } catch (error) {
      showStatus(
        "error",
        window.OffSkullAdmin
          .friendlyError(error)
      );
    } finally {
      saveButton.disabled = false;
      saveButton.textContent =
        "Сохранить новость";
    }
  }

  function getExtension(file) {
    const fromName =
      String(file.name || "")
        .split(".")
        .pop()
        .toLowerCase();

    const allowed = [
      "jpg",
      "jpeg",
      "png",
      "webp",
      "gif"
    ];

    if (allowed.includes(fromName)) {
      return fromName;
    }

    if (file.type === "image/png") {
      return "png";
    }

    if (file.type === "image/webp") {
      return "webp";
    }

    if (file.type === "image/gif") {
      return "gif";
    }

    return "jpg";
  }

  function showStatus(
    type,
    message
  ) {
    statusBox.className =
      type
        ? `hero-news-admin-status ${type}`
        : "hero-news-admin-status";

    statusBox.textContent =
      message;
  }
})();
