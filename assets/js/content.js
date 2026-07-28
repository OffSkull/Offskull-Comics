window.OFFSKULL_SEED = {
  schemaVersion: 2,

  site: {
    name: "OffSkull Comics",
    slogan: "Истории, которые не боятся темноты",
    heroTitle: "Мир авторских комиксов",
    heroText: "Читайте новые выпуски, знакомьтесь с героями и следите за развитием вселенной OffSkull Comics.",
    authorName: "Дмитрий Черепов",
    authorRole: "Автор комиксов и создатель проекта",
    authorImage: "assets/images/author/author-placeholder.svg",
    authorText: `Дмитрий Черепов — автор комиксов и создатель проекта OffSkull Comics. Он придумывает необычные миры, ярких героев и истории, в которых серьёзные приключения сочетаются с юмором, фантастикой и неожиданными поворотами.

Каждый комикс OffSkull создаётся с особым вниманием к персонажам, атмосфере и визуальному стилю. Здесь викинги могут оказаться в современном мире, странные супергерои — спасти город, а самые необычные способности становятся началом больших приключений.

Главная цель проекта — создавать оригинальные русскоязычные комиксы, которые хочется читать, обсуждать и пересматривать. OffSkull Comics — это мир авторских историй, где возможно всё.`
  },

  heroNews: {
    visible: true,
    label: "Скоро",
    title: "Скоро выход комикса",
    text: "Новая история. Новый герой. Новый мир.",
    buttonText: "Узнать больше",
    link: "comic.html?id=ten-goroda",
    image: "assets/images/comics/ten-goroda/cover.png",
    imageAlt: "Обложка комикса Тень города"
  },

  comics: [
    {
      id: "liga-smeha",
      title: "Лига Смеха",
      cover: "assets/images/comics/liga-smeha/cover.svg",
      description: "Команда странных героев спасает город так, как умеет: громко, нелепо и неожиданно эффективно.",
      genre: "Супергероика, комедия, приключения",
      age: "16+",
      status: "Выходит",
      featured: true,
      issues: [
        {
          number: 1,
          title: "Сигнал Недодела",
          date: "26 июля 2026",
          pages: [
            "assets/images/comics/liga-smeha/issue-1/page-1.svg",
            "assets/images/comics/liga-smeha/issue-1/page-2.svg",
            "assets/images/comics/liga-smeha/issue-1/page-3.svg",
            "assets/images/comics/liga-smeha/issue-1/page-4.svg"
          ]
        }
      ]
    },
    {
      id: "viking",
      title: "Викинг",
      cover: "assets/images/comics/viking/cover.svg",
      description: "Яромир оказывается в будущем, учится жить в современном мире и вступает в борьбу со злодеем Морданом.",
      genre: "Фэнтези, фантастика, приключения",
      age: "12+",
      status: "Выходит",
      featured: true,
      issues: [
        {
          number: 1,
          title: "Чужое время",
          date: "27 июля 2026",
          pages: [
            "assets/images/comics/viking/issue-1/page-1.svg",
            "assets/images/comics/viking/issue-1/page-2.svg",
            "assets/images/comics/viking/issue-1/page-3.svg",
            "assets/images/comics/viking/issue-1/page-4.svg"
          ]
        }
      ]
    },
    {
      id: "ten-goroda",
      title: "Тень города",
      cover: "assets/images/comics/ten-goroda/cover.png",
      description: "Новая мрачная история о герое, который скрывается в ночном городе и знает больше, чем должен.",
      genre: "Мистика, триллер, супергероика",
      age: "16+",
      status: "Скоро",
      featured: true,
      issues: [
        {
          number: 1,
          title: "Тьма знает твоё имя",
          date: "Скоро",
          pages: [
            "assets/images/comics/ten-goroda/issue-1/page-1.svg",
            "assets/images/comics/ten-goroda/issue-1/page-2.svg",
            "assets/images/comics/ten-goroda/issue-1/page-3.svg",
            "assets/images/comics/ten-goroda/issue-1/page-4.svg"
          ]
        }
      ]
    }
  ],

  characters: [
    {
      id: "americanets",
      name: "Американец",
      image: "assets/images/characters/char-1.svg",
      age: "29 лет",
      ability: "Невероятная уверенность и сила",
      description: "Всегда заканчивает начатое, даже когда никто не понимает, что именно он начал."
    },
    {
      id: "krot",
      name: "Крот",
      image: "assets/images/characters/char-2.svg",
      age: "Неизвестно",
      ability: "Подземные тоннели и чувство земли",
      description: "Может прорыть путь почти куда угодно. Иногда — не в ту сторону."
    },
    {
      id: "vinograd",
      name: "Виноград",
      image: "assets/images/characters/char-3.svg",
      age: "24 года",
      ability: "Управление лозами и взрывными ягодами",
      description: "Превращает силу природы в оружие и никогда не забывает про витамины."
    },
    {
      id: "stapar",
      name: "Стапарь",
      image: "assets/images/characters/char-4.svg",
      age: "35 лет",
      ability: "Кратковременное бессмертие",
      description: "После особого напитка становится неуязвимым. Время действия ограничено."
    },
    {
      id: "yaromir",
      name: "Яромир",
      image: "assets/images/characters/yaromir.svg",
      age: "18 лет",
      ability: "Управление раскалённым металлом",
      description: "Викинг, оказавшийся в будущем. Создаёт цепи, крюки и оружие из раскалённого металла."
    },
    {
      id: "mordan",
      name: "Мордан",
      image: "assets/images/characters/mordan.svg",
      age: "Неизвестно",
      ability: "Руны, осколки и управление големами",
      description: "Опасный противник Яромира. Наблюдает из тени и управляет древней силой."
    }
  ]
};

window.OFFSKULL_DATA = window.OFFSKULL_SEED;
