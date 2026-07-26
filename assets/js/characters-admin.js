(() => {
  "use strict";

  const session = OffSkullAdmin.getSession();
  const toolbar = document.querySelector("#inline-admin-toolbar");
  const navLink = document.querySelector("#admin-nav-link");

  if (!session) return;

  toolbar.hidden = false;
  navLink.textContent = "Панель администратора";
  navLink.href = "admin.html";

  let data = window.OFFSKULL_DATA;
  let selectedFile = null;
  let previewUrl = null;
  let activeIndex = null;

  const grid = document.querySelector("#characters-grid");
  const modal = document.querySelector("#character-admin-modal");
  const form = document.querySelector("#character-admin-form");
  const preview = document.querySelector("#character-admin-preview");
  const imageInput = document.querySelector("#character-admin-image");
  const imageNote = document.querySelector("#character-admin-image-note");
  const status = document.querySelector("#inline-admin-status");
  const deleteButton = document.querySelector("#character-admin-delete");

  decorateCards();

  document.querySelector("#inline-add-character").addEventListener("click", () => openEditor(null));
  document.querySelector("#inline-admin-logout").addEventListener("click", () => {
    OffSkullAdmin.clearSession();
    location.reload();
  });

  grid.addEventListener("click", event => {
    const button = event.target.closest("[data-edit-character]");
    if (!button) return;
    openEditor(Number(button.dataset.editCharacter));
  });

  document.querySelectorAll("[data-close-admin-modal]").forEach(element => {
    element.addEventListener("click", closeEditor);
  });

  imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showStatus("error", "Выберите файл изображения.");
      imageInput.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showStatus("error", "Размер изображения должен быть не больше 15 МБ.");
      imageInput.value = "";
      return;
    }

    selectedFile = file;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    imageNote.textContent = "Новая картинка будет загружена после сохранения.";
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    await saveCharacter();
  });

  deleteButton.addEventListener("click", async () => {
    if (activeIndex === null) return;
    const character = data.characters[activeIndex];

    if (!confirm(`Удалить персонажа «${character.name}»?`)) return;

    const updated = JSON.parse(JSON.stringify(data));
    updated.characters.splice(activeIndex, 1);

    await publishData(updated, "Персонаж удалён.");
  });

  function decorateCards() {
    grid.querySelectorAll(".character-card").forEach((card, index) => {
      card.classList.add("character-card-admin-enabled");

      const actions = document.createElement("div");
      actions.className = "character-card-admin-actions";
      actions.innerHTML = `
        <button class="character-card-edit-button" type="button" data-edit-character="${index}">
          ✎ Редактировать
        </button>
      `;

      card.appendChild(actions);
    });
  }

  function openEditor(index) {
    activeIndex = index;
    selectedFile = null;
    imageInput.value = "";

    const isNew = index === null;
    const character = isNew
      ? {
          name: "Новый персонаж",
          age: "Неизвестно",
          ability: "Укажите способности",
          description: "Добавьте описание персонажа.",
          image: "assets/images/banner.svg"
        }
      : data.characters[index];

    document.querySelector("#character-admin-title").textContent =
      isNew ? "Добавить персонажа" : `Редактировать: ${character.name}`;

    document.querySelector("#character-admin-index").value = isNew ? "" : String(index);
    document.querySelector("#character-admin-name").value = character.name || "";
    document.querySelector("#character-admin-age").value = character.age || "";
    document.querySelector("#character-admin-ability").value = character.ability || "";
    document.querySelector("#character-admin-description").value = character.description || "";

    preview.src = character.image || "assets/images/banner.svg";
    imageNote.textContent = "Текущая картинка останется, пока вы не выберете новую.";
    deleteButton.hidden = isNew;

    modal.hidden = false;
    document.body.classList.add("modal-open");
    document.querySelector("#character-admin-name").focus();
  }

  function closeEditor() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");
    selectedFile = null;
    imageInput.value = "";

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = null;
    }
  }

  async function saveCharacter() {
    const character = {
      name: document.querySelector("#character-admin-name").value.trim(),
      age: document.querySelector("#character-admin-age").value.trim(),
      ability: document.querySelector("#character-admin-ability").value.trim(),
      description: document.querySelector("#character-admin-description").value.trim(),
      image: activeIndex === null
        ? "assets/images/banner.svg"
        : data.characters[activeIndex].image
    };

    if (!character.name) {
      showStatus("error", "Введите имя персонажа.");
      return;
    }

    setModalBusy(true);
    showStatus("busy", "Сохраняем персонажа…");

    try {
      if (selectedFile) {
        character.image = await OffSkullAdmin.uploadCharacterImage(
          selectedFile,
          character.name,
          session
        );
      }

      const updated = JSON.parse(JSON.stringify(data));

      if (activeIndex === null) {
        updated.characters.push(character);
      } else {
        updated.characters[activeIndex] = character;
      }

      await publishData(updated, "Персонаж сохранён.");
    } catch (error) {
      showStatus("error", OffSkullAdmin.friendlyError(error));
      setModalBusy(false);
    }
  }

  async function publishData(updated, successMessage) {
    try {
      await OffSkullAdmin.saveData(
        updated,
        "Обновлены персонажи со страницы сайта",
        session
      );

      data = updated;
      window.OFFSKULL_DATA = updated;
      renderPublicCards();
      closeEditor();
      showStatus("success", `${successMessage} Страница обновлена.`);
    } catch (error) {
      showStatus("error", OffSkullAdmin.friendlyError(error));
    } finally {
      setModalBusy(false);
    }
  }

  function renderPublicCards() {
    grid.innerHTML = data.characters.map(character => `
      <article class="character-card">
        <img src="${escapeHtml(character.image)}" alt="${escapeHtml(character.name)}">
        <div class="character-info">
          <h2>${escapeHtml(character.name)}</h2>
          <dl>
            <div><dt>Возраст</dt><dd>${escapeHtml(character.age)}</dd></div>
            <div><dt>Способности</dt><dd>${escapeHtml(character.ability)}</dd></div>
          </dl>
          <p>${escapeHtml(character.description)}</p>
        </div>
      </article>
    `).join("");

    decorateCards();
  }

  function setModalBusy(busy) {
    form.querySelectorAll("button, input, textarea").forEach(element => {
      element.disabled = busy;
    });
  }

  function showStatus(type, message) {
    status.className = `inline-admin-status visible ${type}`;
    status.textContent = message;

    clearTimeout(showStatus.timer);
    if (type !== "busy") {
      showStatus.timer = setTimeout(() => status.classList.remove("visible"), 7000);
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
