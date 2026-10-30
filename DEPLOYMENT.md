# NGD deployment, analytics and search launch guide

Use this checklist after the code is pushed to your GitHub repository. The preview in this workspace is not your public production deployment.

## 1. Recommended no-cost stack for NGD

| Need | Recommendation | Cost note |
| --- | --- | --- |
| Commercial Next.js hosting | **Netlify Free** | Free within current monthly limits; commercial projects are allowed |
| Free site address | Assigned **`.netlify.app`** subdomain | Free; choose the available project name |
| Database | **Neon Free** | Free within current storage/compute limits |
| Analytics | **Google Analytics 4** | Free |
| Search measurement | **Google Search Console** | Free |
| Custom `.com` | Registrar of your choice | Normally paid; hosting and domain are separate |

**Why not simply Vercel Hobby for the business site?** Vercel’s current fair-use rules restrict Hobby to non-commercial personal use. A site advertising NGD’s paid services is commercial. Vercel is still a strong option for previews or on an appropriate paid plan.

Official references:

- Netlify Free plan: <https://www.netlify.com/blog/introducing-netlify-free-plan/>
- Netlify Next.js support: <https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/>
- Vercel fair-use rules: <https://vercel.com/docs/limits/fair-use-guidelines>
- Vercel domains: <https://vercel.com/docs/domains/working-with-domains/add-a-domain>

## 2. Prepare environment variables

Copy `.env.example` as your checklist. At minimum, production needs:

```bash
NEXT_PUBLIC_SITE_URL="https://YOUR-REAL-DOMAIN"
DATABASE_URL="your-neon-pooled-connection-string"
ADMIN_PATH="/a-long-random-private-path"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="a-long-random-password"
ADMIN_NAME="Owner"
IP_SALT="another-long-random-string"
```

Add GA only after creating the property:

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

Optional notification variables are documented in `.env.example`. Never commit `.env.local` or real credentials.

## 3. Deploy free on Netlify

1. Push this branch/repository to GitHub.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repository. The included `netlify.toml` supplies:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Keep the current Netlify Next.js runtime enabled/auto-detected. It supports App Router, Route Handlers and middleware/proxy.
5. Add the environment variables above for production.
6. Deploy. Netlify assigns an address such as `https://your-project-name.netlify.app`.
7. Set `NEXT_PUBLIC_SITE_URL` to that exact assigned HTTPS origin and redeploy. Canonicals, sitemap, robots and structured data must not point to a domain you do not control.
8. Test `/`, `/students`, `/solutions`, one service page, `/api/health`, the enquiry form and your private admin path.

### Attach a custom domain later

In Netlify, open **Domain management → Add a domain**, then follow the DNS instructions at your registrar. Keep the Netlify subdomain as a fallback until DNS and HTTPS are working. When the custom domain is live:

1. Change `NEXT_PUBLIC_SITE_URL` to the custom origin.
2. Redirect the old host to the new canonical host where possible.
3. Redeploy and resubmit the sitemap in Search Console.

## 4. Alternative: deploy on Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: **Next.js**. Build command: `npm run build`.
3. Add the same environment variables.
4. Deploy and set `NEXT_PUBLIC_SITE_URL` to the production origin.
5. Use the free `.vercel.app` URL only where the Hobby terms permit it; use an appropriate commercial plan for the live NGD business site.

The existing `vercel.json` intentionally contains only the framework selection; Next.js owns the build output and route configuration.

## 5. Free domain reality

- **Free subdomain:** yes—`.netlify.app`, `.vercel.app`, or `.pages.dev` on suitable static hosts.
- **Free custom `.com`:** normally no. Do not trust “free domain” offers that hide renewal or transfer costs.
- **If you are an eligible student:** check current GitHub Student Developer Pack domain offers. At the time of writing, the pack lists eligible first-year domain offers through partners such as Namecheap and Name.com. Eligibility, TLDs and renewals vary: <https://education.github.com/pack?sort=popularity&tag=Domains>
- For a professional business, a paid domain is worth the small annual cost. Use the free subdomain only as a valid starting point, not as a long-term brand requirement.

Cloudflare Pages’ simple Next.js guide is for static export. This NGD project uses Route Handlers and a database-backed admin, so do not choose a static-only deployment unless you deliberately move those APIs elsewhere.

## 6. Connect Google Analytics

1. GA4 → **Admin → Data streams → Web** → create/select the stream for the final domain.
2. Copy the Measurement ID (`G-…`). Official help: <https://support.google.com/analytics/answer/9539598>
3. Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` and redeploy.
4. Open the live site, select **Allow analytics**, then check **GA4 → Realtime**.
5. Submit a test enquiry and confirm the `generate_lead` event. Do not use a real customer’s details for testing.
6. Return to **Cookie preferences** in the footer and verify that **Essential only** stops future analytics collection.

## 7. Put NGD on Google correctly

The code provides the technical foundation; indexing and rankings still require discovery, trust and time.

### Immediate checklist

1. **Use one canonical host.** Choose HTTPS + either apex or `www`, redirect duplicates, and set `NEXT_PUBLIC_SITE_URL` accordingly.
2. **Verify Search Console.** Use DNS verification, or set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` from the HTML verification tag and redeploy.
3. **Submit the sitemap:** `https://YOUR-DOMAIN/sitemap.xml`.
4. **Inspect the homepage** and request indexing. Also inspect `/solutions` and one service page if they are not discovered.
5. **Check rendered HTML.** The important content, service links and brand names are server-rendered; do not block CSS or JS resources in robots rules.
6. **Keep the brand consistent.** Use “NGD Solutions — NextGenDev Solutions” on genuine social profiles, GitHub, relevant directories and email signatures. Add real profile URLs to `site.config.json`.
7. **Build real authority.** Publish verifiable work, get client/partner mentions, collect legitimate reviews and keep service content useful.
8. **For local discovery:** create/optimize a Google Business Profile only with real eligibility, address/service-area and contact details. Do not reuse invented coordinates or a fake office address.

Google’s documentation explicitly says indexing and rankings are not guaranteed. Crawling can take a few days to a few weeks:

- SEO Starter Guide: <https://developers.google.com/search/docs/fundamentals/seo-starter-guide>
- Ask Google to recrawl: <https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl>
- Search Console guide: <https://developers.google.com/search/docs/monitor-debug/search-console-start>

### What is already optimized for the brand names

- Homepage title and description name **NGD Solutions** and **NextGenDev Solutions**.
- A visible “What is NGD Solutions?” section connects **NGD Solutions, NGDSolutions, NextGenDev and NextGenDevSolutions** naturally.
- Organization and WebSite schema include the same aliases.
- Dedicated service pages give Google distinct, useful URLs instead of duplicate alias-keyword pages.
- Sitemap, canonical URLs, breadcrumbs, social cards and crawler rules are generated by Next.js.

Do **not** create thin duplicate pages for every spelling. Google treats letter case similarly, and one strong canonical brand page is better than keyword-stuffed variations.

## 8. AEO / GEO notes

Answer and generative engine optimization here means making accurate information easy to understand—not adding fake “GEO location” metadata.

Already included:

- Concise, visible answer blocks and FAQs
- Organization, Service, WebPage, Breadcrumb and FAQ structured data
- Clear service purpose, pricing context, ownership and student-policy information
- `llms.txt` and `llms-full.txt` with canonical links and consistent facts
- Crawler permissions for several answer/AI bots while private admin/API paths remain restricted

These files do not force an AI system to cite the site. Real expertise, consistent entity information, useful original content and third-party corroboration still matter.

## 9. Post-launch acceptance test

- [ ] Homepage and every service page return 200 on mobile and desktop
- [ ] No horizontal overflow at 320, 390, 768 and 1440 CSS pixels
- [ ] 3D loads on a normal device; reduced-motion shows the static fallback
- [ ] Forms validate, save to Neon and show a reference ID
- [ ] Admin requires credentials and the public `/admin` path returns 404
- [ ] WhatsApp, phone and email links use real details
- [ ] GA remains absent before consent and appears in Realtime after consent
- [ ] `/sitemap.xml` contains the final production origin
- [ ] `/robots.txt`, canonical tags and Organization schema use the same origin
- [ ] Social sharing shows the generated 1200×630 NGD card
- [ ] Search Console has no unexpected crawl or indexation errors

Keep the first production deployment preview URL so you can roll back quickly if an environment variable or DNS change needs correction.
