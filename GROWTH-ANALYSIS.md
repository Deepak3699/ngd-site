# NGD Solutions — Free Customer Acquisition Analysis & Improvement Report

**Site analysed:** https://ngdsolutions.vercel.app (repo: `Deepak3699/ngd-site`, branch `arena/5530ce78-ngd-site`)
**Date:** 17 November 2026
**Constraint followed:** Har suggestion **non-structural** hai — layout, sections, design system, routing structure ya component structure nahi badle. Sirf content, config, metadata, API-level aur delivery behaviour ki baat hai.

---

## 1. Executive summary (seedhi baat)

Site ki **technical foundation strong hai** — statically rendered pages, sahi metadata, structured data, sitemap, breadcrumbs, WhatsApp CTA, lead form, admin panel, accessibility basics. Code quality ka kaam achha hua hai.

Lekin **customers free mein laane ke liye jo cheezein chahiye, unme 6 serious gaps hain**:

| # | Gap | Impact |
|---|---|---|
| 1 | `ngdsolutions.com` aapke paas nahi hai — wo parked GoDaddy page hai, aur OG image + purani `public/index.html` mein wahi domain likha hai | Brand confusion + galat contact info |
| 2 | `/robots.txt` par **conflict** hai (`public/robots.txt` + `app/robots.ts`) — dev mein **500 error**, prod mein platform ke hisaab se **alag-alag content** serve hota hai | Crawling unreliable |
| 3 | `llms.txt` / `llms-full.txt` mein email `hello@ngdsolutions.com` likha hai, asli email `nextgendevsolution@gmail.com` hai | AI/answer engines galat contact dete hain → direct lead loss |
| 4 | Google mein site **index nahi dikh rahi** (sirf GitHub repo mila) | Zero organic traffic |
| 5 | 3D hero **932 kB JS** (239 kB gzip) har visitor ko bhej raha hai — Indian 4G mobile par slow | Conversion drop |
| 6 | Consent-gated GA4 ka matlab: **mostly data hi nahi milega** | Aap andhere mein optimize kar rahe hain |

Content (2 blog posts) aur distribution (social links khali) bhi weak hain — yehi free acquisition ke asli engines hain.

---

## 2. Measured current state (jo maine actually naapa)

Production build chalaya (local prod server + live site dono check kiye):

| Metric | Value |
|---|---|
| Static pages build hui | 21 (sab routes 200 OK) |
| Homepage HTML | 126 kB raw / **23.5 kB gzip** |
| Homepage initial JS | **184 kB gzip** (9 files) |
| Homepage CSS | 37 kB raw |
| **3D hero chunk** | **932 kB raw / 239 kB gzip** — har visitor ko load hota hai |
| Service pages | 6, sab SSG, sab mein Service + FAQ + Breadcrumb schema |
| Blog posts | 2 (dono published) |
| `llms.txt` / `llms-full.txt` | Maujood hain, lekin email galat hai |
| Sitemap | 14 URLs, sab sahi |
| Structured data | Organization, WebSite, WebPage, ItemList, FAQPage, Service, BreadcrumbList, BlogPosting |

**SEO metadata (served HTML se verified):** title, description, canonical, robots, OG image (1200×630), twitter card — sab sahi hai.
**Missing (verified in served HTML):** `og:site_name`, `og:locale`, `og:type` — kyunki har page ka `openGraph` object layout wale ko **replace** kar deta hai.

---

## 3. Free customer acquisition — techniques (ranked by impact/effort)

Ye wo list hai jo aapke business ke liye sabse zyada kaam ki hai. Sab free hain (time chahiye, paisa nahi).

### Tier 1 — turant shuru karo (sabse zyada free leads)

**1. Google Business Profile (GBP) — #1 free channel for service business**
Aap Jalandhar, Punjab mein hain. GBP local pack mein dikhata hai aur "web developer near me" type searches se seedha call/WhatsApp laata hai.
- Service-area business banayein (ghar ka address public nahi karna padta)
- Service areas: Jalandhar, Phagwara, Ludhiana, Jalandhar district + "India (remote)"
- Categories: Website designer, Software company, Marketing agency
- Weekly Google Posts (blog links share karo) — free indexing signal bhi hai
- **Important:** purani `public/index.html` mein Delhi ke fake coordinates (`28.6139;77.2090`) hain — unhe kabhi mat use karein. GBP mein sirf asli service area daalein.

**2. Google Search Console + indexing**
Mere search mein aapki site nahi mili — sirf GitHub repo mila. Matlab site index nahi hui (ya nayi hai).
- Site verify karo (DNS method best hai)
- Sitemap submit karo
- Homepage + 6 service pages par "Request indexing" maaro
- Har naye blog post par repeat karo

**3. Content/SEO — aapka sabse bada free engine**
Aapke paas already achha content hai (cost guide, AI automation guide). Isi ko scale karo. Target keywords jo **buying intent** rakhte hain:
- "website development cost in Jalandhar / Punjab"
- "web developer near Jalandhar"
- "small business website price India"
- "AI automation for small business India"
- "final year project ideas computer science" (student track — huge search volume)
- "how to get first freelance client India"

Har post ke end mein service page ka contextual link (abhi sirf generic CTA hai) — internal links ranking laate hain.

**4. WhatsApp + community (India mein sabse cheap distribution)**
- Apne WhatsApp status par har blog post share karo
- Local business WhatsApp/Telegram groups, college groups (student track ke liye)
- LinkedIn par weekly post: "ye website kaise banaya" — build-in-public content free reach deta hai

### Tier 2 — 2-4 hafte mein

**5. Real social profiles banao** — `site.config.json` mein instagram/linkedin/x/github **khali** hain. Iska matlab:
- Organization schema ka `sameAs` khali hai → Google ko entity confirm karne ke liye koi corroboration nahi
- Koi free distribution channel nahi hai
- **Fix:** asli LinkedIn + GitHub banao (GitHub par repo already public hai — profile proper karo), phir URLs config mein daalo. Fake profiles mat banao.

**6. Directories & listings (free backlinks + entity signals)**
- Google Business Profile (above)
- Bing Places (free, Bing se leads aati hain)
- Justdial / Sulekha / IndiaMART (free listing — local leads)
- Clutch / GoodFirms / DesignRush (agency directories, free profile)
- LinkedIn company page
- Student ke liye: Internshala, Unstop par profile

**7. Answer-engine / AI visibility (aap already achha base rakhte ho)**
`llms.txt`, `llms-full.txt`, FAQ schema, direct answer blocks — ye sab already hai. Isse achha:
- Blog posts ko Q&A format mein likho (AI engines quote karte hain)
- Har service page ke "answer" block ko 40-60 words mein rakho (already achha hai)
- Consistent NAP (name/address/phone) har jagah — abhi email mismatch hai (P1 bug #3)

**8. Student track = free marketing engine**
Students aapka sabse bada word-of-mouth channel ho sakte hain:
- Har mentored student ko apni college/LinkedIn par "NGD ne help ki" bolne ko kaho
- Free webinar/workshop (Google Meet, free) — "Final year project kaise choose karein"
- Workshop recording ko blog post banao

### Tier 3 — ongoing

**9. Email/WhatsApp list** — blog par subscribe box (free, e.g. Formspree free tier ya apna hi API use karo). Repeat visitors = free customers.
**10. Reviews** — GBP par 5-10 genuine reviews lo. Local ranking mein reviews #1 factor hai.
**11. Partnerships** — local printers, CA, photographers, coaching institutes — unke clients ko website chahiye hoti hai, referral exchange karo (free).

---

## 4. Issues found (evidence ke saath)

### P0 — Turant theek karo

**P0-1. `/robots.txt` conflict — crawlers ko unreliable response**
`public/robots.txt` (757 B) aur `app/robots.ts` dono `/robots.txt` serve karne ki koshish kar rahe hain.
- **Local dev:** `/robots.txt` → **HTTP 500** ("A conflicting public file and page file was found")
- **Local production build:** **static file jeeti hai** — `Sitemap: https://ngdsolutions.vercel.app/sitemap.xml` hardcoded, aur `/ngd-control-8421/` block **nahi** hota
- **Live Vercel:** **dynamic route jeeti hai** — alag content (Host directive + `/ngd-control-8421/` block ke saath)

Matlab same URL, teen alag environments, teen alag answers. Google 5xx robots.txt ko "temporarily disallow all" maanta hai → crawling ruk sakti hai.

**P0-2. `ngdsolutions.com` aapka nahi hai**
Live check kiya: wo ek **parked GoDaddy "Launching Soon" page** hai (© 2025, kisi doosri "NGD Solutions" ka). Isse:
- `app/opengraph-image.tsx` mein bottom-right text `ngdsolutions.com` likha hai → har social share par aap ek aisa domain dikha rahe ho jo aapka nahi hai
- Purani `public/index.html` (318 kB, dead file) mein `canonical: https://ngdsolutions.com/` hai → agar ye file kabhi serve hui toh canonical aapke domain se bahar chala jayega (SEO disaster)
- Aur: **"NextGenDev Solutions Private Limited" ek alag Bangalore company hai** (CIN U72900KA2021PTC147720). Matlab aap "NextGenDev Solutions" naam par rank karke unse compete kar rahe ho — mushkil aur risky. Pehle distinctive brand + location par focus karo.

**P0-3. Galat contact info `llms.txt` / `llms-full.txt` mein**
- `llms.txt` + `llms-full.txt`: `hello@ngdsolutions.com` ❌
- `site.config.json` (asli, site par dikh raha): `nextgendevsolution@gmail.com` ✅

Jab koi ChatGPT/Perplexity se poochega "how to contact NGD Solutions", AI in files se `hello@ngdsolutions.com` dega — jo kaam nahi karta. **Direct lead loss.** (AI crawlers aapki site allow ki hui hain, toh ye file definitely padhi jaa rahi hai.)

### P1 — Is hafte

**P1-1. 3D hero: 932 kB JS har visitor ke liye**
Homepage ke baad hi client-side chunk load hota hai (three.js + react-three-fiber). Indian mobile/4G par:
- 239 kB gzip extra download
- GPU + battery drain
- LCP/TBT kharab

Achhi baat: fallback already bana hua hai (reduced-motion, save-data, WebGL error). Toh mobile users ke liye usse switch karna **zero visual risk** hai.

**P1-2. Google Fonts build-time dependency**
`next/font/google` build ke waqt `fonts.googleapis.com` se fetch karta hai. Is sandbox mein build **fail** hua tha (network restricted). Netlify/Vercel par chalta hai, lekin:
- Google Fonts down/blocked = build fail = deploy ruk jaata hai
- Build-time external dependency = fragile

**P1-3. OG tags incomplete har page par**
Layout mein `siteName`, `locale`, `type` set hain, lekin har page ka `openGraph` object inhe replace kar deta hai. Served HTML mein sirf `og:title`, `og:description`, `og:url`, `og:image` hain — `og:site_name`, `og:locale`, `og:type` **missing**. LinkedIn/WhatsApp par share par site name nahi dikhta.

**P1-4. Blog posts ka OG image nahi hai**
Dono posts ka `coverImage` khali hai → WhatsApp/LinkedIn share par **koi image nahi**. India mein WhatsApp sharing sabse bada channel hai — image ke bina CTR bahut gir jaata hai.

**P1-5. Consent-gated GA4 = measurement blind spot**
Zyankar visitors "Essential only" dabate hain → aapko unka data milta hi nahi. Aap andhe ho.

**P1-6. Dead file `public/index.html` (318 kB)**
Kabhi serve nahi hoti (App Router page jeet ta hai — verified), lekin:
- Repo bloated, purani copy ("premier digital engineering agency"), `@ngdsolutions` handle, fake Delhi coordinates
- Future route change par accidentally serve ho sakti hai → canonical/duplicate content issue

### P2 — Is month

**P2-1. Lead submit hone ke baad koi auto-reply nahi jaata**
Form submit → lead ko kuch nahi milta jab tak aap manually reply na karo. Instant auto-reply (email ya WhatsApp) conversion aur trust dono badhata hai. Aapke paas already Resend/CallMeBot infra maujood hai — bas lead ko bhi ek message bhejo.

**P2-2. No RSS feed** — blog syndication ke liye. Ek chhota route handler ka kaam hai.

**P2-3. `lastmod` sitemap mein build timestamp hai** — har deploy par badal jaata hai bina content change. Real content dates behtar hain.

**P2-4. Blog → service pages ke contextual internal links nahi** (sirf generic CTA). Internal links free ranking signal hain.

**P2-5. Lead form mein "How did you hear about us?" field nahi** — free attribution ke liye. (Ye ek naya field hai, isliye optional — aapki "no structural change" condition ke hisaab se maine ise P2 rakha.)

**P2-6. Live site Vercel Hobby par hai** — aapka hi `DEPLOYMENT.md` kehta hai Hobby non-commercial ke liye hai. Commercial business site ke liye Netlify Free better hai (aapki doc mein already likha hai).

**P2-7. robots.txt secret admin path advertise karta hai**
Live robots.txt mein `Disallow: /ngd-control-8421/` hai — yeh path publicly batata hai. `X-Robots-Tag: noindex` already lagta hai, toh obscurity ki zaroorat nahi; behtar hai env-driven ho.

---

## 5. Non-structural improvements — exact changes

Neeche har fix ke liye exact file + change diya hai. **Koi bhi layout/section/component structure nahi badalti.**

### Fix 1 (P0-1): robots.txt conflict hatao — dynamic route rakho, static file delete

Dynamic route env-aware hai (`NEXT_PUBLIC_SITE_URL` + `ADMIN_PATH`), isliye wahi rakhna chahiye:

```bash
git rm public/robots.txt
```

Isse dev ka 500 error jaayega, aur teeno environments ek jaisa behaviour dikhayenge.

*(Aur agar aap static file rakhna chahte ho, toh `app/robots.ts` delete karo — lekin phir sitemap URL aur admin block hardcoded reh jaayega, toh dynamic recommend karta hoon.)*

### Fix 2 (P0-2a): OG image se unowned domain hatao

`app/opengraph-image.tsx`, last line:

```diff
-<span>ngdsolutions.com</span>
+<span>ngdsolutions.vercel.app</span>
```

### Fix 3 (P0-2b): dead static site file hatao

```bash
git rm public/index.html
```

### Fix 4 (P0-3): llms.txt mein asli email

`public/llms.txt` aur `public/llms-full.txt`, dono mein:

```diff
-- Email: hello@ngdsolutions.com
+- Email: nextgendevsolution@gmail.com
```

### Fix 5 (P1-1): 3D sirf capable devices par

`components/hero-visual.tsx` mein condition tight karo — **visual desktop par identical rahega**, mobile par already-bana CSS fallback aayega:

```diff
-      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
-      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
-      setAllow3D(!reduced && !connection?.saveData);
+      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
+      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
+      const desktop = window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches;
+      setAllow3D(!reduced && !connection?.saveData && desktop);
```

### Fix 6 (P1-2): fonts self-host karo (build fragility + privacy)

```bash
mkdir -p public/fonts
# Inter variable + Instrument Serif regular/italic woff2 yaha daalo
```

Phir `app/layout.tsx`:

```diff
-import { Inter, Instrument_Serif } from 'next/font/google';
+import { Inter, Instrument_Serif } from 'next/font/local';
+
+const inter = Inter({ variable: '--font-sans', display: 'swap', src: [{ path: '../public/fonts/Inter.woff2', weight: '100 900', style: 'normal' }] });
+const instrumentSerif = Instrument_Serif({ variable: '--font-serif', display: 'swap', weight: '400', style: ['normal', 'italic'], src: [{ path: '../public/fonts/InstrumentSerif-Regular.woff2', weight: '400', style: 'normal' }, { path: '../public/fonts/InstrumentSerif-Italic.woff2', weight: '400', style: 'italic' }] });
```

Output bilkul same dikhega, lekin build kabhi Google Fonts ki availability par depend nahi karega.

### Fix 7 (P1-3): har page ke openGraph mein siteName/locale/type

Har page ke `metadata` object mein (home, solutions, students, blog, blog/[slug], 6 service pages):

```diff
   openGraph: {
+    type: 'website',
+    siteName: 'NGD Solutions — NextGenDev Solutions',
+    locale: 'en_IN',
     title: '...',
```

(Service pages ke liye `type: 'website'`; blog index ke liye bhi `'website'`; blog post ke liye already `'article'` hai.)

### Fix 8 (P1-4): blog posts ko default OG image do

`app/blog/[slug]/page.tsx` ke `generateMetadata` mein:

```diff
-    images: post.coverImage ? [{ url: post.coverImage }] : undefined,
+    images: [post.coverImage || '/opengraph-image'],
```

### Fix 9 (P1-5): consent-free measurement (cookieless, server-side)

`app/api/metrics/route.js` (naya) — cookie nahi, consent nahi chahiye:

```js
export async function POST(request) {
  const { path } = await request.json().catch(() => ({}));
  if (!path || typeof path !== 'string' || path.length > 200) return new Response('ok');
  // TODO: yaha apne store (Neon/file) mein { path, day, count } increment karo
  return new Response('ok');
}
```

Aur ek chhota client component jo `page_view` bheje (GA ke bina, consent ke bina). Counts admin dashboard mein dikhao. Isse aapko hamesha data milega — consent chahe na de.

### Fix 10 (P2-2): RSS feed (free syndication)

`app/rss.xml/route.js` (naya):

```js
import { getPublishedPosts } from '@/lib/content/blog';
import { absoluteUrl } from '@/lib/site';

export async function GET() {
  const posts = getPublishedPosts();
  const items = posts.map((p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${absoluteUrl(`/blog/${p.slug}`)}</link>
      <guid>${absoluteUrl(`/blog/${p.slug}`)}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>NGD Solutions Blog</title>
<link>${absoluteUrl('/blog')}</link>
<description>Practical technology guides from NGD Solutions</description>
${items}
</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}
```

Phir `/blog` page mein `<link rel="alternate" type="application/rss+xml" href="/rss.xml" />` add karo.

### Fix 11 (P2-1): lead auto-reply

`api/leads.js` (ya `server/api/leads.js`) mein `notifyNewLead(lead)` ke saath hi ek auto-reply bhejo:

```js
// lead ke email/phone par instant confirmation
await sendResend('Thanks — we received your enquiry', `Hi ${lead.name}, ...`);
```

Same Resend/CallMeBot infra use karo — naya cost nahi.

### Fix 12 (P2-7): robots.txt mein admin path advertise na ho

`app/robots.ts`:

```diff
-const privatePaths = ['/admin', '/admin/', '/api/', '/ngd-control-8421/'];
+const adminPath = process.env.ADMIN_PATH || '';
+const privatePaths = ['/admin', '/admin/', '/api/', ...(adminPath && adminPath !== '/ngd-control-8421' ? [adminPath] : [])];
```

### Fix 13 (P2-3): sitemap lastmod ko real banao

`app/sitemap.ts` — static pages ke liye `new Date()` (build time) ki jagah ek fixed content date, ya file mtime use karo.

---

## 6. 30-day action plan

| Din | Kaam | Cost |
|---|---|---|
| 1 | Fix 1–4 (robots conflict, OG image text, dead file, llms email) — 30 min | ₹0 |
| 1 | Google Search Console verify + sitemap submit + request indexing | ₹0 |
| 2 | Google Business Profile banao (service-area: Jalandhar + remote) | ₹0 |
| 2 | LinkedIn + GitHub real profiles banao → `site.config.json` mein daalo | ₹0 |
| 3 | Fix 5–8 (3D gating, fonts self-host, OG tags, blog OG image) | ₹0 |
| 4 | Bing Places + 3 free directories (Justdial/Sulekha/IndiaMART) | ₹0 |
| 5-7 | Blog post #3 likho: "Website development cost in Jalandhar / Punjab" | ₹0 |
| 8-14 | Blog post #4-5: AI automation + final-year project guide (student traffic) | ₹0 |
| 10 | Fix 9–11 (metrics API, RSS, auto-reply) | ₹0 |
| 15 | Pehle 5 clients/students se genuine GBP review maango | ₹0 |
| 20 | Free webinar/workshop (Google Meet) college students ke liye | ₹0 |
| 25 | Netlify Free par move karo (commercial ToS safe) | ₹0 |
| 30 | Search Console data dekho: impressions/clicks, phir next month ke keywords decide karo | ₹0 |

---

## 7. Measurement (sirf free tools)

| Tool | Kya batayega |
|---|---|
| Google Search Console | Impressions, clicks, ranking keywords, index status — **sabse important** |
| Google Business Profile insights | Local searches, calls, direction requests |
| GA4 (consent-gated) | Un logon ka behaviour jo allow karte hain |
| Fix 9 ka server-side counter | **Sabke** page views + lead events (consent ke bina) |
| PageSpeed Insights | Mobile performance (3D fix ke baad score compare karo) |

**Reality check:** indexing ko din hafte lagte hain, ranking ko 2-6 mahine. Koi bhi "guarantee #1 ranking" wala promise jhootha hai. Lekin GBP + Search Console + consistent content = 90 din mein measurable free leads.

---

## 8. Bottom line

- **Code/technical:** 8.5/10 — achha kaam hua hai
- **Free acquisition readiness:** 4/10 — kyunki indexed nahi hai, distribution khali hai, aur contact info AI engines ko galat ja rahi hai

P0 fixes (30 min ka kaam) + GBP + Search Console + hafte mein 1 blog post = teen mahine mein steady free inquiry flow. Sab kuch ₹0 mein.

*Note: maine code change nahi kiya, sirf analysis + suggestions diye hain (aapne "suggest karo" kaha tha). Bolen toh P0 ke 4 fixes abhi apply kar deta hoon.*
