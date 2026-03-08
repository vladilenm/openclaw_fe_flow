# openclaw_fe_flow

Первая версия продающего лендинга (1 HTML-страница) с технологичным AI-дизайном под **Telegram Mini App**.

## Структура

- `index.html` — лендинг
- `assets/style.css` — стили
- `assets/app.js` — логика + интеграция Telegram WebApp

## Как открыть локально

Вариант 1 (самый простой):

```bash
cd /root/.openclaw/workspace/openclaw_fe_flow
python3 -m http.server 5173
```

Далее открыть:

- http://localhost:5173/

Вариант 2 (через Node):

```bash
npx serve .
```

## Telegram WebApp интеграция

В `index.html` подключён SDK:

- `https://telegram.org/js/telegram-web-app.js`

В `assets/app.js`:

- вызывается `Telegram.WebApp.ready()`
- используется `Telegram.WebApp.MainButton` как CTA (текст, show(), обработчик)
- минимально учитываются `themeParams` (bg/text/hint/link/button)
- есть fallback поведение вне Telegram

> Важно: в репозитории **нет** секретов/токенов.
