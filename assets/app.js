/* OpenClaw AI Flow — Telegram Mini App landing
   - Calls Telegram.WebApp.ready()
   - Uses MainButton for CTA
   - Applies themeParams minimally
   - Safe fallback outside Telegram
*/

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  const primaryCta = $('#primaryCta');
  const secondaryCta = $('#secondaryCta');
  const shareBtn = $('#shareBtn');
  const envLine = $('#envLine');
  const tgHint = $('#tgHint');
  const year = $('#year');

  if (year) year.textContent = String(new Date().getFullYear());

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  // Prevent duplicate handler registrations if init runs more than once
  // (e.g., WebView reload quirks, hot reload, or page re-executions).
  let mainButtonBound = false;

  function setHint(text) {
    if (!tgHint) return;
    tgHint.textContent = text;
  }

  function cssVar(name, value) {
    if (!value) return;
    document.documentElement.style.setProperty(name, value);
  }

  function applyTelegramTheme() {
    if (!tg) return;

    const tp = tg.themeParams || {};

    // Minimal theme adaptation: background + text + accent
    // Note: themeParams values are hex colors (strings).
    cssVar('--bg1', tp.bg_color);
    cssVar('--text', tp.text_color);
    cssVar('--muted', tp.hint_color);
    cssVar('--stroke', tp.separator_color);
    cssVar('--accent2', tp.link_color);

    // Respect Telegram color scheme preference when available
    if (tg.colorScheme === 'light') {
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.style.colorScheme = 'dark';
    }
  }

  function showMainButton() {
    if (!tg) return;

    tg.MainButton.setText('Запустить демо');
    tg.MainButton.show();

    // Prefer Telegram button colors when present; otherwise rely on Telegram defaults.
    const tp = tg.themeParams || {};
    if (tp.button_color) tg.MainButton.color = tp.button_color;
    if (tp.button_text_color) tg.MainButton.textColor = tp.button_text_color;
  }

  function onCta() {
    // Primary CTA behavior:
    // - in Telegram: sendData + haptic feedback + optional expand
    // - outside Telegram: smooth scroll to Solution

    if (tg) {
      try {
        tg.HapticFeedback?.impactOccurred?.('medium');
      } catch (_) {}

      // Example payload — no secrets, just a demo event
      try {
        tg.sendData(
          JSON.stringify({
            event: 'cta_click',
            source: 'landing',
            ts: Date.now(),
          })
        );
      } catch (_) {
        // Some environments may block sendData if not launched as WebApp
      }

      try {
        tg.expand();
      } catch (_) {}

      setHint('MainButton: отправили событие в WebApp (sendData).');
      return;
    }

    const el = document.getElementById('solution');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function initShare() {
    if (!shareBtn) return;

    shareBtn.addEventListener('click', async () => {
      const url = window.location.href;
      const text = 'Посмотри: OpenClaw AI Flow (Telegram Mini App)';

      // Native share when possible
      if (navigator.share) {
        try {
          await navigator.share({ title: 'OpenClaw AI Flow', text, url });
          return;
        } catch (_) {
          // ignore
        }
      }

      // Telegram openLink as fallback inside Telegram
      if (tg) {
        try {
          tg.openLink(url);
          return;
        } catch (_) {}
      }

      // Clipboard fallback
      try {
        await navigator.clipboard.writeText(url);
        setHint('Ссылка скопирована в буфер обмена.');
      } catch (_) {
        setHint('Не удалось скопировать ссылку.');
      }
    });
  }

  // Wire normal buttons
  if (primaryCta) primaryCta.addEventListener('click', onCta);
  if (secondaryCta) secondaryCta.addEventListener('click', () => {
    // Encourage Telegram MainButton; also trigger the same action
    if (tg) {
      showMainButton();
      setHint('MainButton включён — нажмите его внизу экрана Telegram.');
      return;
    }
    onCta();
  });

  initShare();

  // Telegram init
  if (tg) {
    tg.ready();
    applyTelegramTheme();
    showMainButton();

    if (!mainButtonBound) {
      tg.MainButton.onClick(onCta);
      mainButtonBound = true;
    }

    // Let users know they are in Telegram environment
    const v = tg.version ? `v${tg.version}` : 'unknown';
    const scheme = tg.colorScheme || 'unknown';
    if (envLine) envLine.textContent = `Telegram WebApp ${v} · scheme: ${scheme}`;

    setHint('Вы открыли страницу внутри Telegram. CTA доступен через MainButton.');

    // React to theme changes if Telegram client updates them
    tg.onEvent('themeChanged', applyTelegramTheme);
  } else {
    if (envLine)
      envLine.textContent = 'Открыто вне Telegram. Для полного UX откройте внутри Mini App.';
    setHint('Подсказка: откройте страницу внутри Telegram Mini App, чтобы увидеть MainButton.');
  }
})();
