# TranslateFlow

**AI-powered product translation for Shopify's multi-language stores.**

![TranslateFlow Screenshot](docs/screenshots/translate-flow-preview.png)

## Features

- **Bulk Translation** — Select multiple products and translate titles and descriptions in one click
- **Side-by-Side Preview** — Compare original and translated content before saving
- **Shopify Translations API** — Writes directly to Shopify's native multi-language system
- **Dual Translation Modes** — Mock mode (free, for testing) and Claude API mode (production-quality AI translation)
- **BYOK (Bring Your Own Key)** — Merchants use their own Claude API key, keeping costs transparent and per-usage
- **Translation Status** — Dashboard shows per-product language badges at a glance
- **EN/JA Support** — Optimized for English and Japanese cross-border commerce

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Remix (Shopify App Template) |
| Language | TypeScript |
| Database | Prisma + SQLite |
| UI | Polaris React |
| API | Shopify GraphQL Admin API (Translations API) |
| AI Translation | Claude API (optional, BYOK) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- A Shopify development store with multiple locales enabled
- (Optional) A Claude API key for AI-powered translations

### Setup

```bash
# Install dependencies
npm install

# Set up the database
npx prisma migrate dev

# Start development server
shopify app dev
```

### Deployment

```bash
shopify app deploy
```

## Architecture

```
translate-flow/
├── app/
│   ├── routes/          # Product list, translation execution, settings
│   ├── services/        # Translation facade, mock/Claude translators, Shopify locale API
│   └── components/      # Product translation list, preview, language selector
├── prisma/              # Database schema (TranslationJob, AppSettings)
└── shopify.app.toml     # Shopify app configuration
```

The translation service uses a facade pattern to switch between mock and Claude API backends. Mock mode prepends locale prefixes (`[EN]`, `[JA]`) for zero-cost testing. Claude API mode delivers production-quality translations using the merchant's own API key. Translated content is saved to Shopify via the Translations API, making it available through Shopify's native language switcher.

## License

MIT
