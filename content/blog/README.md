# NGD Solutions blog publishing

Blog posts are Markdown files stored in this folder. No paid CMS or database is required.

## Publish a post

1. Copy `_template.md` and rename it to a lowercase, hyphen-separated slug, for example `ai-automation-for-small-business.md`.
2. Complete the frontmatter fields.
3. Write the article using Markdown headings (`##`, `###`), paragraphs, lists, blockquotes, bold text and links.
4. Keep `status: draft` while the article is being reviewed.
5. Change it to `status: published` only after fact-checking, proofreading, keyword review and approval.
6. Commit and push. Published posts automatically appear on `/blog`, get an individual URL and are included in the generated sitemap.

## Editorial requirements

- Write for a real reader and answer the search intent directly.
- Use original explanations, examples and practical steps. Do not paraphrase competitors or generate thin, repetitive articles.
- Verify statistics, product features, pricing and time-sensitive claims against reliable primary sources.
- Add sources as normal Markdown links near the claims they support.
- Use a concise, descriptive title and a unique meta description.
- Use a specific, human-readable slug. Do not change a published slug without adding a redirect.
- Add a relevant CTA only when it genuinely fits the article.
- Never mark an unfinished or unreviewed draft as published.

## Frontmatter fields

- `title`: article title
- `description`: search-result summary
- `date`: original publication date in YYYY-MM-DD
- `updatedAt`: optional last substantial update date
- `category`: one primary category
- `tags`: JSON-style list of topic tags
- `author`: author or editorial team
- `status`: `draft` or `published`
- `coverImage`: optional path under `/public`, e.g. `/img/blog/example.webp`

Only posts with `status: published` and complete required fields are exposed publicly.
