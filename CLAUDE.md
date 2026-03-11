# TechInterviewPrep

## プロジェクト概要

- 技術面接準備アプリ（北米SWE職向け）
- JavaScript/TypeScript, React/Frontend に特化
- クイズ4種（選択式、コードリーディング、True/False、口頭説明）+ FSRS間隔反復

## 技術スタック

- Next.js 14 (App Router) / TypeScript / Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS)
- AI: Claude API (問題生成・分析), Grok API (口頭説明フィードバック), Whisper API (音声→テキスト)
- ts-fsrs (間隔反復), TanStack Query (サーバー状態), Recharts (グラフ)
- パッケージマネージャ: pnpm
- デプロイ: Vercel

## 開発コマンド

```bash
pnpm install    # 依存関係インストール
pnpm dev        # ローカル開発サーバー (http://localhost:3000)
pnpm build      # プロダクションビルド
```

## ディレクトリ構成規約（実装時）

- `components/` → ドメイン別グループ (layout, quiz, explain, dashboard, admin, common)
- `hooks/` → カスタムフック, `hooks/queries/` → TanStack Query フック
- `app/api/` → Route Handlers (`ai/`, `admin/`)
- `types/index.ts` → 型定義一元管理
- `lib/prompts/` → AIプロンプトテンプレート

## 設計方針

- バイリンガル: DB列は `*_ja` / `*_en` サフィックス、言語設定は localStorage
- データアクセス: 公開データ → Supabase直接 (anon key), AI/管理 → Route Handler (service_role key)
- 認証: Supabase Auth (Google OAuth + email/password)
- 論理削除: `deleted_at` タイムスタンプ
- 進捗管理: `progress(user_id, question_id)` ユニーク制約でupsert
- AIフィードバックはDB保存しない（表示のみ）

## コーディング規約

- TypeScript strict mode
- Server Components 優先、必要時のみ `"use client"`
- コンポーネントは関数コンポーネント + アロー関数
- DB列名とTypeScript型の対応を `types/index.ts` で管理

## 環境変数

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase接続
- `SUPABASE_SERVICE_ROLE_KEY` — 管理者・AI用サーバーサイドキー
- `ANTHROPIC_API_KEY` — Claude API
- `XAI_API_KEY` — Grok API
- `OPENAI_API_KEY` — Whisper API
- `ADMIN_EMAIL` — 管理者メールアドレス

## 設計ドキュメント

- `TechInterviewPrep_spec.md` → アプリ仕様書
- `docs/database-design.md` → DB設計・ER図・マイグレーション
- `docs/api-design.md` → API設計・データアクセスパターン
- `docs/frontend-design.md` → フロントエンド設計・コンポーネント構成
- `docs/type-definitions.md` → TypeScript型定義
- `docs/ai-prompts.md` → AIプロンプトテンプレート
- `docs/setup-and-deployment.md` → 環境構築・デプロイ手順
