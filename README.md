# NGD — NextGenDev Solutions

Website + Neon-backed enquiry system + a **separate, hidden admin dashboard** where student
enquiries and business/"other" enquiries are kept apart, your team works together, and every
new response can ping you on WhatsApp or email.

```
ngd-site/
├── site.config.json        ← EDIT ME: email, phone, WhatsApp number, hours, socials, alerts
├── public/                 ← everything that gets deployed
│   ├── index.html          ← the homepage (generated from scripts/, single self-contained file)
│   ├── robots.txt          ← keeps crawlers away from the dashboard
│   ├── assets/favicon.svg
│   └── admin/              ← the dashboard (own CSS/JS, no framework)
├── api/                    ← serverless functions (Vercel auto-detects these)
│   ├── _config.js          ← reads site.config.json + env overrides
│   ├── _db.js              ← Neon (or local file) data layer + worklog events
│   ├── _http.js            ← request/response + validation helpers
│   ├── _auth.js            ← team logins (TEAM_MEMBERS) + sessions
│   ├── _notify.js          ← WhatsApp / e-mail / webhook alerts on a new enquiry
│   ├── leads.js            ← POST /api/leads          (public: every form on the site)
│   ├── health.js           ← GET  /api/health
│   └── admin/
│       ├── session.js      ← GET  /api/admin/session  (who am I, what's live)
│       ├── login.js        ← POST /api/admin/login
│       ├── logout.js       ← POST /api/admin/logout
│       ├── leads.js        ← GET / PATCH / DELETE /api/admin/leads
│       ├── stats.js        ← GET  /api/admin/stats?days=14
│       ├── activity.js     ← GET  /api/admin/activity (team worklog)
│       └── export.js       ← GET  /api/admin/export (CSV)
├── middleware.js           ← Vercel Edge: hides the dashboard behind ADMIN_PATH
├── db/schema.sql           ← the tables (created automatically too)
├── scripts/                ← build + db helpers, original markup parts
├── server.js               ← local dev server (Vercel not needed locally)
├── vercel.json
└── .env.example
```

---

## 1. Run it locally (30 seconds)

```bash
cd ngd-site
npm install
npm run dev
```

With admin credentials set in `.env.local`, the banner prints:

```
  NGD site   →  http://localhost:3000
  Admin      →  http://localhost:3000/ngd-control-8241   (secret path — /admin returns 404)
  Login      →  ON
  Alerts     →  none configured
```

So locally: **site** → <http://localhost:3000> · **dashboard** → <http://localhost:3000/ngd-control-8241/>
· **health** → <http://localhost:3000/api/health>

Use the username and password configured in `.env.local`. If you have not configured credentials,
the admin page stays locked and shows how to enable sign-in. Vercel uses its own environment variables.

Without a `DATABASE_URL` everything still works: submissions land in `.dev-data/store.json` so
you can test the whole flow (form → dashboard → CSV export). The dashboard shows a banner telling
you it is on the local store.

---

## 2. Your contact details & the WhatsApp button

Open **`site.config.json`** — it is the single source of truth for every contact detail on the
site *and* the dashboard. Currently placeholders:

```json
{
  "email": "hello@ngdsolutions.com",
  "phone": "+91 99999 99999",
  "whatsapp": "919999999999",              // digits only, wa.me format → your real number
  "whatsappDisplay": "+91 99999 99999",    // how it is shown to visitors
  "whatsappMessage": "Hi NGD! I came from your website…",
  "hours": "Mon–Fri, 9am–6pm IST",
  "location": "Remote-first, worldwide",
  "instagram": "…", "linkedin": "…", "x": "…", "github": "",
  "notifications": { "whatsappTo": "919999999999", "emailTo": "hello@ngdsolutions.com" }
}
```

Change a value → run `npm run build` → the whole site updates. What it drives:

| Where | What appears |
| --- | --- |
| Hero | premium **WhatsApp orb** — logo only, glowing, prefilled message |
| Everywhere | floating WhatsApp orb (logo only, with a live "we're around" dot), bottom-right |
| `#contact` sidebar | "What happens next" steps + a *Now booking* slot card |
| Form success card | e-mail button + WhatsApp button |
| Footer | WhatsApp / phone / e-mail / hours / location rows, social icons |
| Dashboard | 💬 reply button on every row, `tel:`/`mailto:` links, copy-email |

**Leave a value as `""` and that element hides itself** (that is why there is no GitHub icon —
put your URL in and it comes back). Env variables `SITE_EMAIL`, `SITE_PHONE`, `SITE_WHATSAPP`,
`SITE_WHATSAPP_DISPLAY` override the file if you ever want per-environment values.

---

## 3. Get alerted when a new enquiry arrives

All optional, all independent — switch on as many as you like. The dashboard's
**"New-enquiry alerts"** panel always shows which channels are live.

| Channel | Env variables | Notes |
| --- | --- | --- |
| 📧 Email | `RESEND_API_KEY`, `NOTIFY_FROM`, `NOTIFY_EMAIL` | Free tier 100/day · `NOTIFY_FROM` must be a verified sender |
| 💬 WhatsApp (official) | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `ALERT_WHATSAPP_TO` | Meta Cloud API, needs a business number |
| 💬 WhatsApp (free) | `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` | 2-minute setup at callmebot.com — easiest option |
| 🔔 Webhook | `NOTIFY_WEBHOOK` | Slack / Discord / Zapier / Make / n8n |

Alert text looks like:

```
🎓 New STUDENT enquiry — NGD-QNZ0TA936
Name: Simran Kaur · Email: s@example.com · Phone: +91 90000 00000
GNDU Amritsar · BCA · 2nd year · Final year project
"Need help with my final year project in React."
Reply: https://ngdsolutions.com/#contact
```

Alerts **never block the visitor**: if a channel is down the response is still saved, and the
failure is only logged. With nothing configured the site works exactly as before, silently.

---

## 4. Deploy on Vercel

1. Push this folder to GitHub (or run `npx vercel` from inside it).
2. On Vercel: **Add New → Project → import the repo**.
3. Settings:
   * **Root Directory** → `ngd-site` (only if the repo has the folder nested; otherwise leave it)
   * **Framework Preset** → *Other*
   * **Build command** → leave empty · **Output directory** → `public` (already in `vercel.json`)
4. **Environment Variables** (Production + Preview):

| Name | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon pooled connection string |
| `ADMIN_PATH` | recommended | Moves the dashboard to a secret URL (**see below**) |
| `TEAM_MEMBERS` | recommended | One login per team member (JSON, see below) |
| `ADMIN_PASSWORD` (+ `ADMIN_USERNAME`, `ADMIN_NAME`) | alternative | Single-owner login |
| `IP_SALT` | recommended | Any random string, used to hash IPs |
| alert channel vars | optional | Section 3 |

5. Deploy. `api/*.js` become serverless functions automatically and `middleware.js` runs on the
   Edge — no build step needed.

### Hiding the dashboard

```
ADMIN_PATH="/ngd-control-8241"      # ← invent your own long, unguessable path
```

* `/admin`, `/admin/` and `/admin/anything` now return a plain **404** to the whole world.
* Your dashboard lives at `https://your-site.vercel.app/ngd-control-8241/` — **share only that
  link with your team**. Nothing on the public site links to it any more (the old footer
  "Admin" link is gone, and `robots.txt` + `X-Robots-Tag: noindex` keep crawlers out).
* The path is normalised for you: a bare `/ngd-control-8241` redirects to the trailing-slash
  version, so the dashboard's relative CSS/JS always load.
* `server.js` implements exactly the same rules locally, so what you test is what ships.
* Forget the path? It is in your Vercel env and in the local banner.

### Team logins

`TEAM_MEMBERS` is a JSON array — every person gets their own username and password:

```
TEAM_MEMBERS='[
  {"username":"aman","password":"…","name":"Aman","role":"admin"},
  {"username":"simran","password":"…","name":"Simran","role":"member"}
]'
```

| Role | Can do |
| --- | --- |
| `admin` | everything, including **delete** and CSV export |
| `member` | see every response, change status, assign, write private notes — no deletes |

You can also assign "me" and filter by owner, so you always know who is handling what.
Sessions last 7 days, logins are rate-limited (8 tries / 5 min), and each change is written to
the worklog with the person's name.

**Admin access stays locked until you set `TEAM_MEMBERS` or `ADMIN_PASSWORD`.** The sign-in page
explains what is missing, and the API rejects access until credentials are configured. Keep one
of these settings in every environment where you need to use the dashboard.

---

## 5. The dashboard

* **Black & white themes** — the ⇄ button in the topbar switches between dark (default) and a
  light "paper" theme; the choice is remembered per browser. Everything, including the login
  screen and charts, is restyled.
* **Tabs** filter instantly: **Everyone · 🎓 Students · 🏢 Business / Other**. Both tracks live in
  one table but are never mixed in the UI.
* **Stat cards** double as filters (new · today · students · business · in progress · won ·
  assigned to me · unassigned), plus a 14-day chart, "what people ask for" and alert status.
* **Team activity** panel — who did what, newest first: created, status changed, assigned,
  note updated, deleted — with names and relative times.
* Detail drawer: full contact block (student or business fields), the message, status, owner,
  private note, one-click **WhatsApp reply / e-mail / call / copy-address**, reply templates
  ("Thanks for reaching out!", "Can we jump on a quick call?", …), and that response's own
  activity timeline.
* Bulk actions: assign to me · mark contacted / won / archived · delete (admins).
* Search across every field, status/source/owner filters, sorting, pagination, auto-refresh
  (30 s) with a toast when something new arrives, CSV export that respects filters.

**Statuses:** `new → contacted → won / lost / archived`.

---

## 6. How the two tracks are kept separate

The homepage has one enquiry form with a **Student / Business · Other** switch at the top. The
form itself changes with the answer, and so does what gets stored:

| | Student track | Business / Other track |
| --- | --- | --- |
| Fields asked | college, course, year of study, student need | company, role, website, need, budget, timeline |
| Needs list | Portfolio Website · Final-Year Project · Mentorship · Internship Track | Brand & Design · Website · Web App · Mobile App · Marketing · SEO & Content · AI & Automation |
| Stored as | `category = 'student'` + typed columns | `category = 'client'` + business columns |
| Dashboard | 🎓 tab | 🏢 tab |

Every CTA on the site deep-links into the right state, e.g. the pricing cards, "Apply to the
student track", the student package cards and "Request the case study deck" all pre-select the
category (and the need) and scroll you to the form. You can also link directly:
`?type=student` / `?type=client`.

The footer quick form (email only) sends `sourceSection: "footer-quick"` and carries a
student/business select, so it is separated too.

### Spam protection built in
Honeypot field, sub-1.2 s submission detection, per-IP rate limiting (8/min on the form,
8/5 min on admin login), duplicate suppression (same email + category inside 45 s returns the
original reference ID instead of creating a second row), field validation on both the client and
the server, and every rendered value is HTML-escaped in the dashboard.

---

## 7. Editing the homepage

`public/index.html` is **generated** — edit a part, then run the build:

```bash
npm run build
# = python3 scripts/build-homepage.py && npm run css && node scripts/inline-tailwind.mjs
```

The builder stitches `scripts/original-part1..3.html` (your original markup, kept intact) with:

* `scripts/_new-css.txt` — extra component styles (incl. the WhatsApp floating button)
* `scripts/_new-pricing-contact.html` — `#pricing` + `#contact` (the enquiry form)
* `scripts/_new-final-cta.html` — the closing CTA with the quick email form
* `scripts/_new-lead-js.txt` — the enquiry front-end + the contact-config filler
* `site.config.json` — injected as `window.NGD_CONFIG` and baked into the static markup

It also adds the doctype (the original file had none → it was rendering in quirks mode),
SEO/OG/JSON-LD head tags, compiles Tailwind, and **fails loudly** if any anchor moved, two
elements share an id, a stale `/admin` or `github.com` reference sneaks back in, or a WhatsApp
button ends up without a real link — so you can't accidentally ship a half-patched page.

### Tailwind: compiled, not CDN

The original page loaded `cdn.tailwindcss.com` at runtime (network dependency, flash of unstyled
content, "not for production" warning). Tailwind is now compiled once:

```bash
npm run css   # src/input.css + tailwind.config.js → public/assets/tailwind.css (42 KB)
```

…and then inlined into `public/index.html`, so the homepage is a **single self-contained file**
that renders correctly even if you double-click it off your desktop.

You can still use Tailwind utility classes anywhere in the markup — just re-run `npm run build`
so the new classes get generated.

---

## 8. API reference

**Public**

```
POST /api/leads
{
  "category": "student" | "client",
  "name": "...", "email": "...", "phone": "...",
  // student
  "college": "...", "course": "...", "studyYear": "...", "studentNeed": "...",
  // business
  "company": "...", "role": "...", "companyWebsite": "...", "industry": "...",
  "clientNeed": "...", "budget": "...", "timeline": "...",
  "message": "...", "sourceSection": "contact-form", "pageUrl": "/", "elapsedMs": 8400,
  "meta": { "plan": "Growth" }
}
→ 200 { "ok": true, "ref": "NGD-XXXXXXX", "id": 12, "category": "student" }
  (duplicates return the original ref with "duplicate": true)
  (honeypot / too-fast bots get { "ok": true, "spam": true } and are dropped)
```

**Admin** (always requires a configured login)

```
GET    /api/admin/session      → authed, configured, user, team, dbMode, adminPath,
                                 notifications (which alert channels are live), contact
POST   /api/admin/login        { username?, password }
POST   /api/admin/logout
GET    /api/admin/leads?category=student|client|all&status=&source=&assignee=all|me|unassigned
                        &q=&page=1&limit=25&sort=newest|oldest
GET    /api/admin/leads?id=12&events=1          → one response + its activity log
PATCH  /api/admin/leads        { id, status? | adminNote? | assignedTo?: "me" | "unassigned" | "<username>" }
DELETE /api/admin/leads?id=12                   (admins only)
GET    /api/admin/activity?limit=12&leadId=12   → team worklog
GET    /api/admin/stats?days=14
GET    /api/admin/export?category=&status=&q=   (admins only)
```

---

## 9. Test result (local, dev-file mode, hidden path + 2 team logins)

```
GET  /                                   → 200        GET /admin  ·  /admin/  ·  /admin/admin.js → 404
GET  /ngd-control-8241                   → 308 → 200  (+ admin.css / admin.js next to it → 200)
POST /api/leads   (student)              → {"ok":true,"ref":"NGD-…","id":4,"category":"student"}
POST /api/leads   (business)             → {"ok":true,"ref":"NGD-…","id":5,"category":"client"}
POST /api/leads   (honeypot filled)      → {"ok":true,"spam":true}                 ← dropped
POST /api/leads   (submitted in 0.4 s)   → {"ok":true,"spam":true}                 ← dropped
POST /api/leads   (bad name/email)       → 422 with per-field messages
POST /api/admin/login   (wrong password) → 401
POST /api/admin/login   (simran/member)  → 200 + session cookie
GET  /api/admin/leads   (no cookie)      → 401
PATCH /api/admin/leads  {assignedTo:me}  → 200    (as the member → owner = simran)
PATCH /api/admin/leads  {status}         → 200    ·  {status:"banana"} → 422
PATCH /api/admin/leads  {adminNote}      → 200
GET  /api/admin/leads?assignee=me        → counts.mine = 1   (per logged-in user)
GET  /api/admin/leads?assignee=unassigned→ every row really unowned
GET  /api/admin/leads?id=4&events=1      → item + ≥3 events (created, assigned, status, note)
GET  /api/admin/activity?limit=10        → newest: "created · lead #4"
DELETE /api/admin/leads?id=5  (member)   → 403      (admin) → 200, then 404
GET  /api/admin/stats?days=14            → 200
GET  /api/admin/export                   → 200 UTF-8 CSV
POST /api/admin/logout                   → 200
```

---

## 10. Useful commands

```bash
npm install         # @neondatabase/serverless + tailwindcss (dev)
npm run dev         # local server: site + dashboard + api on :3000
npm run build       # rebuild index.html (markup splice + config fill + Tailwind compile + inline)
npm run css         # only recompile Tailwind → public/assets/tailwind.css
npm run init-db     # create/verify the Neon tables
```

---

## 11. What changed vs. the original single file

**Round 1 — the foundation**

* `<!doctype html>` added (the original rendered in quirks mode), duplicated inline `<style>`
  blocks and dead CSS removed, the broken tab switcher (`getElementById('ctaForm')`) replaced by
  the working `#leadForm` + category toggle.
* Enquiry form → Neon via `/api/leads` with validation, spam gates, duplicate suppression.
* Separate admin dashboard: student and business tracks, stats, search, notes, CSV export.
* Compiled + inlined Tailwind (no more CDN), SEO/OG/JSON-LD head tags, favicon.

**Round 2 — contact details, alerts, hidden admin, team**

* `site.config.json` is now the single source of truth for contact details; the build injects it
  into the page *and* the API reads it, so one file changes the whole site.
* WhatsApp everywhere on the site (hero, floating button, contact sidebar, success card, footer),
  phone/e-mail/hours/location made config-driven and self-hiding, dead social links fixed.
* New-enquiry alerts to e-mail / WhatsApp (Meta Cloud API or free CallMeBot) / any webhook.
* Dashboard moved behind a secret `ADMIN_PATH` (404 for `/admin`, no public link, `noindex`),
  team logins with `admin`/`member` roles, "assigned to" ownership + filters, and a team worklog.
* Light/dark "black & white" theme switch, one-click WhatsApp replies from the dashboard,
  reply templates, mobile card layout, and config-aware API base so all of it works from any path.

**Round 3 — polish**

* WhatsApp buttons are now **icon-only premium orbs** (WhatsApp logo, no label): a glowing
  gradient sphere in the hero and the same orb floating bottom-right, with a glass sheen, halo
  ring, soft pulse and a small availability dot. Hover lifts it; it still knows the number and
  the prefilled message from `site.config.json`.
* The old **"Prefer talking?"** sidebar card (and its "Book a 20-min intro call" button) was
  removed — the contact column is now just "What happens next" + the *Now booking* card. All
  contact details still live in the footer, and WhatsApp replies are one tap away from the orb.
