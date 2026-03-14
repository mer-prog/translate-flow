# TranslateFlow — 商品コンテンツAI翻訳アプリ

## プロジェクト概要

Upworkポートフォリオ用のShopify Embedded App。
商品タイトル・説明文をAIで一括翻訳し、Shopifyの多言語機能（Translations API）に保存。
テスト段階はモック翻訳で課金ゼロ。

**ターゲット:** 越境ECを始めたい中小マーチャント
**Dev Store:** ryo-dev-plus（Shopify Plus Dev Store）

## 技術スタック

- Remix（Shopify App Template）
- TypeScript
- Prisma + SQLite
- Polaris React
- GraphQL Admin API（Translations API）
- Shopify App Bridge

## 必要なAPIスコープ

read_products, write_translations, read_locales

## ディレクトリ構成

translate-flow/
├── CLAUDE.md
├── app/
│   ├── routes/
│   │   ├── app._index.tsx          # 商品一覧と翻訳状況ダッシュボード
│   │   ├── app.translate.tsx       # 翻訳実行画面
│   │   └── app.settings.tsx        # 設定（APIキー、対象言語）
│   ├── services/
│   │   ├── translation.server.ts     # 翻訳ロジック（モード切替ファサード）
│   │   ├── mock-translator.server.ts # モック翻訳（API課金なし）
│   │   ├── claude-translator.server.ts # Claude API翻訳（本番用）
│   │   ├── shopify-locale.server.ts  # Shopify Translations API操作
│   │   └── product-fetcher.server.ts # 商品データ取得
│   ├── components/
│   │   ├── ProductTranslationList.tsx  # 商品×言語のマトリクス表示
│   │   ├── TranslationPreview.tsx      # 翻訳前後の比較プレビュー
│   │   └── LanguageSelector.tsx        # 対象言語チェックボックス
│   └── shopify.server.ts
├── prisma/
│   └── schema.prisma
├── shopify.app.toml
└── package.json

## 画面構成

### ダッシュボード（app._index.tsx）
- 商品一覧（タイトル、翻訳済み言語のバッジ表示）
- チェックボックスで複数商品を選択
- 「翻訳する」ボタン

### 翻訳実行（app.translate.tsx）
- 対象言語を選択（日/英）
- 翻訳プレビュー（原文と翻訳文の比較表示）
- 「保存」でShopify Translations APIに書き込み

### 設定（app.settings.tsx）
- 翻訳モード切替: モック（テスト用・無料）/ Claude API（本番用）
- Claude APIキー入力（claude-apiモード時のみ）
- デフォルト対象言語の設定

## 翻訳サービス設計

ファサードパターンでモード切替:
- mockモード: [EN], [JA] プレフィックスを付けるだけ。課金なし
- claude-apiモード: Claude APIで翻訳。ユーザーのAPIキーで従量課金

## Prismaスキーマ（追加分）

model TranslationJob {
  id             String   @id @default(cuid())
  shop           String
  productId      String
  targetLocale   String
  status         String   @default("pending")
  originalTitle    String
  translatedTitle  String?
  originalBody     String
  translatedBody   String?
  createdAt      DateTime @default(now())
}

model AppSettings {
  id              String   @id @default(cuid())
  shop            String   @unique
  translationMode String   @default("mock")
  apiKey          String?
  defaultLocales  String   @default("en,ja")
}

## コーディング規約

- TypeScript strict mode
- Polaris Reactコンポーネント使用
- サービスロジックは *.server.ts に分離
- Conventional Commits形式

## MVPスコープ

含む:
- 商品選択 -> 翻訳 -> プレビュー -> Shopify保存
- モック翻訳モード（課金ゼロ）
- Claude APIモード（設定画面で切替）
- 日本語と英語の2言語
- 設定画面でモード切替とAPIキー管理

含まない（来週以降）:
- 中国語・韓国語対応
- 新商品追加時の自動翻訳
- 翻訳メモリ

## コスト

- モックモード: 完全無料
- claude-apiモード: ユーザーのAPIキーで従量課金
- テスト段階は課金ゼロ

## 開発コマンド

shopify app dev
shopify app deploy
