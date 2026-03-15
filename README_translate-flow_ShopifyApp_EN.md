# TranslateFlow — AI-Powered Product Translation for Shopify

> **What:** A Shopify Embedded App that bulk-translates product titles and descriptions using AI (Claude API) and writes them directly to Shopify's native multilingual system via the Translations API
> **Who:** Small-to-mid-size Shopify merchants looking to expand into cross-border e-commerce
> **Stack:** Remix · TypeScript · Prisma + SQLite · Polaris React · Shopify GraphQL Admin API (Translations API) · Claude API

**Source code:** [github.com/mer-prog/translate-flow](https://github.com/mer-prog/translate-flow)

---

## Skills Demonstrated

| Skill | Implementation Details |
|-------|----------------------|
| Shopify App Development | Embedded App built on the Shopify App Template (Remix). Implements OAuth authentication, multilingual content registration via the Translations API, and translatable content retrieval using the `translatableResource` query |
| AI API Integration | Claude API (`claude-sonnet-4-20250514`) integration with a BYOK (Bring Your Own Key) model — users supply their own API key. Prompt engineering for structured JSON output |
| Design Patterns | Facade pattern for swapping translation backends (mock / Claude API). Service layer split across 5 files, each with a clear single responsibility |
| GraphQL Operations | Four distinct GraphQL operations: product listing, translation status lookup, translatable content retrieval (with digest), and the `translationsRegister` mutation |
| Database Design | Three Prisma ORM models (Session / TranslationJob / AppSettings) providing translation audit logging and per-shop configuration |
| Full-Stack Implementation | End-to-end workflow — product selection → preview → save — built with Remix loader/action conventions |
| Internationalization (i18n) | Client-side EN/JA UI toggle via React Context + localStorage. 56 translation keys with parameter interpolation support |

---

## Tech Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | Remix (Shopify App Template) | ^2.16.1 | SSR, file-based routing, loader/action pattern |
| Language | TypeScript | ^5.2.2 | Type-safe development (strict mode enabled) |
| UI Library | Polaris React | ^12.0.0 | Shopify Admin-consistent UI components |
| Database | Prisma + SQLite | ^6.2.1 | ORM, migration management, session storage |
| API | Shopify GraphQL Admin API | 2025-01 | Product retrieval, translation status checks, translation registration |
| AI Translation | Claude API | claude-sonnet-4-20250514 | High-quality AI translation of product content (BYOK model) |
| Auth | Shopify App Bridge React | ^4.1.6 | Embedded App authentication, OAuth management |
| Session Storage | shopify-app-session-storage-prisma | ^8.0.0 | Prisma-backed session persistence |
| Build Tool | Vite | ^6.2.2 | HMR, production builds |
| Runtime | Node.js | >=20.19 <22 \|\| >=22.12 | Server execution environment |
| Code Quality | ESLint + Prettier | ^8.42.0 / ^3.2.4 | Linting & formatting |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Shopify Admin (Embedded App)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Polaris React UI                         │  │
│  │  Dashboard       │ Translate        │ Settings             │  │
│  │  (Product list)    (Preview)          (Mode toggle)        │  │
│  │  (Status badges)  (Save)             (API key)            │  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          │ Remix loader / action                  │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │                     Remix Server                            │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │          translation.server.ts (Facade)             │   │  │
│  │  │            Translation mode switch                  │   │  │
│  │  │         ┌──────────┴──────────┐                     │   │  │
│  │  │         ▼                     ▼                     │   │  │
│  │  │  mock-translator      claude-translator             │   │  │
│  │  │  .server.ts           .server.ts                    │   │  │
│  │  │  (25 lines)           (61 lines)                    │   │  │
│  │  │  Adds [EN]/[JA]       Calls Claude API              │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐   │  │
│  │  │ product-fetcher │  │ shopify-locale.server.ts       │   │  │
│  │  │ .server.ts      │  │ (97 lines)                     │   │  │
│  │  │ (124 lines)     │  │ Locale retrieval               │   │  │
│  │  │ Product data    │  │ Translatable content fetch     │   │  │
│  │  │ fetching        │  │ Translation registration       │   │  │
│  │  └────────┬────────┘  └───────────┬────────────────────┘   │  │
│  │           │                       │                        │  │
│  └───────────┼───────────────────────┼────────────────────────┘  │
│              │                       │                           │
└──────────────┼───────────────────────┼───────────────────────────┘
               │                       │
       ┌───────▼───────┐       ┌───────▼───────┐
       │ Shopify       │       │ Shopify       │
       │ GraphQL API   │       │ Translations  │
       │ (Products)    │       │ API           │
       └───────────────┘       │ (Registration)│
                               └───────────────┘
       ┌───────────────┐       ┌───────────────┐
       │ Claude API    │       │ Prisma        │
       │ (AI Translate)│       │ + SQLite      │
       │ BYOK          │       │ TranslationJob│
       │               │       │ AppSettings   │
       └───────────────┘       └───────────────┘
```

---

## Key Features

### 1. Product Dashboard (`app/routes/app._index.tsx` — 73 lines)
Renders a product list in a Polaris IndexTable. Each row displays a thumbnail, product title, and locale badges (green for translated, yellow for untranslated). Users select multiple products via checkboxes and click "Translate (N items)" to navigate to the translation screen. Products are fetched via GraphQL (up to 50 per page), and translation status for each product is resolved in parallel using the `translatableResource` query.

### 2. Translation Workflow (`app/routes/app.translate.tsx` — 297 lines)
A three-step translation flow:
1. **Language selection**: The `LanguageSelector` component lists the store's published locales (excluding the primary language) for the user to pick from
2. **Preview**: Clicking "Translation Preview" runs translations for each product × locale combination. The `TranslationPreview` component renders a side-by-side comparison of the original and translated text
3. **Save**: "Save to Shopify" writes translations via the `translationsRegister` mutation and logs each operation as a `TranslationJob` in Prisma

### 3. Translation Facade (`app/services/translation.server.ts` — 26 lines)
Routes translation requests to the appropriate backend based on `AppSettings.translationMode`. The facade pattern lets calling code use a single interface regardless of whether mock or Claude API mode is active.

### 4. Mock Translation (`app/services/mock-translator.server.ts` — 25 lines)
A zero-cost translation mode for development and testing. Simply prepends a locale prefix (`[EN]`, `[JA]`) to the original text — no API calls, no charges. Useful for verifying the full workflow end-to-end without incurring any costs.

### 5. Claude API Translation (`app/services/claude-translator.server.ts` — 61 lines)
Sends product titles and descriptions to the Anthropic Messages API (`https://api.anthropic.com/v1/messages`). The prompt instructs Claude to return structured JSON (`translatedTitle` / `translatedBody`), which is then extracted via regex and parsed. Authentication uses the merchant's own API key (BYOK).

### 6. Product Data Fetching (`app/services/product-fetcher.server.ts` — 124 lines)
`fetchProducts()`: Retrieves paginated product listings (50 per page) via GraphQL and enriches each product with its translated locale array using `translatableResource` queries. `fetchProduct()`: Fetches detailed data for a single product.

### 7. Shopify Locale & Translation API (`app/services/shopify-locale.server.ts` — 97 lines)
Exposes three functions:
- `getShopLocales()`: Returns the store's published non-primary locales
- `getTranslatableContent()`: Fetches translatable content keys, values, and digests (content hashes)
- `registerTranslations()`: Submits locale, key, value, and digest to the `translationsRegister` mutation

### 8. Settings Screen (`app/routes/app.settings.tsx` — 168 lines)
A three-section settings form:
1. **Translation mode**: Dropdown to switch between mock and Claude API mode. The API key field (password-masked) only appears when Claude API mode is selected
2. **Default languages**: Comma-separated locale codes (e.g., `en,ja`)
3. **Save**: Upserts to the `AppSettings` table via Prisma

### 9. EN/JA UI Toggle (`app/i18n/` — 3 files)
Client-side i18n powered by React Context and a `useTranslation()` hook. Locale preference is persisted in `localStorage` (defaults to Japanese). Covers all UI text with 56 translation keys and supports `{paramKey}` parameter interpolation.

---

## Database Design

```
┌─────────────────────────────┐
│         Session             │
├─────────────────────────────┤
│ id          STRING PK       │
│ shop        STRING          │
│ state       STRING          │
│ isOnline    BOOLEAN         │
│ scope       STRING?         │
│ expires     DATETIME?       │
│ accessToken STRING          │
│ userId      BIGINT?         │
│ firstName   STRING?         │
│ lastName    STRING?         │
│ email       STRING?         │
│ accountOwner BOOLEAN        │
│ locale      STRING?         │
│ collaborator BOOLEAN?       │
│ emailVerified BOOLEAN?      │
│ refreshToken STRING?        │
│ refreshTokenExpires DATETIME│
└─────────────────────────────┘

┌─────────────────────────────┐      ┌──────────────────────────┐
│      TranslationJob         │      │      AppSettings         │
├─────────────────────────────┤      ├──────────────────────────┤
│ id             STRING PK    │      │ id             STRING PK │
│ shop           STRING       │      │ shop           STRING    │
│ productId      STRING       │      │                @unique   │
│ targetLocale   STRING       │      │ translationMode STRING   │
│ status         STRING       │      │  (mock / claude-api)     │
│  (pending/completed/failed) │      │ apiKey         STRING?   │
│ originalTitle  STRING       │      │  (Claude API key, BYOK)  │
│ translatedTitle STRING?     │      │ defaultLocales STRING    │
│ originalBody   STRING       │      │  (CSV: "en,ja")          │
│ translatedBody STRING?      │      └──────────────────────────┘
│ createdAt      DATETIME     │
└─────────────────────────────┘
```

---

## Screen Specifications

### Dashboard (`/app`)
- Info banner with usage instructions
- Product list table (IndexTable with multi-select)
- Columns: Thumbnail + product name / translated locale badges
- Badge colors: translated (green) / untranslated (yellow)
- "Translate (N items)" button (enabled only when products are selected)

### Translation (`/app/translate?productId=xxx&productId=yyy`)
- Displays the selected products
- Target language checkboxes (store's published locales)
- "Translation Preview" button → loading spinner → preview cards
- Preview cards: original text (left) / translated text (right) in a two-column layout
- "Save to Shopify" button → success/error banner

### Settings (`/app/settings`)
- Translation mode selector (mock / Claude API)
- Claude API key input (shown only in Claude API mode, password-masked)
- Default languages (comma-separated)
- Save button

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/app` | Shopify Admin | Dashboard (product list + translation status) |
| GET | `/app/translate` | Shopify Admin | Translation screen (selected products + available locales) |
| POST | `/app/translate` | Shopify Admin | Generate translation preview / save translations to Shopify |
| GET | `/app/settings` | Shopify Admin | Settings form |
| POST | `/app/settings` | Shopify Admin | Save settings (upsert) |
| POST | `/webhooks/app/uninstalled` | Shopify signature | App uninstall webhook |
| POST | `/webhooks/app/scopes_update` | Shopify signature | Scope update webhook |

---

## GraphQL Operations

| Type | Operation | Purpose |
|------|-----------|---------|
| Query | `products(first, after)` | Paginated product listing |
| Query | `product(id)` | Single product detail retrieval |
| Query | `translatableResource(resourceId).translations` | Check which locales a product has been translated into |
| Query | `translatableResource(resourceId).translatableContent` | Fetch translatable content (key, value, digest) |
| Query | `shopLocales` | List the store's published locales |
| Mutation | `translationsRegister(resourceId, translations)` | Register translated content |

---

## Project Structure

```
translate-flow/                           55 files (excluding node_modules/build)
├── app/                                  TypeScript/TSX — 26 files (1,613 lines)
│   ├── routes/
│   │   ├── app.tsx                 66L   Layout wrapper (auth & AppBridge init)
│   │   ├── app._index.tsx          73L   Dashboard (product list & translation status)
│   │   ├── app.translate.tsx      297L   Translation screen (preview & save workflow)
│   │   ├── app.settings.tsx       168L   Settings (translation mode, API key, languages)
│   │   ├── _index/
│   │   │   └── route.tsx           58L   Landing page
│   │   ├── auth.login/
│   │   │   ├── route.tsx           68L   Login form
│   │   │   └── error.server.tsx    16L   Login error handling
│   │   ├── auth.$.tsx               8L   OAuth callback
│   │   ├── webhooks.app.uninstalled.tsx    17L   Uninstall webhook
│   │   └── webhooks.app.scopes_update.tsx  21L   Scope update webhook
│   ├── services/
│   │   ├── translation.server.ts      26L   Translation facade (mode switching)
│   │   ├── mock-translator.server.ts  25L   Mock translation (prefix-only)
│   │   ├── claude-translator.server.ts 61L   Claude API translation
│   │   ├── product-fetcher.server.ts 124L   Product data fetching (GraphQL)
│   │   └── shopify-locale.server.ts   97L   Locale & translation API operations
│   ├── components/
│   │   ├── ProductTranslationList.tsx 102L   Product list table (with translation badges)
│   │   ├── TranslationPreview.tsx     90L   Side-by-side translation comparison
│   │   ├── LanguageSelector.tsx       40L   Target language checkboxes
│   │   └── LanguageToggle.tsx         32L   EN/JA UI toggle button
│   ├── i18n/
│   │   ├── i18nContext.tsx            81L   i18n Provider + hook
│   │   ├── en.json                    56L   English translations (56 keys)
│   │   └── ja.json                    56L   Japanese translations (56 keys)
│   ├── shopify.server.ts              35L   Shopify app configuration
│   ├── db.server.ts                   15L   Prisma client initialization
│   ├── root.tsx                       30L   HTML document root
│   └── entry.server.tsx               59L   SSR handler (streaming support)
├── prisma/
│   ├── schema.prisma                  55L   Database schema (3 models)
│   └── migrations/                         Migrations
├── package.json                       78L   Dependency definitions
├── vite.config.ts                     74L   Vite build configuration
├── tsconfig.json                      20L   TypeScript configuration
├── shopify.app.toml                        Shopify app config (incl. webhook definitions)
├── shopify.web.toml                        Web configuration
├── Dockerfile                         21L   Production deploy (node:18-alpine)
└── CLAUDE.md                         127L   Project specification
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >=20.19 <22 or >=22.12
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- A Shopify development store with multiple locales enabled
- (Optional) A Claude API key for AI translation mode

### Setup

```bash
# Clone the repository
git clone https://github.com/mer-prog/translate-flow.git
cd translate-flow

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start the dev server
shopify app dev

# Deploy to production
shopify app deploy
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_API_KEY` | Shopify app API key | Yes |
| `SHOPIFY_API_SECRET` | Shopify app secret key | Yes |
| `SHOPIFY_APP_URL` | App's public HTTPS URL | Yes |
| `SCOPES` | API scopes (`read_products,write_translations,read_locales`) | Yes |
| `SHOP_CUSTOM_DOMAIN` | Custom shop domain | No |
| `PORT` | Server port (default: 3000) | No |
| `FRONTEND_PORT` | HMR port (default: 8002) | No |

> **Note:** The Claude API key is managed per-shop via the in-app settings screen (stored in the `AppSettings` table), not as an environment variable.

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| Facade pattern for translation mode switching | Provides a unified interface for mock (testing) and Claude API (production) backends. Adding a new translation provider only requires registering it in the facade |
| BYOK (Bring Your Own Key) model | Merchants supply their own Claude API key. The app incurs zero API costs, and users get transparent, usage-based billing |
| Mock translation mode | Prepends `[EN]`/`[JA]` prefixes at zero cost. Lets you verify the entire workflow during development, demos, and testing without any API charges |
| Direct writes to the Shopify Translations API | No separate translation database — translations go straight into Shopify's native multilingual system, so the store's language switcher works immediately |
| Digest-based translation registration | Fetches `translatableContentDigest` before executing mutations, ensuring content integrity |
| Two-step preview → save flow | Users can review AI-generated translations before committing them to the live store |
| TranslationJob audit logging | Records every translation operation (original text, translated text, status) in Prisma for troubleshooting and quality review |
| SQLite + Prisma | More than sufficient for the MVP stage. Easy migration management, and switching to a production database later only requires changing the Prisma adapter |

---

## Running Costs

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Shopify | Development store (Dev Store) | Free |
| Mock translation mode | No charges | $0 |
| Claude API (AI translation mode) | Usage-based via user's API key | User-paid |
| Hosting (Docker) | TBD (Heroku / AWS / Fly.io / etc.) | Varies |
| **Total (dev environment, mock mode)** | | **$0** |

---

## Author

[@mer-prog](https://github.com/mer-prog)
