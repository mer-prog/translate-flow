# TranslateFlow — 商品コンテンツAI翻訳Shopifyアプリ

> **何を:** 商品タイトル・説明文をAI（Claude API）で一括翻訳し、Shopifyの多言語機能（Translations API）に直接保存するEmbedded App
> **誰に:** 越境ECを始めたい中小Shopifyマーチャント
> **技術:** Remix · TypeScript · Prisma + SQLite · Polaris React · Shopify GraphQL Admin API (Translations API) · Claude API

**ソースコード:** [github.com/mer-prog/translate-flow](https://github.com/mer-prog/translate-flow)

---

## このプロジェクトで証明できるスキル

| スキル | 実装内容 |
|--------|----------|
| Shopifyアプリ開発 | Shopify App Template (Remix) ベースのEmbedded App。OAuth認証、Translations APIによる多言語コンテンツ登録、translatableResourceクエリによる翻訳可能コンテンツの取得を実装 |
| AI API統合 | Claude API（`claude-sonnet-4-20250514`）との連携。BYOK（Bring Your Own Key）モデルでユーザーのAPIキーを使用。プロンプトエンジニアリングによるJSON構造化出力 |
| 設計パターン | ファサードパターンで翻訳モード（モック/Claude API）を切替。サービス層を5ファイルに分離し、各サービスの独立性を確保 |
| GraphQL操作 | 商品取得、翻訳ステータス取得、翻訳可能コンテンツ取得（digest付き）、翻訳登録ミューテーションの4種のGraphQLオペレーションを実装 |
| データベース設計 | Prisma ORMで3モデル（Session / TranslationJob / AppSettings）を設計。翻訳ジョブの監査ログとショップ別設定を管理 |
| フルスタック実装 | Remixのloader/actionパターンで商品選択→プレビュー→保存の3ステップワークフローを構築 |
| 国際化（i18n） | React Context + localStorageによる日英UI切替。56キーの翻訳ファイル、パラメータ補間対応 |

---

## 技術スタック

| カテゴリ | 技術 | バージョン | 用途 |
|----------|------|-----------|------|
| フレームワーク | Remix (Shopify App Template) | ^2.16.1 | SSR、ファイルベースルーティング、loader/actionパターン |
| 言語 | TypeScript | ^5.2.2 | 型安全な開発（strict mode有効） |
| UIライブラリ | Polaris React | ^12.0.0 | Shopify管理画面準拠のUIコンポーネント |
| データベース | Prisma + SQLite | ^6.2.1 | ORM、マイグレーション管理、セッションストレージ |
| API | Shopify GraphQL Admin API | 2025-01 | 商品取得、翻訳ステータス確認、翻訳登録 |
| AI翻訳 | Claude API | claude-sonnet-4-20250514 | 商品コンテンツの高品質AI翻訳（BYOKモデル） |
| 認証 | Shopify App Bridge React | ^4.1.6 | Embedded App認証、OAuth管理 |
| セッション管理 | shopify-app-session-storage-prisma | ^8.0.0 | Prismaベースのセッション永続化 |
| ビルドツール | Vite | ^6.2.2 | HMR、本番ビルド |
| ランタイム | Node.js | >=20.19 <22 \|\| >=22.12 | サーバー実行環境 |
| コード品質 | ESLint + Prettier | ^8.42.0 / ^3.2.4 | リンティング・フォーマット |

---

## アーキテクチャ概要

```
┌──────────────────────────────────────────────────────────────────┐
│                    Shopify Admin (埋め込みアプリ)                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Polaris React UI                         │  │
│  │  ダッシュボード  │ 翻訳実行      │ 設定                   │  │
│  │  (商品一覧)       (プレビュー)     (モード切替)            │  │
│  │  (翻訳バッジ)     (保存)           (APIキー)              │  │
│  └───────────────────────┬────────────────────────────────────┘  │
│                          │ Remix loader / action                  │
│  ┌───────────────────────▼────────────────────────────────────┐  │
│  │                     Remix サーバー                          │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │          translation.server.ts (ファサード)          │   │  │
│  │  │              翻訳モード切替                          │   │  │
│  │  │         ┌──────────┴──────────┐                     │   │  │
│  │  │         ▼                     ▼                     │   │  │
│  │  │  mock-translator      claude-translator             │   │  │
│  │  │  .server.ts           .server.ts                    │   │  │
│  │  │  (25行)               (61行)                        │   │  │
│  │  │  [EN]/[JA]付与        Claude API呼び出し            │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  │                                                            │  │
│  │  ┌─────────────────┐  ┌────────────────────────────────┐   │  │
│  │  │ product-fetcher │  │ shopify-locale.server.ts       │   │  │
│  │  │ .server.ts      │  │ (97行)                         │   │  │
│  │  │ (124行)         │  │ ロケール取得                    │   │  │
│  │  │ 商品データ取得   │  │ 翻訳可能コンテンツ取得         │   │  │
│  │  │                 │  │ 翻訳登録ミューテーション        │   │  │
│  │  └────────┬────────┘  └───────────┬────────────────────┘   │  │
│  │           │                       │                        │  │
│  └───────────┼───────────────────────┼────────────────────────┘  │
│              │                       │                           │
└──────────────┼───────────────────────┼───────────────────────────┘
               │                       │
       ┌───────▼───────┐       ┌───────▼───────┐
       │ Shopify       │       │ Shopify       │
       │ GraphQL API   │       │ Translations  │
       │ (商品取得)    │       │ API           │
       └───────────────┘       │ (翻訳登録)    │
                               └───────────────┘
       ┌───────────────┐       ┌───────────────┐
       │ Claude API    │       │ Prisma        │
       │ (AI翻訳)      │       │ + SQLite      │
       │ BYOK          │       │ TranslationJob│
       │               │       │ AppSettings   │
       └───────────────┘       └───────────────┘
```

---

## 主要機能

### 1. 商品ダッシュボード（`app/routes/app._index.tsx` — 73行）
商品一覧をIndexTableで表示。各行にサムネイル、商品タイトル、翻訳済み言語のバッジ（緑: 翻訳済みロケール / 黄: 未翻訳）を表示。チェックボックスで複数商品を選択し、「翻訳する (N件)」ボタンで翻訳実行画面へ遷移。GraphQL APIで最大50商品を取得し、各商品の翻訳ステータスも`translatableResource`クエリで並行取得。

### 2. 翻訳実行ワークフロー（`app/routes/app.translate.tsx` — 297行）
3ステップの翻訳フロー:
1. **言語選択**: `LanguageSelector`でShopifyストアの公開ロケール（主言語以外）から翻訳先言語を選択
2. **プレビュー**: 「翻訳プレビュー」ボタンで各商品×言語の組み合わせに対して翻訳を実行。`TranslationPreview`コンポーネントで原文と翻訳文を左右並べて表示
3. **保存**: 「Shopifyに保存」ボタンで翻訳を`translationsRegister`ミューテーションでShopifyに登録。`TranslationJob`としてPrismaに監査ログを記録

### 3. 翻訳ファサード（`app/services/translation.server.ts` — 26行）
`AppSettings.translationMode`に基づいてモックまたはClaude APIの翻訳バックエンドを切替。ファサードパターンにより、呼び出し側はモードを意識せず統一インターフェースで翻訳を実行可能。

### 4. モック翻訳（`app/services/mock-translator.server.ts` — 25行）
テスト用の翻訳モード。原文にロケールプレフィックス（`[EN]`, `[JA]`）を付与するだけ。API呼び出しなし・課金ゼロで動作確認が可能。

### 5. Claude API翻訳（`app/services/claude-translator.server.ts` — 61行）
Anthropic Messages API（`https://api.anthropic.com/v1/messages`）に商品タイトルと説明文を送信。プロンプトでJSON形式（`translatedTitle` / `translatedBody`）の出力を指示。レスポンスからJSON部分を正規表現で抽出しパース。ユーザーのAPIキー（BYOK）で認証。

### 6. 商品データ取得（`app/services/product-fetcher.server.ts` — 124行）
`fetchProducts()`: GraphQL `products`クエリでページネーション付き（50件/ページ）で商品一覧を取得。各商品の翻訳ステータスを`translatableResource`クエリで確認し、翻訳済みロケールの配列を付与。`fetchProduct()`: 単一商品の詳細データを取得。

### 7. Shopifyロケール・翻訳API操作（`app/services/shopify-locale.server.ts` — 97行）
3つの関数を提供:
- `getShopLocales()`: ストアの公開済み非主言語ロケール一覧を取得
- `getTranslatableContent()`: 翻訳可能コンテンツのキー・値・digest（コンテンツハッシュ）を取得
- `registerTranslations()`: `translationsRegister`ミューテーションでロケール・キー・値・digestを送信し翻訳を登録

### 8. 設定画面（`app/routes/app.settings.tsx` — 168行）
3セクションの設定フォーム:
1. **翻訳モード**: セレクトボックスでモック/Claude API切替。Claude APIモード時のみAPIキー入力フィールドを表示（パスワード型）
2. **デフォルト言語**: カンマ区切りのロケールコード（例: `en,ja`）
3. **保存ボタン**: Prismaの`AppSettings`テーブルにupsert

### 9. 日英UI切替（`app/i18n/` — 3ファイル）
React Context + `useTranslation()` フックによるクライアントサイドi18n。`localStorage`でロケール永続化（デフォルト: 日本語）。56キーの翻訳ファイルで全UIテキストをカバー。`{paramKey}`形式のパラメータ補間対応。

---

## データベース設計

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
│ originalTitle  STRING       │      │  (Claude APIキー, BYOK)  │
│ translatedTitle STRING?     │      │ defaultLocales STRING    │
│ originalBody   STRING       │      │  (CSV: "en,ja")          │
│ translatedBody STRING?      │      └──────────────────────────┘
│ createdAt      DATETIME     │
└─────────────────────────────┘
```

---

## 画面仕様

### ダッシュボード（`/app`）
- 情報バナー: 使い方の案内
- 商品一覧テーブル（IndexTable、複数選択対応）
- 列: サムネイル + 商品名 / 翻訳済み言語バッジ
- バッジ色: 翻訳済み（緑）/ 未翻訳（黄）
- 「翻訳する (N件)」ボタン（選択時のみ有効）

### 翻訳実行（`/app/translate?productId=xxx&productId=yyy`）
- 選択商品リスト表示
- 対象言語チェックボックス（ストアの公開ロケール）
- 「翻訳プレビュー」ボタン → ローディングスピナー → プレビューカード表示
- プレビューカード: 原文（左）/ 翻訳文（右）の2カラム比較
- 「Shopifyに保存」ボタン → 成功/エラーバナー

### 設定（`/app/settings`）
- 翻訳モード選択（モック / Claude API）
- Claude APIキー入力（claude-apiモード時のみ表示、パスワード型）
- デフォルト言語設定（カンマ区切り）
- 保存ボタン

---

## APIエンドポイント

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | `/app` | Shopify Admin | ダッシュボード（商品一覧 + 翻訳ステータス） |
| GET | `/app/translate` | Shopify Admin | 翻訳実行画面（選択商品 + 利用可能ロケール取得） |
| POST | `/app/translate` | Shopify Admin | 翻訳プレビュー生成 / Shopifyへの翻訳保存 |
| GET | `/app/settings` | Shopify Admin | 設定フォーム表示 |
| POST | `/app/settings` | Shopify Admin | 設定保存（upsert） |
| POST | `/webhooks/app/uninstalled` | Shopify署名 | アプリアンインストールWebhook |
| POST | `/webhooks/app/scopes_update` | Shopify署名 | スコープ更新Webhook |

---

## GraphQLオペレーション

| 種別 | オペレーション | 用途 |
|------|-------------|------|
| Query | `products(first, after)` | 商品一覧のページネーション取得 |
| Query | `product(id)` | 単一商品の詳細取得 |
| Query | `translatableResource(resourceId).translations` | 商品の翻訳済みロケール確認 |
| Query | `translatableResource(resourceId).translatableContent` | 翻訳可能コンテンツ（key, value, digest）の取得 |
| Query | `shopLocales` | ストアの公開ロケール一覧取得 |
| Mutation | `translationsRegister(resourceId, translations)` | 翻訳コンテンツの登録 |

---

## プロジェクト構成

```
translate-flow/                           55ファイル（node_modules/build除く）
├── app/                                  TypeScript/TSX 26ファイル (1,613行)
│   ├── routes/
│   │   ├── app.tsx                 66行  レイアウトラッパー（認証・AppBridge初期化）
│   │   ├── app._index.tsx          73行  ダッシュボード（商品一覧・翻訳ステータス）
│   │   ├── app.translate.tsx      297行  翻訳実行（プレビュー・保存ワークフロー）
│   │   ├── app.settings.tsx       168行  設定（翻訳モード・APIキー・言語）
│   │   ├── _index/
│   │   │   └── route.tsx           58行  ランディングページ
│   │   ├── auth.login/
│   │   │   ├── route.tsx           68行  ログインフォーム
│   │   │   └── error.server.tsx    16行  ログインエラー処理
│   │   ├── auth.$.tsx               8行  OAuthコールバック
│   │   ├── webhooks.app.uninstalled.tsx    17行  アンインストールWebhook
│   │   └── webhooks.app.scopes_update.tsx  21行  スコープ更新Webhook
│   ├── services/
│   │   ├── translation.server.ts      26行  翻訳ファサード（モード切替）
│   │   ├── mock-translator.server.ts  25行  モック翻訳（プレフィックス付与）
│   │   ├── claude-translator.server.ts 61行  Claude API翻訳
│   │   ├── product-fetcher.server.ts 124行  商品データ取得（GraphQL）
│   │   └── shopify-locale.server.ts   97行  ロケール・翻訳API操作
│   ├── components/
│   │   ├── ProductTranslationList.tsx 102行  商品一覧テーブル（翻訳バッジ付き）
│   │   ├── TranslationPreview.tsx     90行  翻訳前後の2カラム比較
│   │   ├── LanguageSelector.tsx       40行  対象言語チェックボックス
│   │   └── LanguageToggle.tsx         32行  日英UI切替ボタン
│   ├── i18n/
│   │   ├── i18nContext.tsx            81行  i18n Provider + フック
│   │   ├── en.json                    56行  英語翻訳（56キー）
│   │   └── ja.json                    56行  日本語翻訳（56キー）
│   ├── shopify.server.ts              35行  Shopifyアプリ設定
│   ├── db.server.ts                   15行  Prismaクライアント初期化
│   ├── root.tsx                       30行  HTMLドキュメントルート
│   └── entry.server.tsx               59行  SSRハンドラー（ストリーミング対応）
├── prisma/
│   ├── schema.prisma                  55行  データベーススキーマ（3モデル）
│   └── migrations/                         マイグレーション
├── package.json                       78行  依存関係定義
├── vite.config.ts                     74行  Viteビルド設定
├── tsconfig.json                      20行  TypeScript設定
├── shopify.app.toml                        Shopifyアプリ設定（Webhook定義含む）
├── shopify.web.toml                        Web設定
├── Dockerfile                         21行  本番デプロイ用（node:18-alpine）
└── CLAUDE.md                         127行  プロジェクト仕様
```

---

## セットアップ

### 前提条件

- [Node.js](https://nodejs.org/) >=20.19 <22 または >=22.12
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- Shopify開発ストア（複数ロケール有効化済み）
- （任意）Claude APIキー（AI翻訳モード使用時）

### 手順

```bash
# リポジトリのクローン
git clone https://github.com/mer-prog/translate-flow.git
cd translate-flow

# 依存関係のインストール
npm install

# データベースのセットアップ
npx prisma migrate dev

# 開発サーバーの起動
shopify app dev

# 本番デプロイ
shopify app deploy
```

### 環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `SHOPIFY_API_KEY` | ShopifyアプリのAPIキー | はい |
| `SHOPIFY_API_SECRET` | Shopifyアプリのシークレットキー | はい |
| `SHOPIFY_APP_URL` | アプリの公開HTTPS URL | はい |
| `SCOPES` | APIスコープ（`read_products,write_translations,read_locales`） | はい |
| `SHOP_CUSTOM_DOMAIN` | カスタムショップドメイン | いいえ |
| `PORT` | サーバーポート（デフォルト: 3000） | いいえ |
| `FRONTEND_PORT` | HMRポート（デフォルト: 8002） | いいえ |

※ Claude APIキーは環境変数ではなく、アプリ内設定画面でショップごとに管理（`AppSettings`テーブルに保存）

---

## 設計判断の根拠

| 判断 | 根拠 |
|------|------|
| ファサードパターンによる翻訳モード切替 | モック（テスト）とClaude API（本番）を統一インターフェースで切替。新しい翻訳バックエンド追加時もファサードへの追加のみで対応可能 |
| BYOK（Bring Your Own Key）モデル | ユーザーが自身のClaude APIキーを設定。アプリ側でAPI費用を負担せず、利用量に応じた透明な従量課金を実現 |
| モック翻訳モード | `[EN]`/`[JA]`プレフィックスを付与するだけのゼロコスト翻訳。開発・デモ・テスト時にAPI課金なしで全ワークフローを確認可能 |
| Shopify Translations API直接保存 | 独自の翻訳データベースを持たず、Shopifyネイティブの多言語機能に直接書き込み。ストアの言語切替機能と即座に連携 |
| digestベースの翻訳登録 | Shopify APIの`translatableContentDigest`を取得してからミューテーションを実行。コンテンツの整合性を保証 |
| プレビュー→保存の2ステップ | 翻訳結果を保存前に確認できるUX。AI翻訳の品質を目視確認してから本番反映 |
| TranslationJobによる監査ログ | 翻訳の実行履歴（原文・翻訳文・ステータス）をPrismaに記録。トラブルシューティングと翻訳品質の振り返りに活用 |
| SQLite + Prisma | MVP段階で十分な性能。マイグレーション管理が容易で、本番移行時はPrismaのアダプタ変更のみ |

---

## 運用コスト

| サービス | プラン | 月額 |
|----------|--------|------|
| Shopify | 開発ストア（Dev Store） | 無料 |
| モック翻訳モード | 課金なし | $0 |
| Claude API（AI翻訳モード） | ユーザーのAPIキーで従量課金 | ユーザー負担 |
| ホスティング（Docker） | 要選定（Heroku / AWS / Fly.io等） | 環境依存 |
| **合計（開発環境・モックモード）** | | **$0** |

---

## 作者

[@mer-prog](https://github.com/mer-prog)
