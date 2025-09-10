// lib/catalog.js

// ===== Mock Categories =====
export const categories = [
  { desc: 'Mobile & web apps, MVPs, stores.'  , slug: 'app-development', name: 'App Development', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'APIs, integrations, DevOps, tooling.'  , slug: 'programming-tech', name: 'Programming & Tech', image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Interfaces, wireframes, dashboards.'  , slug: 'ui-design', name: 'UI Design', image: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Themes, plugins, WooCommerce.'  , slug: 'wordpress', name: 'WordPress', image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop' },

  // --- extra categories ---
  { desc: 'Company sites, landings, CMS setups.'  , slug: 'website-development', name: 'Website Development', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Explainers, edits, motion graphics.'  , slug: 'video-animation', name: 'Video & Animation', image: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Copywriting, localization, editing.'  , slug: 'writing-translation', name: 'Writing & Translation', image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Voice-over, mixing, jingles.'  , slug: 'music-audio', name: 'Music & Audio', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Ads, funnels, email, analytics.'  , slug: 'digital-marketing', name: 'Digital Marketing', image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Chatbots, LLMs, automation.'  , slug: 'ai-services', name: 'AI Services', image: 'https://images.unsplash.com/photo-1508385082359-f38ae991e8f2?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Strategy, audits, roadmaps.'  , slug: 'consulting', name: 'Consulting', image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Product, portrait, lifestyle.'  , slug: 'photography', name: 'Photography', image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'ETL, modeling, dashboards.'  , slug: 'data-science', name: 'Data Science', image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'CI/CD, containers, infra as code.'  , slug: 'devops', name: 'DevOps', image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'On-page, technical, backlinks.'  , slug: 'seo', name: 'SEO', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Blogs, guides, case studies.'  , slug: 'content-writing', name: 'Content Writing', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Unity/Unreal, assets, tools.'  , slug: 'game-development', name: 'Game Development', image: 'https://images.unsplash.com/photo-1542751110-97427bbecf20?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Pentests, audits, hardening.'  , slug: 'cybersecurity', name: 'Cybersecurity', image: 'https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Smart contracts, wallets, DApps.'  , slug: 'blockchain', name: 'Blockchain', image: 'https://images.unsplash.com/photo-1518544887871-0f3c3f53f9d0?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Content, scheduling, growth.'  , slug: 'social-media', name: 'Social Media', image: 'https://images.unsplash.com/photo-1519222970733-f546218fa6d7?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Stores, payments, catalogs.'  , slug: 'ecommerce', name: 'E-commerce', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Logos, guidelines, assets.'  , slug: 'branding-identity', name: 'Branding & Identity', image: 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=1200&auto=format&fit=crop' },
  { desc: 'Manual, automated, reporting.'  , slug: 'qa-testing', name: 'QA & Testing', image: 'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?q=80&w=1200&auto=format&fit=crop' },
  { desc: '3D scenes, prototypes, apps.'  , slug: 'ar-vr', name: 'AR/VR', image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
  { desc: 'Deploy, scale, monitor.' , slug: 'cloud-computing', name: 'Cloud Computing', image: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop' }
];


// ===== Assets (helpers) =====
const avatarA = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop';
const avatarB = 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?q=80&w=200&auto=format&fit=crop';
const avatarC = 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop';

const img = {
  city1: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?q=80&w=1200&auto=format&fit=crop',
  city2: 'https://images.unsplash.com/photo-1508138221679-760a23a2285b?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  city3: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1200&auto=format&fit=crop',
  people1: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1200&auto=format&fit=crop',
  people2: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1200&auto=format&fit=crop',
  cam1: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=1200&auto=format&fit=crop',
  cam2: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1200&auto=format&fit=crop',
  ui1: 'https://plus.unsplash.com/premium_photo-1666901328734-3c6eb9b6b979?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  ui2: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?q=80&w=1200&auto=format&fit=crop',
  code: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

const sellerNames = [
  'Kaviya Pariya', 'Omar Z.', 'Aya Hassan', 'Mahmoud F.', 'Lina S.', 'Ali R.',
  'Hala K.', 'Mostafa G.', 'Ramy N.', 'Yousef B.', 'Aisha M.', 'Noor T.',
  'Karim H.', 'Razan J.', 'Sara A.', 'Ziad M.', 'Mariam S.', 'Hadi K.', 'Reem A.'
];

const sellerLevels = ['Level 1', 'Level 2', 'Top Rated'];

const avatars = [avatarA, avatarB, avatarC];

const locations = [
  'Riyadh, SA', 'Jeddah, SA', 'Cairo, EG', 'Alexandria, EG',
  'Dubai, AE', 'Abu Dhabi, AE', 'Doha, QA', 'Amman, JO', 'Casablanca, MA', 'Remote'
];

// ===== Utilities =====
function pick(arr, i) {
  return arr[i % arr.length];
}
function seller(i) {
  return { name: pick(sellerNames, i), level: pick(sellerLevels, i), avatar: pick(avatars, i) };
}
function price(base, i, step = 20) {
  return base + (i % 4) * step;
}
function rating(i) {
  // 4.2 ~ 5.0
  const vals = [4.2, 4.4, 4.6, 4.8, 5.0];
  return pick(vals, i);
}
function ratingCount(i) {
  return 5 + (i % 40);
}
function gig(title, priceVal, days, desc, gallery = []) {
  return {
    slug: title.toLowerCase().replace(/\s+/g, '-'),
    title,
    price: priceVal,
    delivery: `${days} days`,
    description: desc,
    gallery
  };
}

function mkService({ i, category, name, coverPool, basePrice, about, gallery = [] }) {
  return {
    slug: `${category}-svc-${i + 1}`,
    name,
    category,
    seller: seller(i),
    cover: pick(coverPool, i),
    priceFrom: price(basePrice, i),
    rating: rating(i),
    ratingCount: ratingCount(i),
    location: pick(locations, i),
    about,
    gigs: [
      gig('Basic', price(basePrice, i, 15), 3, 'Entry package covering essentials.', gallery.slice(0, 1)),
      gig('Standard', price(basePrice + 60, i, 20), 6, 'Balanced scope with revisions.', gallery.slice(0, 2)),
      gig('Pro', price(basePrice + 150, i, 30), 10, 'Full-feature package with priority support.', gallery.slice(0, 3))
    ]
  };
}

// ===== Base hand-written examples (you had before) =====
const baseServices = [
  // WORDPRESS
  {
    slug: 'photography-service',
    name: 'Photography Service',
    category: 'wordpress',
    seller: { name: 'Kaviya Pariya', level: 'Level 1', avatar: avatarB },
    cover: img.cam1,
    priceFrom: 10,
    rating: 4.7,
    ratingCount: 28,
    location: 'Riyadh, SA',
    about: 'Creative photography for brands and personal portraits.',
    gigs: [
      {
        slug: 'basic-portrait-pack',
        title: 'Basic Portrait Pack',
        price: 10,
        delivery: '2 days',
        description: '10 edited photos, natural light portraits.',
        gallery: [img.people1, img.people2]
      },
      {
        slug: 'brand-lifestyle-pack',
        title: 'Brand Lifestyle Pack',
        price: 25,
        delivery: '4 days',
        description: 'Lifestyle shots for brand socials (20 photos).',
        gallery: [img.city1]
      }
    ]
  },

  // APP DEVELOPMENT (examples)
  {
    slug: 'react-native-mvp',
    name: 'React Native MVP App',
    category: 'app-development',
    seller: { name: 'Sara A.', level: 'Top Rated', avatar: avatarA },
    cover: img.code,
    priceFrom: 500,
    rating: 4.6,
    ratingCount: 41,
    location: 'Dubai, AE',
    about: 'Cross-platform MVPs with auth, API integration, and store-ready builds.',
    gigs: [
      { slug: 'rn-prototype', title: 'Prototype (1 screen flow)', price: 200, delivery: '3 days', description: 'Clickable prototype with state.', gallery: [img.ui1] },
      { slug: 'rn-mvp', title: 'MVP (5 screens)', price: 800, delivery: '10 days', description: 'Auth, forms, API, basic cache.', gallery: [img.ui2] }
    ]
  },
  {
    slug: 'flutter-ecommerce',
    name: 'Flutter E-commerce App',
    category: 'app-development',
    seller: { name: 'Mahmoud F.', level: 'Level 2', avatar: avatarC },
    cover: img.city2,
    priceFrom: 900,
    rating: 4.8,
    ratingCount: 55,
    location: 'Riyadh, SA',
    about: 'Beautiful Flutter shopping apps with Firebase or custom APIs.',
    gigs: [
      { slug: 'flutter-catalog', title: 'Catalog + Cart', price: 600, delivery: '12 days', description: 'Product list, cart, checkout UI.', gallery: [] },
      { slug: 'flutter-full', title: 'Full Store', price: 1500, delivery: '20 days', description: 'Payments, auth, orders, push.', gallery: [] }
    ]
  },

  // PROGRAMMING & TECH (examples)
  {
    slug: 'api-integration',
    name: 'API Integration & Webhooks',
    category: 'programming-tech',
    seller: { name: 'Hala K.', level: 'Level 2', avatar: avatarB },
    cover: img.code,
    priceFrom: 120,
    rating: 4.5,
    ratingCount: 32,
    location: 'Doha, QA',
    about: 'Stripe, PayPal, Twilio, SendGrid, and custom REST/GraphQL.',
    gigs: [
      { slug: 'rest-hook', title: 'REST Hook Setup', price: 120, delivery: '2 days', description: 'Webhook endpoint + verification.', gallery: [] },
      { slug: 'stripe-connect', title: 'Stripe Connect', price: 350, delivery: '5 days', description: 'Onboarding, payouts, webhooks.', gallery: [] }
    ]
  },

  // UI DESIGN (examples)
  {
    slug: 'ui-ux-figma',
    name: 'UI/UX — Figma Design',
    category: 'ui-design',
    seller: { name: 'Noor T.', level: 'Top Rated', avatar: avatarA },
    cover: img.ui1,
    priceFrom: 200,
    rating: 4.9,
    ratingCount: 63,
    location: 'Abu Dhabi, AE',
    about: 'Prototyping, user flows, and handoff-ready components.',
    gigs: [
      { slug: 'wireframes', title: 'Wireframes (up to 5 screens)', price: 150, delivery: '3 days', description: 'Low-fidelity flows.', gallery: [] },
      { slug: 'hi-fi', title: 'Hi-Fi UI (up to 8 screens)', price: 400, delivery: '7 days', description: 'Pixel-perfect UI with tokens.', gallery: [] }
    ]
  }
];

// ===== Bulk generation per category =====
const bulk = [];

/**
 * addBulk(category, count, options)
 * - category: one of categories.slug
 * - count: how many services to generate
 * - options: { nameBase, coverPool, basePrice, about, gallery }
 */
function addBulk(category, count, options) {
  const { nameBase, coverPool, basePrice, about, gallery = [] } = options;
  for (let i = 0; i < count; i++) {
    const name = `${nameBase} #${i + 1}`;
    bulk.push(
      mkService({
        i,
        category,
        name,
        coverPool,
        basePrice,
        about,
        gallery
      })
    );
  }
}

// WordPress — websites/themes/plugins/performance
addBulk('wordpress', 24, {
  nameBase: 'WordPress Website',
  coverPool: [img.city1, img.city2, img.cam2],
  basePrice: 80,
  about: 'Custom themes, plugin setup, and performance optimization.',
  gallery: [img.city1, img.city2]
});
addBulk('wordpress', 12, {
  nameBase: 'WooCommerce Store',
  coverPool: [img.city3, img.city2, img.cam1],
  basePrice: 120,
  about: 'WooCommerce setup, payment gateways, products and shipping.',
  gallery: [img.people1, img.city1, img.cam2]
});

// App Development — RN/Flutter/Next i.e. mobile & web apps
addBulk('app-development', 20, {
  nameBase: 'React Native App',
  coverPool: [img.code, img.city1, img.city2],
  basePrice: 500,
  about: 'Cross-platform app with auth, API integration, and store-ready builds.',
  gallery: [img.ui1, img.ui2]
});
addBulk('app-development', 16, {
  nameBase: 'Flutter App',
  coverPool: [img.city2, img.city3, img.code],
  basePrice: 550,
  about: 'Beautiful Flutter apps with Firebase or custom APIs.',
  gallery: [img.ui2, img.ui1]
});
addBulk('app-development', 10, {
  nameBase: 'Next.js Full-stack',
  coverPool: [img.ui1, img.code, img.city1],
  basePrice: 420,
  about: 'App Router, Tailwind, Prisma, Postgres, auth, and deployments.',
  gallery: [img.ui1, img.ui2, img.city1]
});

// Programming & Tech — API, DevOps, Performance, Scraping, Bug fixing
addBulk('programming-tech', 18, {
  nameBase: 'API Integration',
  coverPool: [img.code, img.city2, img.city1],
  basePrice: 110,
  about: 'Stripe, Twilio, SendGrid, REST/GraphQL integrations and webhooks.',
  gallery: []
});
addBulk('programming-tech', 14, {
  nameBase: 'DevOps & Docker',
  coverPool: [img.city2, img.code, img.city3],
  basePrice: 160,
  about: 'Dockerize, CI/CD, Nginx + SSL, zero-downtime deployments.',
  gallery: []
});
addBulk('programming-tech', 10, {
  nameBase: 'Web Scraping & Automation',
  coverPool: [img.code, img.city1, img.city2],
  basePrice: 140,
  about: 'Puppeteer/Playwright scraping, automation, and data exports.',
  gallery: []
});
addBulk('programming-tech', 10, {
  nameBase: 'Bug Fixing & Code Review',
  coverPool: [img.city1, img.city2, img.code],
  basePrice: 60,
  about: 'Fix FE/BE bugs with clear reports, tests and best practices.',
  gallery: []
});

// UI Design — Landing, Dashboard, Design Systems, Mobile UI
addBulk('ui-design', 16, {
  nameBase: 'Landing Page Design',
  coverPool: [img.ui1, img.ui2, img.city1],
  basePrice: 180,
  about: 'High-converting landing pages with responsive grid and components.',
  gallery: [img.ui1]
});
addBulk('ui-design', 14, {
  nameBase: 'Dashboard UX/UI',
  coverPool: [img.city1, img.ui2, img.city2],
  basePrice: 220,
  about: 'Data-dense dashboards with accessible patterns and states.',
  gallery: [img.ui2]
});
addBulk('ui-design', 12, {
  nameBase: 'Design System & Tokens',
  coverPool: [img.ui2, img.ui1, img.city2],
  basePrice: 260,
  about: 'Typography, spacing, color scales, and components library.',
  gallery: [img.ui1, img.ui2]
});

// ===== Final services export (base + bulk) =====
export const services = [...baseServices, ...bulk];

// ===== API-like Helpers =====
export function getCategories() {
  return categories;
}
export function getCategoryBySlug(slug) {
  return categories.find((c) => c.slug === slug);
}
export function getAllServices() {
  return services;
}
export function getServicesByCategory(categorySlug) {
  return services.filter((s) => s.category === categorySlug);
}
export function getServiceBySlugs(categorySlug, serviceSlug) {
  const list = getServicesByCategory(categorySlug);
  return list.find((s) => s.slug === serviceSlug);
}
export function getGigBySlugs(categorySlug, serviceSlug, gigSlug) {
  const svc = getServiceBySlugs(categorySlug, serviceSlug);
  if (!svc) return null;
  return (svc.gigs || []).find((g) => g.slug === gigSlug) || null;
}
export function searchServices(query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return services;
  return services.filter((s) =>
    [s.name, s.about, s.location, s.category, s.seller?.name]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  );
}
export function getServicesCountByCategory() {
  return categories.map((c) => ({
    category: c.slug,
    name: c.name,
    count: services.filter((s) => s.category === c.slug).length
  }));
}
