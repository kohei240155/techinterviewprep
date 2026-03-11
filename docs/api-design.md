# TechInterviewPrep API設計書

> Next.js App Router + Supabase | 仕様書 v1.2 準拠 | 2026年3月

---

## 1. アーキテクチャ概要

TechInterviewPrep のデータアクセスは、**Supabase クライアント直接アクセス**と **Next.js Route Handler** の2系統に分かれる。判定基準は以下のとおり。

| 判定基準 | Supabase クライアント直接 | Next.js Route Handler |
|---|---|---|
| **APIキーの秘匿** | 不要（anon key で十分） | 必要（AI API キー、service_role キー） |
| **RLS** | RLS で保護される | service_role で RLS バイパス |
| **処理の性質** | 単純な CRUD | AI推論・外部API呼び出し |

### 使い分けマトリクス

| 操作 | 方式 | 理由 |
|---|---|---|
| カテゴリ・トピック・問題の取得 | Supabase 直接（ブラウザ） | 公開データ、RLS で `SELECT` 許可済み |
| 進捗の読み書き | Supabase 直接（ブラウザ） | RLS で本人のみに制限 |
| ブックマークの読み書き | Supabase 直接（ブラウザ） | RLS で本人のみに制限 |
| AI 分析・問題生成 | Route Handler | Anthropic API キーの秘匿が必要 |
| AI フィードバック・チャット | Route Handler | xAI API キーの秘匿が必要 |
| 音声文字起こし | Route Handler | OpenAI API キーの秘匿が必要 |
| 管理者の問題保存・編集・削除 | Route Handler | service_role キーで RLS バイパスが必要 |

---

## 2. Supabaseクライアント構成

3つのクライアントファイルを用途別に作成する。

### 2-1. `lib/supabase/client.ts` — ブラウザクライアント

Client Component から使用する。anon key を使用し、RLS が適用される。

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 2-2. `lib/supabase/server.ts` — サーバークライアント

Server Component および Route Handler から使用する。Cookie 経由でセッションを取得し、RLS が適用される。

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 2-3. `lib/supabase/admin.ts` — 管理者クライアント（service_role）

管理者の Route Handler 専用。service_role キーを使用し、RLS を完全バイパスする。**サーバーサイドでのみ使用すること。**

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const adminClient = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

> **注意**: `SUPABASE_SERVICE_ROLE_KEY` は `NEXT_PUBLIC_` プレフィックスを付けない。ブラウザに露出させてはならない。

---

## 3. AIルートハンドラ

### 3-1. `POST /api/ai/analyze` — コンテンツ分析

Claude API（Anthropic）を使用して、問題生成の計画を作成する。

| 項目 | 内容 |
|---|---|
| **メソッド** | `POST` |
| **パス** | `/api/ai/analyze` |
| **認証** | 管理者のみ（セッション + メールアドレス検証） |
| **AI プロバイダ** | Claude（Anthropic） |
| **トークン目安** | 入力 ~4,000 / 出力 ~1,000 |

#### リクエスト

```typescript
interface AnalyzeRequest {
  topicId: string                // 対象トピックの UUID
  content?: string               // 貼り付けたテキスト（省略時はトピック指定モード）
}
```

#### レスポンス（200）

```typescript
interface AnalysisPlan {
  topic_summary: string          // コンテンツまたはトピックの要約
  interview_relevance: 'high' | 'medium' | 'low'
  interview_relevance_reason: string
  questions: Array<{
    type: 'multiple' | 'code' | 'truefalse' | 'explain'
    difficulty: 'easy' | 'medium' | 'hard'
    count: number
    rationale: string
  }>
  total_count: number
  notes: string
}
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 未認証 |
| 403 | `FORBIDDEN` | 管理者でない |
| 404 | `TOPIC_NOT_FOUND` | 指定した topicId が存在しない |
| 500 | `AI_ERROR` | Claude API の呼び出しに失敗 |

#### 実装メモ

- トピック情報（`name_ja`, `name_en`, カテゴリ名）を DB から取得してプロンプトに含める
- 既存問題リスト（同トピック）を取得し、重複回避のためプロンプトに含める
- `content` が省略された場合はトピック指定モードのプロンプトを使用する
- **構造化出力**: Anthropic SDK の `zodOutputFormat` + `messages.parse()` を使用（詳細は `ai-prompts.md` セクション3）

---

### 3-2. `POST /api/ai/generate` — 問題生成

Claude API（Anthropic）を使用して、分析計画に基づき問題を生成する。

| 項目 | 内容 |
|---|---|
| **メソッド** | `POST` |
| **パス** | `/api/ai/generate` |
| **認証** | 管理者のみ |
| **AI プロバイダ** | Claude（Anthropic） |
| **トークン目安** | 入力 ~8,000 / 出力 ~4,000 |

#### リクエスト

```typescript
interface GenerateRequest {
  topicId: string
  plan: AnalysisPlan              // Step 1 の出力（管理者が編集済みの可能性あり）
  content?: string                // 元のテキスト（テキスト投入モードの場合）
}
```

#### レスポンス（200）

```typescript
interface GeneratedQuestions {
  questions: Array<{
    type: 'multiple' | 'code' | 'truefalse' | 'explain'
    difficulty: 'easy' | 'medium' | 'hard'
    question_ja: string
    question_en: string
    options: OptionItem[] | RubricObject | null  // タイプにより異なる
    answer: AnswerData
    explanation_ja: string
    explanation_en: string
  }>
}

// multiple / code の選択肢
interface OptionItem {
  label: string                   // "A" | "B" | "C" | "D"
  text_ja: string
  text_en: string
}

// explain のルーブリック
interface RubricObject {
  rubric_ja: { '1': string; '2': string; '3': string; '4': string }
  rubric_en: { '1': string; '2': string; '3': string; '4': string }
}

// 正解データ
type AnswerData =
  | { correct_index: number }                        // multiple / code
  | { correct_value: boolean }                       // truefalse
  | { model_answer_ja: string; model_answer_en: string }  // explain
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 未認証 |
| 403 | `FORBIDDEN` | 管理者でない |
| 400 | `INVALID_PLAN` | plan の構造が不正 |
| 500 | `AI_ERROR` | Claude API の呼び出しに失敗 |

#### 実装メモ

- 既存問題リストをプロンプトに含め、意味的な重複を回避する
- 生成結果に重複チェック結果（類似問題の警告）を付与する
- **構造化出力**: Anthropic SDK の `zodOutputFormat` + `messages.parse()` を使用（詳細は `ai-prompts.md` セクション3）

---

### 3-3. `POST /api/ai/feedback` — 口頭説明フィードバック

Grok API（xAI）を使用して、口頭説明の回答をルーブリックに基づき評価する。

| 項目 | 内容 |
|---|---|
| **メソッド** | `POST` |
| **パス** | `/api/ai/feedback` |
| **認証** | 不要（ゲスト利用可） |
| **AI プロバイダ** | Grok（xAI） |

#### リクエスト

```typescript
interface FeedbackRequest {
  questionId: string              // 対象問題の UUID
  userAnswer: string              // ユーザーの回答テキスト
  language: 'ja' | 'en'          // フィードバック言語
}
```

#### レスポンス（200）

```typescript
interface FeedbackResponse {
  rating: 1 | 2 | 3 | 4          // ルーブリックに基づく理解度評価
  feedback: string                // 評価コメント（指定言語で記述）
}
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | リクエストボディの構造が不正 |
| 404 | `QUESTION_NOT_FOUND` | 指定した questionId が存在しない |
| 500 | `AI_ERROR` | Grok API の呼び出しに失敗 |

#### 実装メモ

- DB から対象問題を取得し、`options`（ルーブリック）と `answer`（模範解答）をプロンプトに含める
- `language` に応じて `rubric_ja` / `rubric_en` および `model_answer_ja` / `model_answer_en` を選択する
- フィードバックは DB に保存しない（セッション中のみ表示）
- **構造化出力**: OpenAI SDK の `zodResponseFormat` + `chat.completions.parse()` を使用（Grok は OpenAI 互換API。詳細は `ai-prompts.md` セクション3）

---

### 3-4. `POST /api/ai/chat` — トピックチャット

Grok API（xAI）を使用して、学習中のトピックについてユーザーの質問に回答する。

| 項目 | 内容 |
|---|---|
| **メソッド** | `POST` |
| **パス** | `/api/ai/chat` |
| **認証** | 不要（ゲスト利用可） |
| **AI プロバイダ** | Grok（xAI） |

#### リクエスト

```typescript
interface ChatRequest {
  topicId: string                 // 現在のトピック UUID
  messages: ChatMessage[]         // チャット履歴
  language: 'ja' | 'en'          // 回答言語
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
```

#### レスポンス（200）

```typescript
interface ChatResponse {
  reply: string                   // AI の回答テキスト
}
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | リクエストボディの構造が不正 |
| 404 | `TOPIC_NOT_FOUND` | 指定した topicId が存在しない |
| 500 | `AI_ERROR` | Grok API の呼び出しに失敗 |

#### 実装メモ

- DB からトピック情報（`name_ja`, `name_en`）を取得し、システムプロンプトに含める
- チャット履歴は DB に保存しない（セッション中のみ保持）
- `messages` 配列の長さに上限を設けることを推奨（例: 最新20件）

---

### 3-5. `POST /api/ai/transcribe` — 音声文字起こし

Whisper API（OpenAI）を使用して、音声ファイルをテキストに変換する。

| 項目 | 内容 |
|---|---|
| **メソッド** | `POST` |
| **パス** | `/api/ai/transcribe` |
| **認証** | 不要（ゲスト利用可） |
| **AI プロバイダ** | Whisper（OpenAI） |

#### リクエスト

`Content-Type: multipart/form-data`

| フィールド | 型 | 説明 |
|---|---|---|
| `audio` | `File` | 音声ファイル（webm / mp4） |

#### レスポンス（200）

```typescript
interface TranscribeResponse {
  text: string                    // 文字起こし結果
}
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 400 | `NO_AUDIO_FILE` | 音声ファイルが添付されていない |
| 400 | `INVALID_FORMAT` | 対応していない音声フォーマット |
| 500 | `AI_ERROR` | Whisper API の呼び出しに失敗 |

---

## 4. 管理者ルートハンドラ

管理者エンドポイントはすべて `service_role` クライアント（`lib/supabase/admin.ts`）を使用し、RLS をバイパスする。

### 4-1. `POST /api/admin/questions` — 問題一括保存

AI が生成した問題をまとめて DB に保存する。

| 項目 | 内容 |
|---|---|
| **メソッド** | `POST` |
| **パス** | `/api/admin/questions` |
| **認証** | 管理者のみ |
| **DB クライアント** | `adminClient`（service_role） |

#### リクエスト

```typescript
interface BulkSaveRequest {
  topicId: string
  questions: Array<{
    type: 'multiple' | 'code' | 'truefalse' | 'explain'
    difficulty: 'easy' | 'medium' | 'hard'
    question_ja: string
    question_en: string
    options: OptionItem[] | RubricObject | null
    answer: AnswerData
    explanation_ja: string
    explanation_en: string
  }>
}
```

#### レスポンス（200）

```typescript
interface BulkSaveResponse {
  saved: number                   // 保存した問題数
  ids: string[]                   // 保存した問題の UUID 配列
}
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 未認証 |
| 403 | `FORBIDDEN` | 管理者でない |
| 400 | `VALIDATION_ERROR` | リクエストボディの構造が不正 |
| 500 | `DB_ERROR` | DB への保存に失敗 |

---

### 4-2. `PUT /api/admin/questions/[id]` — 問題更新

個別の問題を編集する。

| 項目 | 内容 |
|---|---|
| **メソッド** | `PUT` |
| **パス** | `/api/admin/questions/[id]` |
| **認証** | 管理者のみ |
| **DB クライアント** | `adminClient`（service_role） |

#### リクエスト

```typescript
// Partial<Question> — 更新するフィールドのみ指定
interface UpdateQuestionRequest {
  question_ja?: string
  question_en?: string
  type?: 'multiple' | 'code' | 'truefalse' | 'explain'
  difficulty?: 'easy' | 'medium' | 'hard'
  options?: OptionItem[] | RubricObject | null
  answer?: AnswerData
  explanation_ja?: string
  explanation_en?: string
}
```

#### レスポンス（200）

```typescript
// 更新後の完全な Question オブジェクト
interface Question {
  id: string
  topic_id: string
  type: string
  difficulty: string
  question_ja: string
  question_en: string
  options: any
  answer: any
  explanation_ja: string
  explanation_en: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 未認証 |
| 403 | `FORBIDDEN` | 管理者でない |
| 404 | `NOT_FOUND` | 指定した id の問題が存在しない |
| 400 | `VALIDATION_ERROR` | リクエストボディの構造が不正 |
| 500 | `DB_ERROR` | DB の更新に失敗 |

---

### 4-3. `DELETE /api/admin/questions/[id]` — 問題削除（論理削除）

`deleted_at` に現在時刻を設定する論理削除。物理削除は行わない。

| 項目 | 内容 |
|---|---|
| **メソッド** | `DELETE` |
| **パス** | `/api/admin/questions/[id]` |
| **認証** | 管理者のみ |
| **DB クライアント** | `adminClient`（service_role） |

#### レスポンス（200）

```typescript
interface DeleteResponse {
  success: true
}
```

#### エラーレスポンス

| ステータス | コード | 説明 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 未認証 |
| 403 | `FORBIDDEN` | 管理者でない |
| 404 | `NOT_FOUND` | 指定した id の問題が存在しない |
| 500 | `DB_ERROR` | DB の更新に失敗 |

---

## 5. Supabase直接アクセスのクエリパターン

ブラウザクライアント（`lib/supabase/client.ts`）から直接実行するクエリ。RLS により自動的にアクセス制御される。

> **データフェッチ基盤**: すべてのクエリは **TanStack Query**（`@tanstack/react-query`）の `useQuery` / `useMutation` でラップする。キャッシュ・再取得・ローディング/エラー状態を宣言的に管理し、`useEffect` + `useState` の手書きフェッチを排除する。詳細は `frontend-design.md` セクション 5-5 を参照。

### 5-1. カテゴリ + トピック一覧取得

```typescript
const { data } = await supabase
  .from('categories')
  .select('*, topics(*)')
  .is('deleted_at', null)
  .order('sort_order')
```

> `topics` 側の `deleted_at` フィルタは RLS ではなくアプリ側で追加する（公開データのためフロント側でフィルタ）。

### 5-2. トピック別の問題一覧取得

```typescript
const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('topic_id', topicId)
  .is('deleted_at', null)
```

### 5-3. 進捗の upsert

```typescript
const { data } = await supabase
  .from('progress')
  .upsert(
    {
      user_id: userId,
      question_id: questionId,
      result,                     // 'correct' | 'wrong' | 'skipped'
      answered_at: new Date().toISOString(),
      rating,                     // クイズ: 3 or 1 / 説明: 1-4
      stability,                  // FSRS パラメータ
      difficulty_fsrs,
      due_date,
      reps,
      lapses,
      state,
      last_review,
    },
    { onConflict: 'user_id,question_id' }
  )
```

### 5-4. ブックマークのトグル

```typescript
// ブックマーク追加
const { error } = await supabase
  .from('bookmarks')
  .insert({ user_id: userId, question_id: questionId })

// ブックマーク解除
const { error } = await supabase
  .from('bookmarks')
  .delete()
  .eq('user_id', userId)
  .eq('question_id', questionId)
```

### 5-5. 今日の復習問題取得

```typescript
const { data } = await supabase
  .from('progress')
  .select('*, questions(*)')
  .eq('user_id', userId)
  .lte('due_date', new Date().toISOString())
```

> `idx_progress_due` 部分インデックスにより効率的にクエリされる。

### 5-6. ダッシュボード統計

```typescript
// トピック別の正答率集計
const { data } = await supabase
  .from('progress')
  .select('result, questions(topic_id)')
  .eq('user_id', userId)
```

> フロントエンド側で `topic_id` ごとに `correct` / `wrong` / `skipped` を集計し、正答率を算出する。

---

## 6. 認証ミドルウェア

`middleware.ts` で Supabase セッションを検証し、ルートに応じたアクセス制御を行う。

### 6-1. ルート分類

| ルート | アクセス制御 |
|---|---|
| `/` | 公開（ミドルウェア対象外） |
| `/login` | 公開（ミドルウェア対象外） |
| `/topics/*` | 公開（ミドルウェア対象外） |
| `/quiz/*` | 公開（ミドルウェア対象外） |
| `/explain/*` | 公開（ミドルウェア対象外） |
| `/dashboard` | 要ログイン |
| `/admin/*` | 要ログイン + 管理者メール検証 |

### 6-2. ミドルウェア設定

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Supabase セッション取得
  const supabase = createServerClient(/* cookie設定 */)
  const { data: { user } } = await supabase.auth.getUser()

  // /dashboard: ログイン必須
  if (pathname === '/dashboard') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // /admin/*: 管理者メール検証
  if (pathname.startsWith('/admin')) {
    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/admin/:path*'],
}
```

### 6-3. Route Handler の管理者検証

Route Handler（`/api/admin/*`, `/api/ai/analyze`, `/api/ai/generate`）では、ミドルウェアとは別に関数内でもセッションを検証する。

```typescript
async function verifyAdmin(): Promise<boolean> {
  const supabase = await createClient()  // lib/supabase/server.ts
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === process.env.ADMIN_EMAIL
}
```

---

## 7. FSRS連携仕様

間隔反復アルゴリズム FSRS を `ts-fsrs` ライブラリで実装する。

### 7-1. rating マッピング

| モード | 条件 | FSRS Rating |
|---|---|---|
| クイズ | 正解 (`result = 'correct'`) | `Rating.Good` (3) |
| クイズ | 不正解 (`result = 'wrong'`) | `Rating.Again` (1) |
| クイズ | わからない (`result = 'skipped'`) | `Rating.Again` (1) |
| 口頭説明 | AI 評価 1-4 | そのまま FSRS Rating (1-4) として使用 |

### 7-2. カード状態と progress テーブルの対応

| FSRS フィールド | progress カラム | 説明 |
|---|---|---|
| `stability` | `stability` | 記憶の安定性 |
| `difficulty` | `difficulty_fsrs` | 問題の難しさ（FSRS 内部値） |
| `due` | `due_date` | 次回復習予定日 |
| `reps` | `reps` | 累計復習回数 |
| `lapses` | `lapses` | 忘却回数 |
| `state` | `state` | 0=New, 1=Learning, 2=Review, 3=Relearning |
| `last_review` | `last_review` | 最終復習日時 |

### 7-3. ラッパー関数

```typescript
import { fsrs, createEmptyCard, Rating, type Card } from 'ts-fsrs'

const f = fsrs()

interface FSRSResult {
  stability: number
  difficulty_fsrs: number
  due_date: string
  reps: number
  lapses: number
  state: number
  last_review: string
}

export function scheduleFSRS(
  card: Card | null,
  rating: number
): FSRSResult {
  const now = new Date()
  const currentCard = card ?? createEmptyCard(now)
  const scheduling = f.repeat(currentCard, now)
  const result = scheduling[rating as Rating]

  return {
    stability: result.card.stability,
    difficulty_fsrs: result.card.difficulty,
    due_date: result.card.due.toISOString(),
    reps: result.card.reps,
    lapses: result.card.lapses,
    state: result.card.state,
    last_review: result.card.last_review!.toISOString(),
  }
}
```

### 7-4. result の判定ルール

| モード | 条件 | result |
|---|---|---|
| クイズ | 正解を選択 | `correct` |
| クイズ | 不正解を選択 | `wrong` |
| クイズ | 「わからない」を選択 | `skipped` |
| 口頭説明 | AI rating >= 3 | `correct` |
| 口頭説明 | AI rating <= 2 | `wrong` |

---

## 8. エラーハンドリング

### 8-1. 標準エラーレスポンス形式

すべての Route Handler は統一されたエラー形式を返す。

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "status": 400
}
```

### 8-2. HTTP ステータスコード一覧

| ステータス | 用途 | 例 |
|---|---|---|
| 200 | 正常完了 | — |
| 400 | バリデーションエラー（Zod） | リクエストボディの型不正 |
| 401 | 未認証 | セッションなし |
| 403 | 権限不足 | 管理者でないユーザーが管理者 API にアクセス |
| 404 | リソース未検出 | 指定した ID の問題/トピックが存在しない |
| 429 | レート制限 | AI API の呼び出し制限に到達 |
| 500 | サーバー内部エラー | AI API の呼び出し失敗、DB エラー |

### 8-3. エラーハンドリングのヘルパー

```typescript
import { NextResponse } from 'next/server'

export function apiError(
  message: string,
  code: string,
  status: number
) {
  return NextResponse.json(
    { error: message, code, status },
    { status }
  )
}

// 使用例
return apiError('認証が必要です', 'UNAUTHORIZED', 401)
return apiError('管理者権限が必要です', 'FORBIDDEN', 403)
return apiError('問題が見つかりません', 'NOT_FOUND', 404)
```

### 8-4. バリデーション

リクエストボディのバリデーションには Zod を使用する。バリデーションエラーは 400 で返す。

```typescript
import { z } from 'zod'

const feedbackSchema = z.object({
  questionId: z.string().uuid(),
  userAnswer: z.string().min(1),
  language: z.enum(['ja', 'en']),
})

// Route Handler 内
const parsed = feedbackSchema.safeParse(body)
if (!parsed.success) {
  return apiError('リクエストの形式が不正です', 'VALIDATION_ERROR', 400)
}
```
