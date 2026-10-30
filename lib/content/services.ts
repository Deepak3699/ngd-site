export type Service = {
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  answer: string;
  icon: 'code' | 'mobile' | 'ai' | 'design' | 'search' | 'growth';
  deliverables: string[];
  idealFor: string;
  capabilities: { title: string; text: string }[];
  faqs: { question: string; answer: string }[];
};

export const services: Service[] = [
  {
    slug: 'web-development',
    title: 'Websites & Web Platforms',
    shortTitle: 'Web development',
    eyebrow: 'Next.js websites, portals & web apps',
    description: 'Fast, accessible digital experiences engineered to earn trust, rank clearly and convert visitors into enquiries.',
    answer:
      'NGD Solutions builds marketing websites, customer portals, dashboards and full-stack web applications using modern tools such as Next.js, React and Postgres. Every build includes responsive design, technical SEO, analytics readiness and a clean handover.',
    icon: 'code',
    idealFor: 'Startups, local businesses and teams that need a credible website or want to replace manual workflows with software.',
    deliverables: ['Next.js & React development', 'CMS & admin dashboards', 'Authentication, payments & APIs', 'Technical SEO & analytics'],
    capabilities: [
      { title: 'Marketing websites', text: 'Clear positioning, purposeful copy structure and conversion paths that make the next step obvious.' },
      { title: 'Custom platforms', text: 'Role-based dashboards, customer portals, databases and integrations shaped around your actual workflow.' },
      { title: 'Performance foundation', text: 'Server-rendered content, responsive images, sensible bundles and Core Web Vitals best practices from day one.' },
    ],
    faqs: [
      { question: 'Can NGD redesign an existing website?', answer: 'Yes. We first review content, design, speed and technical SEO, then recommend whether a focused improvement or a full rebuild offers better value.' },
      { question: 'Will I be able to update the website myself?', answer: 'Yes, when your scope includes a CMS or admin panel. We agree the editing workflow before development and provide a handover walkthrough.' },
      { question: 'Does web development include SEO?', answer: 'Every build includes technical SEO fundamentals such as crawlable pages, metadata, sitemap, structured data and performance work. Ongoing content and authority building are separate growth services.' },
    ],
  },
  {
    slug: 'mobile-app-development',
    title: 'Mobile App Development',
    shortTitle: 'Mobile apps',
    eyebrow: 'iOS & Android product development',
    description: 'Useful, polished apps with one shared codebase, a scalable backend and a release plan for both app stores.',
    answer:
      'NGD Solutions develops cross-platform mobile apps for iOS and Android, including product design, backend APIs, authentication, push notifications and store-release preparation. The scope is shaped around the smallest useful version first.',
    icon: 'mobile',
    idealFor: 'Founders validating an app idea and businesses extending an existing service or platform to mobile.',
    deliverables: ['React Native & Expo apps', 'Product UI & prototypes', 'Backend APIs & notifications', 'Store release support'],
    capabilities: [
      { title: 'MVP planning', text: 'Prioritise the core user journey so the first release solves one real problem well.' },
      { title: 'Connected product', text: 'Secure authentication, data synchronisation, payments and third-party integrations where needed.' },
      { title: 'Release readiness', text: 'Device testing, analytics events, store assets and a practical plan for updates after launch.' },
    ],
    faqs: [
      { question: 'Do you build for both iOS and Android?', answer: 'Yes. We normally use a shared cross-platform codebase to cover both platforms while keeping native device capabilities available.' },
      { question: 'Can you add an app to my existing website?', answer: 'Yes, if the existing backend can support it. We audit the current API and data model before recommending the mobile architecture.' },
      { question: 'Are app-store fees included?', answer: 'No. Apple and Google developer account fees are paid directly by you. Your accounts, code and app data remain under your ownership.' },
    ],
  },
  {
    slug: 'ai-automation',
    title: 'AI & Workflow Automation',
    shortTitle: 'AI & automation',
    eyebrow: 'Less repetitive work. Better response times.',
    description: 'Practical AI assistants and connected workflows that reduce manual follow-ups, data entry and operational bottlenecks.',
    answer:
      'NGD Solutions builds AI-enabled workflows for lead capture, document search, customer support, CRM updates, WhatsApp or email alerts and internal operations. Each automation has clear inputs, human fallback rules and measurable success criteria.',
    icon: 'ai',
    idealFor: 'Teams repeating the same operational steps across forms, inboxes, spreadsheets, CRMs and support tools.',
    deliverables: ['AI assistants & knowledge search', 'Lead and CRM automation', 'WhatsApp & email workflows', 'Human handoff & monitoring'],
    capabilities: [
      { title: 'Workflow mapping', text: 'We find the repetitive steps, edge cases and approval points before choosing any AI tool.' },
      { title: 'Useful integrations', text: 'Connect forms, calendars, helpdesks, CRMs and internal systems through reliable APIs and webhooks.' },
      { title: 'Controlled AI', text: 'Ground responses in approved information, log important actions and keep a person available for exceptions.' },
    ],
    faqs: [
      { question: 'What can be automated first?', answer: 'Lead routing, follow-up alerts, data entry and frequently asked support questions are common starting points. We choose based on volume, risk and expected time saved.' },
      { question: 'Will AI replace our support team?', answer: 'That is not the default approach. We usually automate repetitive triage and keep human handoff for sensitive, ambiguous or high-value conversations.' },
      { question: 'Can automation work with our current tools?', answer: 'Usually, yes. We review API access, permissions and data quality first, then use direct integrations or tools such as n8n, Zapier or Make where appropriate.' },
    ],
  },
  {
    slug: 'brand-ui-ux',
    title: 'Brand Identity & UI/UX Design',
    shortTitle: 'Brand & UI/UX',
    eyebrow: 'Look credible. Feel easy to use.',
    description: 'Positioning, visual identity and product interfaces that make your offer easier to understand and trust.',
    answer:
      'NGD Solutions creates brand identities, website designs and product UI systems. Work can include positioning, logo refinement, typography, colour, reusable components, wireframes and high-fidelity prototypes ready for development.',
    icon: 'design',
    idealFor: 'New brands, growing businesses with inconsistent visuals and product teams that need a clearer user experience.',
    deliverables: ['Positioning & visual direction', 'Logo and identity refinement', 'Wireframes & prototypes', 'Reusable UI design systems'],
    capabilities: [
      { title: 'Clear before decorative', text: 'We organise the message and user journey first, then build a visual system around it.' },
      { title: 'Designed for real screens', text: 'Mobile-first layouts, accessible contrast and interactive states are part of the design—not afterthoughts.' },
      { title: 'Ready to implement', text: 'Reusable components and documented design decisions keep design and development aligned.' },
    ],
    faqs: [
      { question: 'Do I need a complete rebrand?', answer: 'Not always. If your current identity is recognisable, a focused refinement of typography, colour and interface components may be enough.' },
      { question: 'Can you design without developing it?', answer: 'Yes. Design-only scopes include organised source files and a developer handover, though combining design and development usually reduces gaps.' },
      { question: 'Are revisions included?', answer: 'Yes. The written scope defines revision rounds at key stages so feedback stays focused and timelines remain predictable.' },
    ],
  },
  {
    slug: 'seo-content',
    title: 'SEO & Content Systems',
    shortTitle: 'SEO & content',
    eyebrow: 'Be easier to find and easier to understand',
    description: 'Technical SEO, useful content and clear entity signals built around what customers actually ask.',
    answer:
      'NGD Solutions improves technical SEO, service-page structure, search intent mapping and content workflows. We also prepare clear answer blocks and structured data for answer and generative engines, without promising rankings or using keyword-stuffed pages.',
    icon: 'search',
    idealFor: 'Businesses with a weak search foundation, unclear service pages or content that does not support buying decisions.',
    deliverables: ['Technical SEO audit & fixes', 'Search intent & page mapping', 'SEO, AEO & GEO content structure', 'Search Console measurement'],
    capabilities: [
      { title: 'Crawl to conversion', text: 'Resolve indexation, metadata, internal links and page-purpose issues before producing more content.' },
      { title: 'Answers people need', text: 'Create direct, specific explanations with visible FAQs and supporting detail that machines and people can parse.' },
      { title: 'Measure honestly', text: 'Track impressions, enquiries and useful engagement rather than guaranteeing positions or chasing vanity traffic.' },
    ],
    faqs: [
      { question: 'Can you guarantee number-one rankings?', answer: 'No reputable developer or SEO partner can guarantee a ranking. We can build a strong technical and content foundation, then measure and improve over time.' },
      { question: 'What are AEO and GEO?', answer: 'AEO means Answer Engine Optimization; GEO means Generative Engine Optimization. Both focus on making accurate, useful information easy for answer and AI systems to understand and cite.' },
      { question: 'Is local SEO included?', answer: 'Local landing pages and Google Business Profile guidance can be included for eligible businesses with real locations or service areas. We do not invent addresses or locations.' },
    ],
  },
  {
    slug: 'digital-marketing',
    title: 'Digital Marketing & Funnels',
    shortTitle: 'Digital marketing',
    eyebrow: 'Campaigns connected to the whole journey',
    description: 'Offers, landing pages, campaign creative and follow-up systems designed as one measurable funnel.',
    answer:
      'NGD Solutions supports digital campaigns with offer planning, landing pages, paid-social or search creative, email follow-ups and conversion tracking. The goal is a coherent customer journey rather than isolated ads or vanity metrics.',
    icon: 'growth',
    idealFor: 'Businesses with a validated offer that need a clearer funnel and better campaign execution.',
    deliverables: ['Offer & funnel planning', 'Campaign landing pages', 'Paid campaign creative', 'Email follow-up & reporting'],
    capabilities: [
      { title: 'Offer first', text: 'Clarify the audience, problem and reason to act before spending on traffic.' },
      { title: 'Creative with a job', text: 'Build campaign variations around testable messages instead of disconnected design ideas.' },
      { title: 'Closed-loop learning', text: 'Connect conversion events and lead quality so reporting informs the next iteration.' },
    ],
    faqs: [
      { question: 'Are advertising costs included?', answer: 'No. Media spend is paid directly from your own ad accounts. Management, creative and landing-page work are scoped separately.' },
      { question: 'Can you work with our existing ad accounts?', answer: 'Yes. We prefer that you retain ownership of ad, analytics and publishing accounts, with access granted only as needed.' },
      { question: 'Do you guarantee a return on ad spend?', answer: 'No. Results depend on the offer, market, budget and sales process. We define test goals and report performance transparently.' },
    ],
  },
];

export const getService = (slug: string) => services.find((service) => service.slug === slug);
