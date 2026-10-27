(function () {
  'use strict';
  var KEY = 'ngd-theme';
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function getChoice() {
    try {
      var saved = localStorage.getItem(KEY);
      return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'light';
    } catch (_) { return 'system'; }
  }

  function applyTheme() {
    var selected = getChoice();
    var dark = selected === 'system' ? !!(media && media.matches) : selected === 'dark';
    var mode = dark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0A0A0F' : '#fbfaff');

    var button = document.getElementById('ngdThemeToggle');
    if (!button) return;
    var icon = selected === 'system'
      ? '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>'
      : selected === 'light'
        ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"/>'
        : '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>';
    button.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icon + '</svg>';
    button.setAttribute('aria-label', 'Theme: ' + selected + '. Click to change theme.');
    button.title = 'Theme: ' + selected + ' · click to cycle';
  }

  window.NGDSetTheme = function (selected) {
    if (selected !== 'light' && selected !== 'dark' && selected !== 'system') selected = 'system';
    try { localStorage.setItem(KEY, selected); } catch (_) {}
    applyTheme();
  };

  // Delegated click handling works even if the header is inserted after this script runs.
  document.addEventListener('click', function (event) {
    var target = event.target;
    var button = target && target.closest ? target.closest('#ngdThemeToggle') : null;
    if (!button) return;
    var current = getChoice();
    window.NGDSetTheme(current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system');
  });

  applyTheme();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
  } else {
    applyTheme();
  }
  if (media) {
    var onSystemChange = function () { if (getChoice() === 'system') applyTheme(); };
    if (media.addEventListener) media.addEventListener('change', onSystemChange);
    else if (media.addListener) media.addListener(onSystemChange);
  }
})();
