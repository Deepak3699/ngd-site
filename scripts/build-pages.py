#!/usr/bin/env python3
"""Build the standalone Solutions and Students pages from shared site chrome."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
HOME = (ROOT / 'public' / 'index.html').read_text(encoding='utf-8')


def between(source, start, end):
    left = source.index(start)
    right = source.index(end, left) + len(end)
    return source[left:right]


head = HOME[:HOME.index('</head>') + len('</head>')]
noise = '<div class="noise" aria-hidden="true"></div>'
progress = between(HOME, '<!-- Scroll progress -->', '<!-- ============ NAVBAR ============ -->').rstrip()
header = between(HOME, '<header class="fixed inset-x-0 top-0 z-[70]">', '</header>')
footer = between(HOME, '<footer class="relative border-t', '</footer>')
search_modal = between(HOME, '<!-- ══════════ CMDK (Search Modal) ══════════ -->', '  <script>')[:-len('  <script>')].rstrip()


def page_chrome(fragment, title, description, canonical, page_name):
    page_head = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', head, count=1, flags=re.S)
    page_head = re.sub(
        r'<meta name="description"\s+content="[^"]*"\s*/?>',
        f'<meta name="description" content="{description}" />',
        page_head, count=1,
    )
    page_head = page_head.replace('href="https://ngdsolutions.com/"', f'href="https://ngdsolutions.com{canonical}"', 1)
    page_head = page_head.replace('content="https://ngdsolutions.com/"', f'content="https://ngdsolutions.com{canonical}"', 1)

    page_header = header.replace('href="#top"', 'href="/"')
    for anchor in ('services', 'pricing', 'faq', 'contact'):
        page_header = page_header.replace(f'href="#{anchor}"', f'href="/#{anchor}"')
    page_header = page_header.replace('href="/solutions/"', 'href="/solutions/"')
    page_header = page_header.replace('href="/students/"', 'href="/students/"')

    page_footer = footer
    page_footer = re.sub(r'href="#([^"]+)"', r'href="/#\1"', page_footer)
    page_content = fragment
    for anchor in ('contact', 'pricing'):
        page_content = page_content.replace(f'href="#{anchor}"', f'href="/#{anchor}"')

    body = f'''<body class="antialiased" data-page="{page_name}">
  {noise}
  {progress}
  {page_header}
  <main id="top">{page_content}</main>
  {page_footer}
  {search_modal}
  <script>
    (function () {{
      var menuBtn = document.getElementById('menuBtn');
      var menu = document.getElementById('mobileMenu');
      var openIcon = document.getElementById('menuIconOpen');
      var closeIcon = document.getElementById('menuIconClose');
      var navbar = document.getElementById('navbar');
      var progressBar = document.getElementById('progress');
      var modal = document.getElementById('cmdk');
      var input = document.getElementById('cmdkInput');
      var list = document.getElementById('cmdkList');
      var links = [
        ['Services', '/#services'], ['Solutions', '/solutions/'],
        ['Students', '/students/'], ['Pricing', '/#pricing'], ['FAQ', '/#faq']
      ];
      function closeMenu() {{
        if (!menu || !menuBtn) return;
        menu.style.maxHeight = '0px'; menu.style.opacity = '0';
        menuBtn.setAttribute('aria-expanded', 'false');
        if (openIcon) openIcon.classList.remove('hidden');
        if (closeIcon) closeIcon.classList.add('hidden');
      }}
      if (menuBtn && menu) menuBtn.addEventListener('click', function () {{
        var open = menuBtn.getAttribute('aria-expanded') === 'true';
        if (open) return closeMenu();
        menu.style.maxHeight = menu.scrollHeight + 'px'; menu.style.opacity = '1';
        menuBtn.setAttribute('aria-expanded', 'true');
        if (openIcon) openIcon.classList.add('hidden');
        if (closeIcon) closeIcon.classList.remove('hidden');
      }});
      if (menu) menu.querySelectorAll('a').forEach(function (a) {{ a.addEventListener('click', closeMenu); }});
      window.addEventListener('scroll', function () {{
        var doc = document.documentElement;
        if (navbar) navbar.classList.toggle('nav-scrolled', doc.scrollTop > 24);
        if (progressBar) {{ var max = doc.scrollHeight - doc.clientHeight; progressBar.style.width = (max > 0 ? doc.scrollTop / max * 100 : 0) + '%'; }}
      }}, {{ passive: true }});
      document.querySelectorAll('.reveal, .reveal-scale').forEach(function (el) {{
        if ('IntersectionObserver' in window) {{
          var observer = new IntersectionObserver(function (entries) {{
            entries.forEach(function (entry) {{ if (entry.isIntersecting) {{ entry.target.classList.add('in'); observer.unobserve(entry.target); }} }});
          }}, {{ threshold: 0.08 }});
          observer.observe(el);
        }} else el.classList.add('in');
      }});
      function renderResults(query) {{
        if (!list) return;
        list.replaceChildren();
        var found = links.filter(function (entry) {{ return entry[0].toLowerCase().includes(query.toLowerCase()); }});
        found.forEach(function (entry) {{
          var a = document.createElement('a'); a.href = entry[1]; a.textContent = entry[0];
          a.className = 'block rounded-xl px-4 py-3 text-sm text-white/75 hover:bg-white/10'; list.appendChild(a);
        }});
        if (!found.length) {{ var empty = document.createElement('p'); empty.className = 'px-4 py-5 text-sm text-white/50'; empty.textContent = 'No matching pages'; list.appendChild(empty); }}
      }}
      window.openCmdk = function () {{
        if (!modal) return;
        modal.classList.remove('hidden'); modal.classList.add('flex');
        renderResults(input ? input.value : ''); if (input) input.focus();
      }};
      function closeSearch() {{ if (modal) {{ modal.classList.add('hidden'); modal.classList.remove('flex'); }} }}
      if (input) input.addEventListener('input', function () {{ renderResults(input.value); }});
      if (modal) {{
        modal.addEventListener('click', function (event) {{ if (event.target === modal) closeSearch(); }});
        document.addEventListener('keydown', function (event) {{ if (event.key === 'Escape') closeSearch(); }});
      }}
      var year = document.getElementById('year'); if (year) year.textContent = new Date().getFullYear();
    }})();
  </script>
</body>'''
    return page_head + '\n' + body + '\n'


for slug, title, description, canonical in (
    ('solutions', 'Core Solutions | NGD — NextGenDev Solutions',
     'Explore NGD core solutions and the different businesses we build for.', '/solutions/'),
    ('students', 'NGD for Students | NextGenDev Solutions',
     'Talk directly with NGD about student projects, mentorship, and real work experience.', '/students/'),
):
    fragment = (ROOT / 'scripts' / f'page-{slug}.html').read_text(encoding='utf-8')
    output = ROOT / 'public' / slug / 'index.html'
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(page_chrome(fragment, title, description, canonical, slug), encoding='utf-8')
    print(f'[OK] wrote {output.relative_to(ROOT)}')
