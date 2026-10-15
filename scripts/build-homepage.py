#!/usr/bin/env python3
"""
One-shot build: take the original homepage (scripts/original-part*.html) and
produce the upgraded public/index.html.

Every edit asserts its anchor exists, so the script fails loudly instead of
silently shipping a half-patched page.
"""
import json
import pathlib
import re
import sys
from html import escape, unescape
from urllib.parse import quote

ROOT = pathlib.Path(__file__).resolve().parent.parent
S = ROOT / 'scripts'


def read(p):
    return (ROOT / p).read_text(encoding='utf-8')


def must(haystack, needle, label):
    if needle not in haystack:
        print(f'✗ anchor not found: {label}', file=sys.stderr)
        sys.exit(1)
    return haystack


html = (read('scripts/original-part1.html')
        + read('scripts/original-part2.html')
        + read('scripts/original-part3.html'))

new_css = read('scripts/_new-css.txt')
pricing_contact = read('scripts/_new-pricing-contact.html')
final_cta = read('scripts/_new-final-cta.html')
lead_js = read('scripts/_new-lead-js.txt')

# ---------------------------------------------------------------- 1. doctype
must(html, '<html lang="en" class="scroll-smooth">', 'html tag')
html = '<!doctype html>\n' + html

# ------------------------------------------------------------------ 2. head
title_anchor = ('  <title>NGD — NextGenDev Solutions | Build, Launch, Market & '
                'Automate Your Digital Presence</title>')
must(html, title_anchor, 'title')
head_extras = title_anchor + """
  <meta name="theme-color" content="#0A0A0F" />
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
  <link rel="apple-touch-icon" href="/assets/favicon.svg" />
  <link rel="canonical" href="https://ngdsolutions.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="NGD — NextGenDev Solutions" />
  <meta property="og:title" content="NGD — Build, Launch, Market & Automate Your Digital Presence" />
  <meta property="og:description"
    content="A digital solutions agency for businesses and students: branding, websites, apps, marketing, SEO and AI — with fixed pricing and student rates." />
  <meta property="og:url" content="https://ngdsolutions.com/" />
  <meta name="twitter:card" content="summary_large_image" />
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "name": "NGD — NextGenDev Solutions",
      "description": "Digital solutions agency: branding, websites, apps, marketing, SEO and AI automation.",
      "email": "hello@ngdsolutions.com",
      "areaServed": "Worldwide",
      "priceRange": "$$",
      "url": "https://ngdsolutions.com/"
    }
  </script>"""
html = html.replace(title_anchor, head_extras, 1)

# ------------------------- 3. swap the Tailwind CDN for a compiled stylesheet
cdn_block = re.search(
    r'\s*<script src="https://cdn\.tailwindcss\.com/?[^"]*"></script>\s*'
    r'<script>\s*tailwind\.config\s*=.*?</script>',
    html,
    re.S,
)
if not cdn_block:
    print('✗ Tailwind CDN block not found', file=sys.stderr)
    sys.exit(1)

css_link = ('\n  <link rel="stylesheet" href="/assets/tailwind.css" />'
            '\n  <!-- compiled from tailwind.config.js — run `npm run css` after markup changes -->')
html = html[:cdn_block.start()] + css_link + html[cdn_block.end():]

# -------------------------------------- 4. dead GitHub button → email button
old_gh = re.search(r'<a href="https://github\.com".*?</a>', html, re.S)
if not old_gh:
    print('✗ GitHub anchor not found', file=sys.stderr)
    sys.exit(1)
new_mail = '''<a href="#" data-ngd="email"
            class="hidden sm:flex w-9 h-9 rounded-lg border border-white/10 items-center justify-center text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all"
            aria-label="Email NGD">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="M4 7l8 6 8-6" />
            </svg>
          </a>'''
html = html[:old_gh.start()] + new_mail + html[old_gh.end():]

# ------------------------------------------------------------- 5. new styles
css_anchor = '    @media (prefers-reduced-motion: reduce) {'
must(html, css_anchor, 'reduced-motion media query')
html = html.replace(css_anchor, new_css + '\n' + css_anchor, 1)

# ------------------------------------------- 6. pricing + contact / enquiry
must(html, '@@PRICING_AND_CONTACT@@', 'pricing placeholder')
html = html.replace('@@PRICING_AND_CONTACT@@', pricing_contact.rstrip(), 1)

# -------------------------------------------------------- 7. final CTA block
must(html, '@@FINAL_CTA@@', 'final CTA placeholder')
html = html.replace('@@FINAL_CTA@@', final_cta.rstrip(), 1)

# ------------------------------------------------------------- 8. lead logic
must(html, '@@LEAD_JS@@', 'lead JS placeholder')
html = html.replace('@@LEAD_JS@@', lead_js.rstrip(), 1)

# ------------------------------- 9. observe the new reveal-scale animations
must(html, "var revealEls = document.querySelectorAll('.reveal');", 'reveal selector')
html = html.replace(
    "var revealEls = document.querySelectorAll('.reveal');",
    "var revealEls = document.querySelectorAll('.reveal, .reveal-scale');",
    1,
)

# ------------------- 10. contact config (WhatsApp / email / phone / socials)
cfg = json.loads((ROOT / 'site.config.json').read_text(encoding='utf-8'))
cfg.pop('_readme', None)
inline_cfg = (
    '  <script id="ngd-config">\n'
    "    /* generated from site.config.json — edit that file, then run `npm run build` */\n"
    '    window.NGD_CONFIG = ' + json.dumps(cfg, ensure_ascii=False, indent=2) + ';\n'
    '  </script>\n'
)
css_link_anchor = ('  <link rel="stylesheet" href="/assets/tailwind.css" />\n'
                   '  <!-- compiled from tailwind.config.js')
must(html, css_link_anchor, 'tailwind link')
html = html.replace(css_link_anchor, inline_cfg + css_link_anchor, 1)

# --- hero: premium icon-only WhatsApp button next to "See our work" ----------
WA_GLYPH = (
    'M12 .8A11.2 11.2 0 0 0 .8 12c0 2 .5 3.9 1.5 5.6L.6 23.4l6-1.6a11.2 11.2 0 0 0 5.4 1.4'
    'A11.2 11.2 0 0 0 23.2 12 11.2 11.2 0 0 0 12 .8zm5.5 13.6c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2l-.9 1.1'
    'c-.2.3-.4.3-.7.2a8.2 8.2 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6'
    '.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3'
    'c.2.2 2.3 3.6 5.6 5 3.3 1.3 3.8 1.1 4.5 1 .7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.7-.1-.2-.3-.3-.6-.4z'
    'M12 21.5c-1.7 0-3.3-.4-4.7-1.3l-.3-.2-3.5.9.9-3.4-.2-.4A9.4 9.4 0 0 1 2.6 12 9.4 9.4 0 0 1 12 2.6'
    ' 9.4 9.4 0 0 1 21.4 12 9.4 9.4 0 0 1 12 21.5z'
)

# --- hero: premium icon-only WhatsApp button next to "See our work" -----------------
hero_tail = """                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
            </div>"""
must(html, hero_tail, 'hero buttons')
hero_new = f"""                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </a>
              <a href="#" data-ngd="whatsapp" class="wa-orb" title="Chat on WhatsApp"
                aria-label="Chat with us on WhatsApp">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="{WA_GLYPH}" />
                </svg>
              </a>
            </div>"""
html = html.replace(hero_tail, hero_new, 1)

# --- footer: contact rows → config driven, plus WhatsApp + phone --------------
footer_block = re.compile(
    r'<li>\s*<a href="mailto:hello@ngdsolutions\.com".*?Remote-first, worldwide\s*</a>\s*</li>',
    re.S,
)
m = footer_block.search(html)
if not m:
    print('✗ footer contact list not found', file=sys.stderr)
    sys.exit(1)

WA_ICON = ('M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.2l-.9 1.1c-.2.3-.4.3-.7.2a8.2 8.2 0 0 1-2.4-1.5 '
           '9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.5-.5-.5-.7-.5h-.6c-.2 '
           '0-.6.1-.9.4-.3.4-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.6 5.6 5 3.3 1.3 3.8 1.1 4.5 1 .7-.1 '
           '2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.7-.1-.2-.3-.3-.6-.4z')

footer_new = f'''<li>
              <a href="#" data-ngd="whatsapp"
                class="flex items-center gap-2.5 text-white/58 transition hover:text-white">
                <svg class="h-4 w-4 text-[#4ADE80]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="{WA_ICON}" />
                </svg>
                <span data-ngd-text="whatsapp">WhatsApp</span>
              </a>
            </li>
            <li>
              <a href="#" data-ngd="phone"
                class="flex items-center gap-2.5 text-white/58 transition hover:text-white">
                <svg class="h-4 w-4 text-white/32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.8" aria-hidden="true">
                  <path
                    d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
                </svg>
                <span data-ngd-text="phone">Phone</span>
              </a>
            </li>
            <li>
              <a href="#" data-ngd="email"
                class="flex items-center gap-2.5 text-white/58 transition hover:text-white">
                <svg class="h-4 w-4 text-white/32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.8" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2.5" />
                  <path d="M4 7l8 6 8-6" />
                </svg>
                <span data-ngd-text="email">Email</span>
              </a>
            </li>
            <li>
              <a href="#contact" class="flex items-center gap-2.5 text-white/58 transition hover:text-white">
                <svg class="h-4 w-4 text-white/32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.8" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3.5 2" />
                </svg>
                <span data-ngd-text="hours">Mon–Fri, 9am–6pm</span>
              </a>
            </li>
            <li>
              <a href="#contact" class="flex items-center gap-2.5 text-white/58 transition hover:text-white">
                <svg class="h-4 w-4 text-white/32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.8" aria-hidden="true">
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
                <span data-ngd-text="location">Remote-first, worldwide</span>
              </a>
            </li>'''

html = html[:m.start()] + footer_new + html[m.end():]

# --- footer socials → config driven (and hidden when empty) -------------------
SOCIAL_RE = re.compile(r'<a href="#top"([^>]*aria-label="NGD on ([A-Za-z]+)")>')


def social_sub(match):
    tail, label = match.group(1), match.group(2)
    key = label.lower()
    return f'<a href="#" data-ngd="{key}"{tail}>'


html, social_count = SOCIAL_RE.subn(social_sub, html)
if social_count < 3:
    print(f'  ! only {social_count} footer social links rewritten', file=sys.stderr)

# --- never advertise the admin location on a public page ----------------------
html, removed = re.subn(r'\s*<a href="/admin"[^>]*>Admin</a>', '', html)
if removed != 1:
    print(f'  ! expected to remove exactly 1 admin footer link, removed {removed}', file=sys.stderr)

# ------------------------------------- 10b. static fill for the contact links
# The page also fills these in at runtime (applySiteConfig), but doing it here
# means the links work before JS runs, for no-JS visitors and for crawlers.
def _wa_href(message):
    number = re.sub(r'\D', '', str(cfg.get('whatsapp') or ''))
    if not number:
        return ''
    text = message or cfg.get('whatsappMessage') or ''
    return f'https://wa.me/{number}?text={quote(text)}' if text else f'https://wa.me/{number}'


def _static_href(kind, tag):
    if kind == 'whatsapp':
        msg = re.search(r'data-ngd-msg="([^"]*)"', tag)
        return _wa_href(unescape(msg.group(1)) if msg else '')
    if kind == 'email':
        return f'mailto:{cfg["email"]}' if cfg.get('email') else ''
    if kind == 'phone':
        return f'tel:{re.sub(r"[^\d+]", "", str(cfg["phone"]))}' if cfg.get('phone') else ''
    return cfg.get(kind) or ''


STATIC_TEXT = {
    'email': lambda: cfg.get('email') or '',
    'phone': lambda: cfg.get('phone') or '',
    'whatsapp': lambda: cfg.get('whatsappDisplay') or cfg.get('whatsapp') or '',
    'hours': lambda: cfg.get('hours') or '',
    'location': lambda: cfg.get('location') or '',
}


def _hide_tag(tag):
    """Inline style, because Tailwind's display utilities would beat [hidden]."""
    if 'style="' in tag:
        return tag.replace('style="', 'style="display:none;', 1)
    return tag[:-1] + ' style="display:none">'


def fill_anchor(match):
    tag, kind = match.group(0), match.group(1)
    href = _static_href(kind, tag)
    if not href:
        return _hide_tag(tag)
    if 'href="#"' in tag:
        tag = tag.replace('href="#"', f'href="{escape(href, quote=True)}"', 1)
    return tag


html, filled_links = re.subn(r'<a\b[^>]*\bdata-ngd="([a-z]+)"[^>]*>', fill_anchor, html)


def fill_text(match):
    kind = match.group(1)
    value = STATIC_TEXT.get(kind, lambda: '')()
    if not value:
        return _hide_tag(match.group(0))
    return f'<span data-ngd-text="{kind}">{escape(value)}</span>'


html, filled_text = re.subn(r'<span data-ngd-text="([a-z]+)">[^<]*</span>', fill_text, html)

# --------------------------------------------------------------- 11. sanity
for bad in ['@@', 'id="ctaForm"', 'tabProject', 'github.com', '/admin']:
    if bad in html:
        print(f'✗ leftover marker / stale reference: {bad!r}', file=sys.stderr)
        sys.exit(1)

ids = re.findall(r'\sid="([^"]+)"', html)
dupes = sorted({i for i in ids if ids.count(i) > 1})
if dupes:
    print(f'✗ duplicate ids: {dupes}', file=sys.stderr)
    sys.exit(1)

# every WhatsApp button must carry a real link once the build is done
if cfg.get('whatsapp'):
    if html.count('data-ngd="whatsapp"') > html.count('https://wa.me/'):
        print('✗ some WhatsApp buttons have no href after the static fill', file=sys.stderr)
        sys.exit(1)
else:
    print('  ! site.config.json has no whatsapp number — WhatsApp buttons stay hidden')

required = ['id="ngd-config"', 'data-ngd="whatsapp"', 'data-ngd-text="email"', 'id="leadForm"']
for marker in required:
    must(html, marker, f'required output {marker}')

out = ROOT / 'public' / 'index.html'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'✓ wrote {out.relative_to(ROOT)} — {len(html) / 1024:.1f} KB, '
      f'{len(html.splitlines())} lines, {len(ids)} ids (all unique), '
      f'{html.count("data-ngd=")} config-driven links, '
      f'{filled_links} static hrefs + {filled_text} text values filled from site.config.json')
