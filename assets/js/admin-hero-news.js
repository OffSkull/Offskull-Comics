(async () => {
  "use strict";

  const admin = window.OffSkullAdmin;

  const preview = document.querySelector("#hero-news-preview");
  const fileInput = document.querySelector("#hero-news-image-file");
  const labelInput = document.querySelector("#hero-news-label");
  const titleInput = document.querySelector("#hero-news-title");
  const textInput = document.querySelector("#hero-news-text");
  const linkInput = document.querySelector("#hero-news-link");
  const buttonInput = document.querySelector("#hero-news-button-text");
  const visibleInput = document.querySelector("#hero-news-visible");
  const saveButton = document.querySelector("#save-hero-news");
  const logoutButton = document.querySelector("#hero-news-logout");
  const statusBox = document.querySelector("#hero-news-admin-status");

  let selectedFile = null;
  let currentImage = "";

  if (!admin) {
    showStatus(
      "error",
      "Не загрузился admin-core.js. Проверьте подключение файлов внизу страницы."
    );

    return;
  }

  try {
    const session = await admin.requireSession();

    if (!session) {
      return;
    }
  } catch (error) {
    showStatus(
      "error",
      admin.friendlyError
        ? admin.friendlyError(error)
        : String(error.message || error)
    );

    return;
  }

  fileInput.addEventListener("change", () => {
    selectedFile = fileInput.files?.[0] || null;

    if (!selectedFile) {
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      selectedFile = null;
      fileInput.value = "";

      showStatus("error", "Выберите JPG, PNG, WEBP или GIF.");

      return;
    }

    preview.src = URL.createObjectURL(selectedFile);
  });

  saveButton.addEventListener("click", saveNews);

  logoutButton?.addEventListener("click", async () => {
    await admin.clearSession();
    location.href = "admin-login.html";
  });

  await loadNews();

  async function loadNews() {
    showStatus("busy", "Загружаем данные…");

    try {
      const data = await admin.loadRemoteData();

      const news = data.heroNews || {
        visible: true,
        label: "Скоро",
        title: "Скоро выход нового комикса",
        text: "Новая история. Новый герой. Новый мир.",
        buttonText: "Узнать больше",
        link: "comic.html",
        image: "assets/images/banner.svg"
      };

      currentImage =
        news.image || "assets/images/banner.svg";

      preview.src = currentImage;
      labelInput.value = news.label || "Скоро";
      titleInput.value = news.title || "";
      textInput.value = news.text || "";
      linkInput.value = news.link || "";
      buttonInput.value = news.buttonText || "Узнать больше";
      visibleInput.checked = news.visible !== false;

      showStatus("", "");
    } catch (error) {
      showStatus(
        "error",
        admin.friendlyError
          ? admin.friendlyError(error)
          : String(error.message || error)
      );
    }
  }

  async function saveNews() {
    const title = titleInput.value.trim();

    if (!title) {
      showStatus("error", "Введите заголовок новости.");
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Сохраняем…";

    showStatus("busy", "Сохраняем новость…");

    try {
      let imageUrl = currentImage;

      if (selectedFile) {
        const extension = getExtension(selectedFile);

        const path =
          `news/hero-${Date.now()}-` +
          `${Math.random().toString(36).slice(2, 8)}.` +
          extension;

        imageUrl = await admin.uploadImage(
          selectedFile,
          path
        );
      }

      const latestData = await admin.loadRemoteData();

      latestData.heroNews = {
        visible: visibleInput.checked,

        label:
          labelInput.value.trim() ||
          "Скоро",

        title,

        text:
          textInput.value.trim(),

        buttonText:
          buttonInput.value.trim() ||
          "Узнать больше",

        link:
          linkInput.value.trim(),

        image:
          imageUrl ||
          "assets/images/banner.svg",

        imageAlt:
          title
      };

      await admin.saveData(latestData);

      currentImage =
        imageUrl ||
        "assets/images/banner.svg";

      preview.src = currentImage;
      selectedFile = null;
      fileInput.value = "";

      showStatus(
        "success",
        "Новость сохранена. Откройте главную страницу и нажмите Ctrl + Shift + R."
      );
    } catch (error) {
      showStatus(
        "error",
        admin.friendlyError
          ? admin.friendlyError(error)
          : String(error.message || error)
      );
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Сохранить новость";
    }
  }

  function getExtension(file) {
    const extension = String(file.name || "")
      .split(".")
      .pop()
      .toLowerCase();

    if (
      ["jpg", "jpeg", "png", "webp", "gif"]
        .includes(extension)
    ) {
      return extension;
    }

    if (file.type === "image/png") return "png";
    if (file.type === "image/webp") return "webp";
    if (file.type === "image/gif") return "gif";

    return "jpg";
  }

  function showStatus(type, message) {
    statusBox.className = type
      ? `hero-news-admin-status ${type}`
      : "hero-news-admin-status";

    statusBox.textContent = message;
  }
})();
