# NGD Solutions — NextGenDev Solutions

A production-oriented rebuild of the NGD website using **Next.js 16, React 19, TypeScript and Three.js / React Three Fiber**. The public site is mobile-first and statically rendered where possible; the original Neon enquiry system and hidden admin dashboard remain available through Next.js Route Handlers.

## What is included

- Premium responsive homepage with a lightweight interactive 3D hero
- Reduced-motion, data-saver and WebGL-error fallbacks
- Clear business and student journeys with working enquiry forms
- Six dedicated, statically generated service pages
- Solutions, students, privacy, terms and custom 404 pages
- SEO: canonical metadata, Open Graph image, sitemap, robots rules and breadcrumbs
- AEO/GEO: direct answer blocks, visible FAQs, Organization/Service/FAQ schema and `llms.txt`
- Brand aliases for **NGD Solutions, NGDSolutions, NextGenDev and NextGenDevSolutions**
- Consent-gated GA4 with SPA page-view tracking and a `generate_lead` conversion event
- Existing Neon/file database, validation, spam gates, rate limits and notifications
- Existing team admin: login, lead management, status, assignment, activity and CSV export
- Playwright desktop/mobile/API/accessibility-oriented smoke tests

## Run locally

Requirements: **Node.js 20.9+**.

```bash
npm install
cp .env.example .env.local   # then remove/edit values as needed
npm run dev
```

Open <http://localhost:3000>. Without `DATABASE_URL`, enquiries use the local `.dev-data/store.json` file. That local file store is for development only; configure Neon for production.

### Useful commands

```bash
npm run typecheck    # TypeScript validation
npm run build        # optimized Next.js production build
npm run start        # serve the production build
npm run test:e2e     # Playwright desktop/mobile/API smoke tests
npm run init-db      # create/verify Neon tables after DATABASE_URL is set
```

For a new test machine, install the Playwright browser once:

```bash
npx playwright install chromium
# Linux CI may also need: npx playwright install-deps chromium
```

## Project map

```text
app/
  page.tsx                    Homepage
  solutions/                  Connected-solutions page
  students/                   Student track + student enquiry
  services/[slug]/            Six static service pages
  api/                        Next.js Route Handler entry points
  sitemap.ts / robots.ts      Search discovery
  opengraph-image.tsx         Social sharing card
components/
  hero-visual.tsx             3D loader + fallbacks
  three/hero-scene.tsx        Actual Three.js scene
  lead-form.tsx               Business/student enquiry UI
  analytics.tsx               Consent + GA4 page views
lib/
  content/                    Services, pricing, FAQs and process copy
  server/next-handler.js      Adapter for the existing API business logic
server/api/                   Original Neon/auth/lead/notification logic
public/
  ngd-control-8421/           Separate admin dashboard
  llms.txt / llms-full.txt    Concise machine-readable company guides
proxy.ts                      Hidden admin path and /admin 404 handling
```

## Edit content and contact details

- **Contact information:** `site.config.json` — blank social URLs stay hidden.
- **Services and service-page FAQs:** `lib/content/services.ts`
- **Pricing, homepage FAQs, process and use cases:** `lib/content/site-content.ts`
- **Brand aliases and public URL helper:** `lib/site.ts`
- **Canonical production origin:** `NEXT_PUBLIC_SITE_URL` in the deployment environment

Do not add placeholder social profiles, fake locations, unverified testimonials or made-up project results. Real proof is more valuable for visitors and search engines.

## Google Analytics 4

The NGD GA4 measurement ID `G-M840HRYWV6` is configured by default. Analytics loads only after a visitor selects **Allow analytics**. “Essential only” prevents the Google script from loading.

To use a different stream, set:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-NEWSTREAMID"
```

Set the variable to an empty string to disable GA and the consent banner entirely. To verify, accept analytics on the live site and check **GA4 → Reports → Realtime**. Form submissions fire `generate_lead` after a successful API response.

## SEO / AEO / GEO launch setup

The technical foundation is already implemented. After deployment:

1. Set `NEXT_PUBLIC_SITE_URL` to the **real final origin**. Do not leave `https://ngdsolutions.com` if you do not control that domain.
2. Verify the site in Google Search Console. For HTML-tag verification, set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to the tag’s `content` value and redeploy.
3. Submit `https://YOUR-DOMAIN/sitemap.xml` in Search Console.
4. Use URL Inspection on the homepage and choose **Request Indexing**. Crawling can take days or weeks.
5. Use the same public name—**NGD Solutions — NextGenDev Solutions**—on real social profiles, GitHub, directories and a Google Business Profile if eligible.
6. Add only genuine social URLs to `site.config.json`; these become Organization `sameAs` links.
7. Earn relevant mentions/links and publish real case studies when available. Aliases in metadata alone cannot create authority.

No developer can guarantee indexing, a particular ranking or an AI citation. See `DEPLOYMENT.md` for the full launch checklist and official references.

## Admin dashboard

Default path: **`/ngd-control-8421`** (`/admin` returns 404).

Set a unique `ADMIN_PATH` and at least one login in production:

```bash
ADMIN_PATH="/your-long-random-admin-path"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="use-a-long-random-password"
ADMIN_NAME="Owner"
```

For multiple users, use `TEAM_MEMBERS` as shown in `.env.example`. A secret path is not a substitute for strong credentials. Admin routes send `noindex` headers and are excluded from crawler rules.

## Deployment

The app supports current Next.js runtimes on **Netlify and Vercel**.

- **Free commercial production:** Netlify Free is the recommended starting option; the repository includes `netlify.toml`.
- **Vercel:** excellent Next.js support, but Hobby is for non-commercial personal use. Use it for previews or choose an appropriate paid plan for a commercial NGD website.
- **Free address:** use the assigned `.netlify.app` or `.vercel.app` subdomain. A real `.com` normally costs money.
- **Database:** Neon’s free tier can be used for the enquiry database within its current limits.

Follow the step-by-step guide in **[`DEPLOYMENT.md`](./DEPLOYMENT.md)**.

## Performance notes

The 3D scene is dynamically imported and uses no downloaded model, texture or HDR asset. It clamps device pixel ratio, pauses when off-screen, and is replaced by a CSS visual for reduced-motion or data-saver users. Fonts are self-hosted by `next/font`; important text and links are server-rendered and do not depend on WebGL.
