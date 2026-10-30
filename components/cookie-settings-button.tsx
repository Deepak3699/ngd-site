'use client';

export function CookieSettingsButton() {
  return (
    <button type="button" className="footer-text-button" onClick={() => window.dispatchEvent(new Event('ngd:cookie-settings'))}>
      Cookie preferences
    </button>
  );
}
