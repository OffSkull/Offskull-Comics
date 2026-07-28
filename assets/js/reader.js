(async () => {
  "use strict";

  const root = document.querySelector("#reader-page");
  if (!root) return;

  const data = await window.OffSkullData.load();
  const params = new URLSearchParams(location.search);
  const comicId = params.get("id");
  const issueNumber = Number(params.get("issue") || 1);

  const comic = data.comics.find(item => String(item.id) === String(comicId)) || data.comics[0];
  const issue = comic?.issues?.find(item => Number(item.number) === issueNumber) || comic?.issues?.[0];
  const pages = Array.isArray(issue?.pages) ? issue.pages : [];

  const escapeHtml = value =>
    String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  if (!comic || !issue || !pages.length) {
    root.innerHTML = `<div class="reader-empty"><strong>Страницы пока не загружены</strong><a class="button" href="comic.html">Вернуться</a></div>`;
    return;
  }

  document.title = `${comic.title} — ${issue.title || `Выпуск ${issue.number}`}`;

  root.innerHTML = `
    <header class="reader-toolbar">
      <a href="comic.html?id=${encodeURIComponent(comic.id)}">← К выпускам</a>
      <div><strong>${escapeHtml(comic.title)}</strong><span>${escapeHtml(issue.title || `Выпуск ${issue.number}`)}</span></div>
      <span id="reader-progress">1 / ${pages.length}</span>
    </header>
    <main class="vertical-reader-pages">
      ${pages.map((page, index) => `
        <figure class="vertical-reader-page" data-page="${index + 1}">
          <img src="${page}" alt="${escapeHtml(comic.title)}, страница ${index + 1}" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}>
          <figcaption>Страница ${index + 1} из ${pages.length}</figcaption>
        </figure>
      `).join("")}
    </main>
    <footer class="reader-finish"><strong>Конец выпуска</strong><a class="button" href="comic.html?id=${encodeURIComponent(comic.id)}">К выпускам</a></footer>
  `;

  const progress = document.querySelector("#reader-progress");
  const pageEls = [...document.querySelectorAll(".vertical-reader-page")];
  if ("IntersectionObserver" in window) {
    const visible = new Map();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
      let current = pageEls[0], best = -1;
      pageEls.forEach(el => {
        const ratio = visible.get(el) || 0;
        if (ratio > best) { best = ratio; current = el; }
      });
      progress.textContent = `${current.dataset.page} / ${pageEls.length}`;
    }, { rootMargin: "-15% 0px -35% 0px", threshold: [0,.1,.25,.5,.75,1] });
    pageEls.forEach(el => observer.observe(el));
  }
})();
