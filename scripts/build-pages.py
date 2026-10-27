#!/usr/bin/env python3
"""Split the generated NGD homepage into concise, linked pages."""
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import quote, urlencode

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'


class MainSections(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.lines = [0]
        self.lines.extend(i + 1 for i, ch in enumerate(source) if ch == '\n')
        self.in_main = False
        self.section_depth = 0
        self.sections = []

    def source_offset(self):
        line, col = self.getpos()
        return self.lines[line - 1] + col

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'main' and attrs.get('id') == 'top':
            self.in_main = True
        if self.in_main and tag == 'section':
            if self.section_depth == 0:
                self.sections.append({'id': attrs.get('id'), 'start': self.source_offset(), 'end': None})
            self.section_depth += 1

    def handle_endtag(self, tag):
        if self.in_main and tag == 'section' and self.section_depth:
            self.section_depth -= 1
            if self.section_depth == 0:
                self.sections[-1]['end'] = self.source_offset() + len('</section>')
        elif self.in_main and tag == 'main' and self.section_depth == 0:
            self.in_main = False


def rewrite_links(source):
    destinations = {
        'top': '/', 'services': '/services/', 'difference': '/services/',
        'solutions': '/services/', 'work': '/work/', 'students': '/students/',
        'process': '/about/', 'faq': '/about/', 'pricing': '/contact/',
        'contact': '/contact/', 'book-call': '/contact/',
    }

    def rewrite_markup(markup):
        def anchor(match):
            tag = match.group(0)
            href = re.search(r'\bhref=([' + '"' + "'])(#[^\"']+)\\1", tag, re.I)
            if not href:
                return tag
            fragment = href.group(2)[1:]
            path = destinations.get(fragment)
            if not path:
                return tag
            preset = re.search(r'\bdata-preset=([' + '"' + "'])(student|client)\\1", tag, re.I)
            query = ''
            if preset:
                params = [('type', preset.group(2).lower())]
                for attr, key in (('data-preset-need', 'need'), ('data-preset-plan', 'plan')):
                    value = re.search(r'\b' + attr + r'=([' + '"' + "'])(.*?)\\1", tag, re.I | re.S)
                    if value:
                        params.append((key, value.group(2)))
                query = '?' + urlencode(params, quote_via=quote)
            replacement = path + query + ('#' + fragment if fragment != 'top' else '')
            return tag[:href.start(2)] + replacement + tag[href.end(2):]
        return re.sub(r'<a\b[^>]*>', anchor, markup, flags=re.I | re.S)

    # Leave JavaScript strings alone while rewriting actual link markup.
    pieces = re.split(r'(<script\b.*?</script\s*>)', source, flags=re.I | re.S)
    return ''.join(piece if i % 2 else rewrite_markup(piece) for i, piece in enumerate(pieces))


def update_meta(page, title, description, canonical):
    page = re.sub(r'<title>.*?</title>', '<title>' + title + '</title>', page, count=1, flags=re.S)
    page = re.sub(r'(<meta name="description"\s+content=").*?("\s*/?>)',
                  r'\g<1>' + description + r'\g<2>', page, count=1, flags=re.S)
    page = re.sub(r'(<link rel="canonical" href=").*?("\s*/?>)',
                  r'\g<1>' + canonical + r'\g<2>', page, count=1)
    page = re.sub(r'(<meta property="og:url" content=").*?("\s*/?>)',
                  r'\g<1>' + canonical + r'\g<2>', page, count=1)
    page = page.replace('</head>', '  <meta property="og:title" content="' + title + '" />\n</head>', 1)
    return page


source = (PUBLIC / 'index.html').read_text(encoding='utf-8')
parser = MainSections(source)
parser.feed(source)
sections = parser.sections
if len(sections) < 14 or any(item['end'] is None for item in sections):
    raise SystemExit('Could not identify the homepage sections; page generation stopped.')

def section_html(item):
    return source[item['start']:item['end']]

by_id = {item['id']: item for item in sections if item['id']}

pages = {
    'services': {
        'title': 'Services | NGD — NextGenDev Solutions',
        'description': 'Explore NGD services: brand design, websites, software, mobile apps and practical automation.',
        'sections': [by_id['services'], by_id['difference'], by_id['solutions']],
        'heading': 'Services', 'kicker': 'What we do',
        'intro': 'Design, development and automation for teams ready to move forward.',
    },
    'work': {
        'title': 'Selected work | NGD — NextGenDev Solutions',
        'description': 'A look at selected NGD projects, outcomes and the way we work with clients.',
        'sections': [by_id['work'], sections[6], sections[9]],
        'heading': 'Selected work', 'kicker': 'A few things we have made',
        'intro': 'Different teams, different challenges. Here is how the work takes shape.',
    },
    'students': {
        'title': 'Student program | NGD — NextGenDev Solutions',
        'description': 'Practical project guidance, mentorship and internship support for students.',
        'sections': [by_id['students']],
        'heading': 'For students', 'kicker': 'Learn by building',
        'intro': 'One-to-one guidance for meaningful projects, portfolios and next steps.',
    },
    'about': {
        'title': 'About NGD | How we work',
        'description': 'Meet the NGD approach: clear project plans, thoughtful design and hands-on delivery.',
        'sections': [by_id['difference'], by_id['process'], sections[9], by_id['faq']],
        'heading': 'A clear way to make progress', 'kicker': 'About NGD',
        'intro': 'Small, focused steps from the first conversation to launch and beyond.',
    },
    'contact': {
        'title': 'Start a project | Contact NGD',
        'description': 'Tell NGD what you are planning. We will follow up with a clear next step.',
        'sections': [by_id['pricing'], by_id['contact'], by_id['book-call']],
        'heading': 'Tell us what you are planning', 'kicker': 'Start a conversation',
        'intro': 'Share a little context and we will get back to you with a useful next step.',
    },
}

main_match = re.search(r'(<main\s+id="top"\s*>)(.*?)(</main>)', source, re.I | re.S)
if not main_match:
    raise SystemExit('Could not find the page content container.')

home_links = '''
    <section class="home-paths" aria-label="Explore NGD">
      <a class="home-path" href="/services/"><span>01</span><strong>What we do</strong><em>Services and capabilities ↗</em></a>
      <a class="home-path" href="/work/"><span>02</span><strong>Selected work</strong><em>Projects and outcomes ↗</em></a>
      <a class="home-path" href="/students/"><span>03</span><strong>For students</strong><em>Mentorship and projects ↗</em></a>
      <a class="home-path" href="/about/"><span>04</span><strong>How we work</strong><em>Our approach and answers ↗</em></a>
    </section>'''
home_content = ''.join(section_html(s) for s in sections[:2]) + home_links
home = source[:main_match.start(2)] + home_content + source[main_match.end(2):]
home = rewrite_links(home)
(PUBLIC / 'index.html').write_text(home, encoding='utf-8')

for slug, item in pages.items():
    intro = ('<section class="page-intro"><div class="page-intro-inner">'
             '<p class="page-kicker">' + item['kicker'] + '</p>'
             '<h1>' + item['heading'] + '</h1><p class="page-summary">' + item['intro'] + '</p>'
             '</div></section>')
    content = intro + ''.join(section_html(s) for s in item['sections'])
    page = source[:main_match.start(2)] + content + source[main_match.end(2):]
    page = rewrite_links(page)
    canonical = 'https://ngdsolutions.com/' + slug + '/'
    page = update_meta(page, item['title'], item['description'], canonical)
    directory = PUBLIC / slug
    directory.mkdir(parents=True, exist_ok=True)
    (directory / 'index.html').write_text(page, encoding='utf-8')

# Keep the public sitemap in sync with the pages generated above.
sitemap = PUBLIC / 'sitemap.xml'
if sitemap.exists():
    xml = sitemap.read_text(encoding='utf-8')
    for slug in pages:
        url = 'https://ngdsolutions.com/' + slug + '/'
        if url not in xml:
            xml = xml.replace('</urlset>', '  <url><loc>' + url + '</loc></url>\n</urlset>')
    sitemap.write_text(xml, encoding='utf-8')

print('Generated 5 focused pages plus a compact homepage.')
