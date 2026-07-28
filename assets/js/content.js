window.OFFSKULL_DATA = {
  site: {
    name: "OffSkull Comics",
    slogan: "Истории, которые не боятся темноты",
    heroTitle: "Мир авторских комиксов",
    heroText: "Читайте новые выпуски, знакомьтесь с героями и следите за развитием вселенной OffSkull Comics.",
   site: {
  name: "OffSkull Comics",

  authorName: "Дмитрий Черепов",

 authorText: `Дмитрий Черепов — автор комиксов и создатель проекта OffSkull Comics. Он придумывает необычные миры, ярких героев и истории, в которых серьёзные приключения сочетаются с юмором, фантастикой и неожиданными поворотами.

Каждый комикс OffSkull создаётся с особым вниманием к персонажам, атмосфере и визуальному стилю. Здесь викинги могут оказаться в современном мире, странные супергерои — спасти город, а самые необычные способности становятся началом больших приключений.

Главная цель проекта — создавать оригинальные русскоязычные комиксы, которые хочется читать, обсуждать и пересматривать. OffSkull Comics — это мир авторских историй, где возможно всё.`
},
  },
  
heroNews: {
  visible: true,
  label: "Скоро",
  title: "Скоро выход нового комикса",
  text: "Новая история. Новый герой. Новый мир.",
  buttonText: "Узнать больше",
  link: "comic.html",
  image: "assets/images/banner.svg",
  imageAlt: "Скоро новый комикс"
},
  
  comics: [
    {
      id: "otshchipentsy",
      title: "Отщипенцы",
      cover: "assets/images/comics/otshchipentsy/cover.svg",
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
            "assets/images/comics/otshchipentsy/issue-1/page-1.svg",
            "assets/images/comics/otshchipentsy/issue-1/page-2.svg",
            "assets/images/comics/otshchipentsy/issue-1/page-3.svg",
            "assets/images/comics/otshchipentsy/issue-1/page-4.svg"
          ]
        }
      ]
    }
  ],

  characters: [
    {
      name: "Американец",
      image: "assets/images/characters/char-1.svg",
      age: "29 лет",
      ability: "Невероятная уверенность и сила",
      description: "Всегда заканчивает начатое, даже когда никто не понимает, что именно он начал."
    },
    {
      name: "Крот",
      image: "assets/images/characters/char-2.svg",
      age: "Неизвестно",
      ability: "Подземные тоннели и чувство земли",
      description: "Может прорыть путь почти куда угодно. Иногда — не в ту сторону."
    },
    {
      name: "Виноград",
      image: "assets/images/characters/char-3.svg",
      age: "24 года",
      ability: "Управление лозами и взрывными ягодами",
      description: "Превращает силу природы в оружие и никогда не забывает про витамины."
    },
    {
      name: "Стапарь",
      image: "assets/images/characters/char-4.svg",
      age: "35 лет",
      ability: "Кратковременное бессмертие",
      description: "После особого напитка становится неуязвимым. Время действия ограничено."
    }
  ]
};
