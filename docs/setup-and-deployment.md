# TechInterviewPrep — セットアップ & デプロイガイド

> Next.js (App Router) + Supabase + Vercel | 2026年3月

---

## 1. 前提条件

以下のツールがインストールされていることを確認してください。

| ツール | バージョン | 確認コマンド |
|---|---|---|
| Node.js | >= 20 | `node -v` |
| pnpm | >= 9 | `pnpm -v` |
| Supabase CLI | 最新版 | `supabase --version` |
| Git | 最新版 | `git --version` |

**インストール（未導入の場合）:**

```bash
# Node.js（nvm 推奨）
nvm install 20
nvm use 20

# pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Supabase CLI
brew install supabase/tap/supabase
```

---

## 2. 環境変数一覧

プロジェクトルートに `.env.local` を作成し、以下の環境変数を設定します。

```bash
# ==============================================================
# .env.local — TechInterviewPrep 環境変数テンプレート
# ==============================================================

# --------------------------------------------------------------
# NEXT_PUBLIC_* — ブラウザに公開される変数（クライアントサイドで使用可）
# --------------------------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# --------------------------------------------------------------
# Server-only — サーバーサイド（Route Handlers）でのみ使用
# ブラウザには公開されません。絶対に NEXT_PUBLIC_ を付けないこと。
# --------------------------------------------------------------

# Supabase service_role キー（RLS をバイパスする管理者操作用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Anthropic Claude API（問題生成・コンテンツ分析）
ANTHROPIC_API_KEY=sk-ant-...

# xAI Grok API（口頭説明フィードバック・AIチャット）
XAI_API_KEY=xai-...

# OpenAI Whisper API（音声入力の文字起こし）
OPENAI_API_KEY=sk-...

# 管理者メールアドレス（middleware でのアクセス制御に使用）
ADMIN_EMAIL=admin@example.com
```

> **注意**: `.env.local` は `.gitignore` に含め、絶対にリポジトリにコミットしないでください。

| 変数名 | 用途 | 使用箇所 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | クライアント / サーバー |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー（RLS 適用） | クライアント / サーバー |
| `SUPABASE_SERVICE_ROLE_KEY` | RLS バイパス用キー | Route Handlers（管理者操作） |
| `ANTHROPIC_API_KEY` | Claude API キー | Route Handlers（問題生成） |
| `XAI_API_KEY` | Grok API キー | Route Handlers（フィードバック・チャット） |
| `OPENAI_API_KEY` | Whisper API キー | Route Handlers（音声文字起こし） |
| `ADMIN_EMAIL` | 管理者メールアドレス | middleware（`/admin` ルート保護） |

---

## 3. Supabase セットアップ

### 3-1. プロジェクト作成

1. [supabase.com](https://supabase.com) にアクセスし、アカウントを作成
2. 「New Project」からプロジェクトを作成
   - **Organization**: 任意
   - **Project name**: `techinterviewprep`（任意）
   - **Database Password**: 安全なパスワードを設定（控えておく）
   - **Region**: `Northeast Asia (Tokyo)` 推奨
3. プロジェクト作成完了後、以下をメモ:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

   > これらは **Settings > API** ページで確認できます。

### 3-2. マイグレーション実行

Supabase ダッシュボードの **SQL Editor** を開き、DB設計書（`docs/database-design.md`）セクション6の SQL マイグレーションを実行します。

以下が作成されます:
- テーブル: `users`, `categories`, `topics`, `questions`, `progress`, `bookmarks`
- インデックス: トピック別・復習日別などのパフォーマンス最適化インデックス
- RLS ポリシー: テーブルごとのアクセス制御
- トリガー: Auth ユーザー作成時の `users` テーブル自動挿入

### 3-3. シードデータ投入

同じく SQL Editor で、DB設計書セクション7のシードデータ SQL を実行します。

以下が投入されます:
- カテゴリ 2件: `JavaScript / TypeScript`, `React / フロントエンド`
- トピック 14件: 仕様書セクション8の優先トピック一覧

### 3-4. Google OAuth プロバイダの有効化

1. Supabase ダッシュボードの **Authentication > Providers** を開く
2. **Google** を有効化
3. Google Cloud Console で取得した **Client ID** と **Client Secret** を入力（詳細はセクション4を参照）

### 3-5. 管理者アカウント作成

1. Supabase ダッシュボードの **Authentication > Users** を開く
2. **Add User > Create New User** を選択
3. 管理者のメールアドレスとパスワードを入力（**Auto Confirm User** をONに）
4. 作成したメールアドレスを `.env.local` の `ADMIN_EMAIL` に設定

---

## 4. Google OAuth 設定

### 4-1. Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成（または既存プロジェクトを選択）
3. **APIs & Services > OAuth consent screen** を開く
   - User Type: **External**
   - アプリ名: `TechInterviewPrep`
   - サポートメール: 自分のメールアドレス
   - 承認済みドメイン: `supabase.co`
   - 必要な情報を入力して保存

### 4-2. OAuth クライアント ID の作成

1. **APIs & Services > Credentials** を開く
2. **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Name: `TechInterviewPrep`（任意）
5. **Authorized redirect URIs** に以下を追加:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

> `<your-project-ref>` は Supabase プロジェクトの Project URL から取得できます（例: `abcdefghijklmnop`）。

6. **Create** をクリック
7. 表示された **Client ID** と **Client Secret** をコピー

### 4-3. Supabase への登録

1. Supabase ダッシュボードの **Authentication > Providers > Google** を開く
2. **Client ID** と **Client Secret** を貼り付け
3. **Save** をクリック

---

## 5. ローカル開発

### 5-1. 依存パッケージのインストール

```bash
pnpm install
```

**主要な依存パッケージ:**

| パッケージ | 用途 |
|---|---|
| `next`, `react`, `react-dom` | フレームワーク |
| `@supabase/ssr`, `@supabase/supabase-js` | Supabase クライアント |
| `@tanstack/react-query` | サーバー状態管理（データフェッチ・キャッシュ） |
| `@anthropic-ai/sdk` | Claude API（問題分析・生成） |
| `openai` | Grok API（フィードバック・チャット）、Whisper API（文字起こし） |
| `zod` | スキーマバリデーション（リクエスト・AI出力） |
| `ts-fsrs` | FSRS 間隔反復アルゴリズム |
| `recharts` | ダッシュボードのグラフ |
| `tailwindcss` | スタイリング |

### 5-2. 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて動作確認します。

Next.js の Hot Module Replacement (HMR) が有効なため、ファイルを編集すると自動的にブラウザに反映されます。

### 5-3. Supabase ローカル開発（オプション）

Supabase CLI を使うと、ローカル環境で Supabase を起動できます。クラウドの Supabase プロジェクトに接続せずに開発・テストが可能です。

```bash
# Supabase ローカル環境を初期化（初回のみ）
supabase init

# ローカル Supabase を起動（Docker が必要）
supabase start
```

起動後に表示される `API URL` と `anon key` を `.env.local` に設定します。

```bash
# ローカル開発用の環境変数（supabase start の出力を参照）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...(ローカル用のキー)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...(ローカル用のキー)
```

ローカル Supabase を停止するには:

```bash
supabase stop
```

### 5-4. ダークモード

アプリケーションはダークモードに対応しています。Tailwind CSS の `dark:` バリアントを使用してスタイリングを行います。ユーザーのシステム設定に応じて自動的に切り替わります。

---

## 6. Vercel デプロイ

### 6-1. GitHub リポジトリの接続

1. [vercel.com](https://vercel.com) にログイン
2. **Add New > Project** を選択
3. GitHub リポジトリ `techinterviewprep` をインポート

### 6-2. ビルド設定

| 項目 | 値 |
|---|---|
| Framework Preset | Next.js |
| Build Command | `pnpm build` |
| Output Directory | `.next` |
| Install Command | `pnpm install` |

### 6-3. 環境変数の設定

Vercel ダッシュボードの **Settings > Environment Variables** で、セクション2の環境変数をすべて設定します。

| 変数名 | 設定先 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production / Preview / Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production / Preview / Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production のみ推奨 |
| `ANTHROPIC_API_KEY` | Production のみ推奨 |
| `XAI_API_KEY` | Production のみ推奨 |
| `OPENAI_API_KEY` | Production のみ推奨 |
| `ADMIN_EMAIL` | Production / Preview |

### 6-4. Route Handler のタイムアウト設定

AI エンドポイント（問題生成、フィードバック、音声文字起こし）は処理に時間がかかる場合があります。

| プラン | デフォルトタイムアウト | 対応策 |
|---|---|---|
| **Pro プラン** | 最大 60s に設定可能 | `vercel.json` でタイムアウトを延長 |
| **Hobby プラン** | 10s（変更不可） | AI レスポンスにストリーミングを使用して対応 |

Pro プランの場合、`vercel.json` で特定の Route Handler のタイムアウトを延長できます:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

> **Hobby プランの注意**: 10秒の制限があるため、Claude API による問題生成など時間のかかる処理はストリーミングレスポンスの実装を検討してください。

### 6-5. Google OAuth リダイレクト URI の更新

本番環境にデプロイした場合、Google Cloud Console の Authorized redirect URIs に本番用の Supabase コールバック URL が設定されていることを確認してください（セクション4-2で設定済みの URL）。

### 6-6. デプロイの実行

GitHub の `main` ブランチにプッシュすると、Vercel が自動的にビルド・デプロイを実行します。

```bash
git push origin main
```

---

## 7. デプロイ後チェックリスト

本番環境へのデプロイ後、以下の項目を確認してください。

### 認証

- [ ] Google OAuth でログインできる（リダイレクトが正常に動作する）
- [ ] ログイン後、`users` テーブルにレコードが自動作成される
- [ ] ログアウトが正常に動作する
- [ ] 管理者アカウント（メール+パスワード）で `/admin` にログインできる
- [ ] 未認証状態で `/admin` にアクセスするとログイン画面にリダイレクトされる

### クイズモード

- [ ] トピック一覧が表示される（`/`）
- [ ] クイズモードで問題が正しく読み込まれる（`/quiz/[topicId]`）
- [ ] 問題数の選択（5 / 10 / 15 / 20 / All）が動作する
- [ ] 回答後に正解・不正解のフィードバックが表示される
- [ ] 解説が日本語・英語で正しく切り替わる
- [ ] セッション結果がインラインで表示される
- [ ] ゲスト利用（未ログイン）でもクイズが利用できる

### 口頭説明モード

- [ ] 口頭説明モードで問題が読み込まれる（`/explain/[topicId]`）
- [ ] テキスト入力で回答を送信できる
- [ ] AI フィードバック（Grok API）が正常に返される
- [ ] ルーブリックに基づく1-4の評価が表示される

### 進捗管理

- [ ] ログインユーザーの進捗が `progress` テーブルに保存される
- [ ] FSRS スケジューリングが正しく動作し、`due_date` が更新される
- [ ] ダッシュボード（`/dashboard`）にトピック別正答率が表示される
- [ ] 今日の復習対象問題が正しく表示される
- [ ] ブックマーク機能が動作する（追加・削除）

### 管理者機能

- [ ] 問題生成フロー（Step 1: AI分析 → Step 2: 問題生成）が動作する
- [ ] 生成された問題のプレビュー・編集・削除ができる
- [ ] 問題を Supabase に保存できる
- [ ] 問題管理画面（`/admin/questions`）で問題の一覧・編集・削除ができる

### パフォーマンス・その他

- [ ] ダークモードが正常に切り替わる
- [ ] Recharts による進捗グラフが表示される
- [ ] AI チャット質問機能が動作する（Grok API）
- [ ] 音声入力（Whisper API）が動作する（マイク許可が必要）
- [ ] モバイル表示でレイアウトが崩れない
