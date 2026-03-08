# TL;DR
Изменения добавляют статический одностраничный лендинг (HTML/CSS/JS) с базовой интеграцией Telegram WebApp: `ready()`, `MainButton` как основной CTA, минимальная подстройка под `themeParams`, и фолбэки для работы вне Telegram. В целом сделано аккуратно и безопасно (без секретов), но есть несколько потенциальных проблем: повторный вызов `onCta()` через `MainButton.onClick` без отписки (риск дублирования при повторной инициализации), не полностью учтены нюансы Telegram (например, `isExpanded`, `isClosingConfirmationEnabled`, `viewportChanged`), а также есть UX/a11y моменты (скрытая навигация на мобиле, отсутствие явной связи между кнопками/CTA и тем, что в Telegram основной CTA — нижний MainButton).

# What changed
- `index.html` (новый):
  - Полная разметка лендинга с секциями Hero/Problem/Solution/Benefits/Use cases/CTA/FAQ.
  - Подключение Telegram WebApp SDK: `https://telegram.org/js/telegram-web-app.js`.
  - Кнопки CTA: `#primaryCta`, `#secondaryCta`, `#shareBtn`; статусные элементы `#envLine`, `#tgHint`.
  - Добавлены базовые a11y-элементы: skip-link, `aria-label`, `role="status" aria-live="polite"`.
- `assets/style.css` (новый):
  - Полный набор стилей, responsive-поведение, `prefers-reduced-motion`, focus-visible.
  - CSS переменные, которые частично переопределяются через Telegram themeParams (`--bg1`, `--text`, и т.п.).
- `assets/app.js` (новый):
  - Определение среды: `window.Telegram?.WebApp`.
  - В Telegram: `tg.ready()`, `applyTelegramTheme()`, `showMainButton()`, `tg.MainButton.onClick(onCta)`, `tg.onEvent('themeChanged', applyTelegramTheme)`.
  - Поведение CTA:
    - в Telegram: haptic, `sendData()` (demo payload), `expand()`, подсказка.
    - вне Telegram: scroll к секции `#solution`.
  - Share-кнопка с каскадом: `navigator.share` → `tg.openLink` → clipboard.
- `README.md`:
  - Документация структуры и локального запуска, описана Telegram WebApp интеграция и отсутствие секретов.

# Strengths
- Хороший фолбэк вне Telegram: лендинг функционален и без WebApp SDK.
- Telegram интеграция сделана безопасно:
  - Нет логирования токенов/`initData`.
  - `sendData()` отправляет только демо-событие без приватных данных.
- Минимальная подстройка темы через `themeParams` + реакция на `themeChanged`.
- Вёрстка содержит a11y базу: skip-link, `focus-visible`, `aria-live` для подсказок.
- Мобильная адаптация учтена (grid → 1 колонка, CTA блок перестраивается).

# Risks/Potential bugs
- **High** — `assets/app.js`: обработчик `tg.MainButton.onClick(onCta)` без явной защиты от повторной регистрации.
  - **Where:** `assets/app.js`, блок Telegram init.
  - **Why:** если скрипт будет загружен повторно (hot reload, SPA-обёртка, повторный mount в WebView), onClick может накопиться и `onCta` будет вызываться несколько раз.
  - **Suggestion:** перед регистрацией снимать старый обработчик (если доступно) или вводить флаг/одноразовую регистрацию (например, `let bound=false; if (!bound) { ...; bound=true; }`).

- **Medium** — `applyTelegramTheme()`: частичное применение `themeParams` может привести к низкому контрасту/нечитабельности.
  - **Where:** `assets/app.js` (`cssVar('--text', tp.text_color)` и др.) + `assets/style.css` (использование rgba-значений по умолчанию).
  - **Why:** Telegram даёт конкретные цвета, а дизайн предполагает полупрозрачные слои/градиенты; подстановка только части переменных может создать неожиданные сочетания.
  - **Suggestion:** добавить проверку контраста для критичных текстов/кнопок или расширить маппинг (например, также `--bg0`, `--card`, `--card2`) и/или предусмотреть «не применять тему, если нет полного набора».

- **Medium** — `showMainButton()`: установка `tg.MainButton.color/textColor` может конфликтовать с Telegram UX ожиданиями.
  - **Where:** `assets/app.js`, `showMainButton()`.
  - **Why:** в некоторых клиентах/темах Telegram сам подбирает оптимальные цвета; принудительная установка может ухудшить читаемость.
  - **Suggestion:** задавать цвета только если точно нужны, и/или проверять наличие обоих параметров одновременно; можно оставить Telegram defaults.

- **Medium** — UX в Telegram: дублирование CTA (HTML-кнопка + MainButton) может путать пользователя.
  - **Where:** `index.html` (Hero CTA), `assets/app.js` (подсказки и MainButton).
  - **Why:** в Mini App ожидаемый главный CTA снизу (MainButton), а в контенте есть ещё одна «Запустить демо». Пользователь может нажать верхнюю кнопку, а действие будет `sendData` без видимого эффекта (кроме подсказки), если бэкенд/бот не обрабатывает.
  - **Suggestion:** в Telegram режиме скрывать/дизейблить верхний `#primaryCta` и объяснять, что основной CTA — MainButton, либо делать верхнюю кнопку триггером `tg.MainButton.show()` + визуальная подсветка.

- **Low** — A11y: `role="list"` на контейнерах с div-элементами допустим, но не идеально.
  - **Where:** `index.html`, блок `.timeline` и `.usecases`.
  - **Why:** семантически лучше использовать `<ul>/<li>` или `<ol>/<li>`.
  - **Suggestion:** заменить на нативные списки или убедиться, что скринридеры корректно озвучивают структуру.

- **Low** — Share: `navigator.clipboard` требует secure context (HTTPS/localhost).
  - **Where:** `assets/app.js`, `initShare()`.
  - **Why:** при открытии по `http` (не localhost) или в некоторых WebView clipboard может не работать → останется только hint.
  - **Suggestion:** добавить дополнительный фолбэк: показать модал/инпут с URL для ручного копирования.

- **Low** — `tg.openLink(url)` может открывать текущий URL, что в Mini App не всегда ожидаемо.
  - **Where:** `assets/app.js`, `initShare()`.
  - **Suggestion:** если цель — шаринг, лучше формировать `https://t.me/share/url?...` (вне Telegram) или использовать `openTelegramLink` (если доступно) / deep link для шаринга.

# Test cases to add
## P0
- Telegram WebApp (реальный клиент):
  - MainButton видим после загрузки, текст «Запустить демо».
  - Нажатие MainButton вызывает `sendData()` один раз (проверить отсутствие дублей при повторном открытии/перезагрузке WebView).
  - `themeChanged` меняет цвета (проверить светлую/тёмную тему).
  - `HapticFeedback` не ломает выполнение (нет ошибок).

- Fallback вне Telegram (обычный мобильный браузер):
  - Нажатие «Запустить демо» скроллит к секции `#solution`.
  - Страница не падает при отсутствии `window.Telegram`.

## P1
- Share-кнопка:
  - iOS Safari/Android Chrome: `navigator.share` открывается и не вызывает ошибок при отмене.
  - Telegram WebView: если `navigator.share` недоступен, проверка ветки `tg.openLink`.
  - Clipboard фолбэк: localhost работает; на http/без разрешений корректный hint.

- Mobile UX:
  - Проверить sticky header + skip-link на маленьких экранах.
  - Проверить, что контент не перекрывается MainButton (нижний отступ/скролл до CTA секции).

## P2
- A11y:
  - Навигация с клавиатуры: видимый фокус на ссылках/кнопках/summary.
  - Скринридер: корректная озвучка `role="status"` подсказок `#tgHint`.
  - `prefers-reduced-motion`: отсутствие анимаций/плавных скроллов.

# Suggestions
- Добавить явный режим Telegram vs non-Telegram в UI:
  - В Telegram скрывать/упрощать верхние CTA и подчёркивать MainButton.
  - Вне Telegram — показывать CTA в контенте как основной.
- Усилить устойчивость Telegram интеграции:
  - Защититься от повторного bind `MainButton.onClick`.
  - Опционально обрабатывать `viewportChanged` и добавлять safe-area отступ снизу, чтобы MainButton не перекрывал важные элементы.
- Добавить безопасный отладочный режим:
  - Никаких логов `initData`, но можно логировать только «включен Telegram режим» за флагом (query param `?debug=1`).

# Questions
- Какой ожидаемый контракт для `sendData()` (кто и где принимает payload)? Нужен ли формат/версионирование событий?
- Нужно ли при нажатии CTA реально открывать демо-страницу/маршрут внутри Mini App (например, через `openLink`/`openTelegramLink`), а не только `sendData()`?
- Планируется ли поддержка light-темы как first-class (другие переменные/фон), или достаточно текущей минимальной подстройки?
