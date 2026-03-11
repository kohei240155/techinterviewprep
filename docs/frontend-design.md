# TechPrep フロントエンド設計書

> Next.js App Router + TypeScript | 仕様書 v1.2 準拠 | 2026年3月

---

## 1. ディレクトリ構成

```
app/
  layout.tsx                        # ルートレイアウト（providers, Header）
  page.tsx                          # / — ホーム（トピック一覧）
  loading.tsx                       # ルートの Suspense フォールバック
  error.tsx                         # ルートのエラーバウンダリ
  login/
    page.tsx                        # /login — Google OAuth ログイン
  topics/
    [topicId]/
      page.tsx                      # /topics/[topicId] — トピック詳細
  quiz/
    [topicId]/
      page.tsx                      # /quiz/[topicId] — クイズモード
  explain/
    [topicId]/
      page.tsx                      # /explain/[topicId] — 口頭説明モード
  dashboard/
    page.tsx                        # /dashboard — 進捗ダッシュボード
    loading.tsx
  admin/
    page.tsx                        # /admin — 管理者ログイン
    generate/
      page.tsx                      # /admin/generate — 問題生成ウィザード
    questions/
      page.tsx                      # /admin/questions — 問題管理
  api/
    ai/
      analyze/route.ts              # Step 1: コンテンツ分析（Claude API）
      generate/route.ts             # Step 2: 問題生成（Claude API）
      feedback/route.ts             # 口頭説明フィードバック（Grok API）
      chat/route.ts                 # AIチャット質問（Grok API）
      transcribe/route.ts           # 音声文字起こし（Whisper API）
    admin/
      questions/
        route.ts                    # GET（一覧）/ POST（保存）
        [id]/
          route.ts                  # PUT（更新）/ DELETE（削除）

components/
  layout/
    Header.tsx                      # ナビゲーション、認証状態、言語切替、ダークモード
    Footer.tsx                      # フッター
    LanguageToggle.tsx              # ja/en 切替タブ
    DarkModeToggle.tsx              # ダークモード切替ボタン
  quiz/
    QuizSession.tsx                 # クイズセッション全体の制御
    QuestionCard.tsx                # 問題カード（全タイプ共通）
    OptionButton.tsx                # 選択肢ボタン（正誤アニメーション付き）
    CodeBlock.tsx                   # シンタックスハイライト付きコード表示
    ResultsSummary.tsx              # セッション結果（インライン表示）
  explain/
    ExplainSession.tsx              # 口頭説明セッション全体の制御
    PromptCard.tsx                  # 説明プロンプト表示
    AnswerInput.tsx                 # テキスト入力エリア
    FeedbackPanel.tsx               # AI フィードバック表示
    ResultsSummary.tsx              # セッション結果（インライン表示）
  dashboard/
    StatsOverview.tsx               # 統計サマリー（正答率、ストリーク等）
    TopicChart.tsx                  # トピック別正答率チャート（Recharts）
    ReviewBadge.tsx                 # 復習バッジ（due 件数表示）
    BookmarkList.tsx                # ブックマーク一覧
  admin/
    GenerateWizard.tsx              # 問題生成ウィザード統括
    InputStep.tsx                   # Step 1: テキスト投入 or トピック選択
    PlanReviewStep.tsx              # Step 2: AI 分析結果レビュー・編集
    PreviewStep.tsx                 # Step 3: 生成問題プレビュー・編集
    SaveStep.tsx                    # Step 4: 保存確認・完了
    QuestionEditor.tsx              # 問題編集フォーム
    QuestionList.tsx                # 問題一覧テーブル
  common/
    ChatPanel.tsx                   # スライドアウト AI チャットパネル
    VoiceRecordButton.tsx           # マイク録音ボタン（Whisper 連携）
    Toast.tsx                       # トースト通知（成功/エラー）
    Skeleton.tsx                    # ローディングプレースホルダー

hooks/
  useQuizSession.ts                 # クイズセッション状態管理（useReducer）
  useExplainSession.ts              # 口頭説明セッション状態管理（useReducer）
  useLanguage.ts                    # LanguageContext のショートカット
  useAuth.ts                        # AuthContext のショートカット
  useFSRS.ts                        # FSRS スケジューリング計算
  queries/                          # TanStack Query カスタムフック
    useCategories.ts                # カテゴリ + トピック一覧
    useQuestions.ts                 # トピック別問題一覧
    useProgress.ts                  # ユーザー進捗（取得・upsert）
    useBookmarks.ts                 # ブックマーク（取得・トグル）
    useReviewItems.ts               # 今日の復習問題
    useDashboardStats.ts            # ダッシュボード統計

lib/
  supabase/
    client.ts                       # ブラウザ用 Supabase クライアント
    server.ts                       # Server Component 用クライアント
    admin.ts                        # service_role 用クライアント（管理者 API）
  i18n.ts                           # t(key, language) 翻訳関数
  fsrs.ts                           # ts-fsrs ラッパー
  prompts/                          # AI プロンプトテンプレート

types/
  index.ts                          # 共通型定義（DB テーブル型、API レスポンス型等）
```

---

## 2. ルーティングとレイアウト

### 2-1. ルート一覧（全9ルート）

| ルート | 画面名 | 認証要件 |
|---|---|---|
| `/` | ホーム | 不要（ゲスト可） |
| `/login` | ログイン | 不要 |
| `/topics/[topicId]` | トピック詳細 | 不要（ゲスト可） |
| `/quiz/[topicId]` | クイズモード | 不要（ゲスト可、進捗保存なし） |
| `/explain/[topicId]` | 口頭説明モード | 不要（ゲスト可、進捗保存なし） |
| `/dashboard` | 進捗ダッシュボード | **要ログイン** |
| `/admin` | 管理者ログイン | 不要（ログインフォーム表示） |
| `/admin/generate` | 問題生成 | **要管理者認証** |
| `/admin/questions` | 問題管理 | **要管理者認証** |

> **注記**: `/results` ルートは存在しない。セッション結果はクイズ画面・口頭説明画面内にインライン表示する。

### 2-2. レイアウト階層

```
RootLayout (app/layout.tsx)
├── Providers（AuthProvider, LanguageProvider）
├── Header（全ページ共通）
├── <main>{children}</main>
└── Footer（全ページ共通）
```

- **RootLayout**: `<html>` に `className` でダークモードクラスを制御。全プロバイダをラップ。
- ページ固有のレイアウトは不要（ルートレイアウト1つで完結）。

### 2-3. Server Component / Client Component 判定

| ページ | レンダリング | 理由 |
|---|---|---|
| `/` (ホーム) | Server Component | カテゴリ・トピックのデータ取得のみ。ログイン済みの場合は進捗をサーバーで取得 |
| `/login` | Client Component | OAuth リダイレクト処理にブラウザ API が必要 |
| `/topics/[topicId]` | Server Component | 問題一覧・進捗統計をサーバーで取得 |
| `/quiz/[topicId]` | Client Component | インタラクティブなクイズ操作、タイマー、状態遷移 |
| `/explain/[topicId]` | Client Component | テキスト入力、音声録音、AI フィードバック |
| `/dashboard` | Server Component（子に Client Component） | 初期データはサーバー取得、チャートは Client Component |
| `/admin` | Client Component | ログインフォーム操作 |
| `/admin/generate` | Client Component | マルチステップウィザード、API 通信 |
| `/admin/questions` | Client Component | テーブル操作、検索・フィルタ、編集・削除 |

### 2-4. middleware.ts

ルート保護を Next.js Middleware で実装する。

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase セッション取得
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();

  // /dashboard: 未ログインはログイン画面へリダイレクト
  if (pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // /admin/generate, /admin/questions: 管理者メールでないなら /admin へリダイレクト
  if (pathname.startsWith('/admin/') && pathname !== '/admin') {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!user || user.email !== adminEmail) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

---

## 3. ページ別コンポーネントツリー

### 3-1. `/` — ホーム

トピック一覧をカテゴリ別に表示する。ログイン済みユーザーには進捗サマリーも表示する。

```
HomePage (Server Component)
├── CategorySection
│   ├── CategoryHeader          — カテゴリ名表示
│   └── TopicCard[]             — トピックカード一覧
│       ├── トピック名（name_ja / name_en）
│       ├── 問題数バッジ
│       ├── 進捗バー（ログイン時のみ）— 回答済み / 全問題数
│       └── リンク → /topics/[topicId]
└── (ゲスト時) ログイン促進バナー
```

| コンポーネント | Props | SC/CC | データ取得 |
|---|---|---|---|
| `HomePage` | — | SC | categories + topics（JOIN） |
| `CategorySection` | `{ category, topics, progressMap? }` | SC | 親から受け取り |
| `TopicCard` | `{ topic, progress? }` | SC | 親から受け取り |

**データ取得**: `categories` と `topics` を JOIN で取得。ログイン済みの場合は `progress` をユーザー別に集計。

### 3-2. `/login` — ログイン

Google OAuth ログイン画面。

```
LoginPage (Client Component)
├── Google OAuth ログインボタン
└── ゲスト利用の案内テキスト
```

| コンポーネント | Props | SC/CC | ユーザー操作 |
|---|---|---|---|
| `LoginPage` | — | CC | Google ログインボタンクリック → Supabase Auth OAuth |

### 3-3. `/topics/[topicId]` — トピック詳細

トピックの問題一覧、進捗統計、学習開始ボタンを表示する。

```
TopicDetailPage (Server Component)
├── TopicHeader                 — トピック名、カテゴリ名、問題数
├── TopicStats (Client)         — 正答率、回答済み数（ログイン時）
├── QuestionList                — 問題一覧
│   └── QuestionRow[]           — 問題行（タイプ、難易度、回答状態）
├── ActionButtons (Client)      — 学習開始ボタン群
│   ├── 「クイズを始める」 → /quiz/[topicId]
│   └── 「口頭説明を練習」 → /explain/[topicId]
└── BookmarkSection (Client)    — ブックマーク済み問題（ログイン時）
```

| コンポーネント | Props | SC/CC | データ取得 |
|---|---|---|---|
| `TopicDetailPage` | `{ params: { topicId } }` | SC | topic + questions（topic_id でフィルタ） |
| `TopicHeader` | `{ topic, questionCount }` | SC | 親から受け取り |
| `TopicStats` | `{ topicId }` | CC | progress をクライアントで取得 |
| `QuestionList` | `{ questions, progressMap? }` | SC | 親から受け取り |
| `ActionButtons` | `{ topicId }` | CC | ルーターでナビゲーション |

### 3-4. `/quiz/[topicId]` — クイズモード

問題を1問ずつ表示し、回答後に解説を展開する。全問完了後は同一画面内に結果サマリーをインライン表示する。

```
QuizPage (Client Component)
├── QuizSession                 — セッション全体制御（useQuizSession）
│   ├── [設定フェーズ]
│   │   ├── ModeSelector        — モード選択（新規 / 復習）
│   │   └── CountSelector       — 問題数選択（5 / 10 / 15 / 20 / All）
│   │
│   ├── [出題フェーズ]
│   │   ├── ProgressBar         — 進捗バー（現在の問題番号 / 全問題数）
│   │   ├── QuestionCard        — 問題表示
│   │   │   ├── 問題文（question_ja / question_en）
│   │   │   ├── CodeBlock       — コード表示（type = 'code' 時）
│   │   │   └── OptionButton[]  — 選択肢 + 「わからない」ボタン
│   │   ├── ExplanationPanel    — 回答後の解説表示（展開アニメーション）
│   │   └── ActionBar           — 「次の問題へ」「もう一度」「ブックマーク」
│   │
│   ├── [結果フェーズ（インライン）]
│   │   └── ResultsSummary      — セッション結果
│   │       ├── 正答率（円グラフ）
│   │       ├── 所要時間
│   │       ├── 問題別結果一覧（正解/不正解/スキップ）
│   │       └── 「もう一度」「トピックに戻る」ボタン
│   │
│   └── ChatPanel (slide-out)   — AI チャットパネル
│       └── VoiceRecordButton   — 音声入力（任意）
```

| コンポーネント | Props | SC/CC | ユーザー操作 |
|---|---|---|---|
| `QuizSession` | `{ topicId }` | CC | セッション全体の状態管理 |
| `ModeSelector` | `{ onSelect }` | CC | モード選択 |
| `CountSelector` | `{ availableCounts, onSelect }` | CC | 問題数選択 |
| `QuestionCard` | `{ question, language }` | CC | 問題文の表示 |
| `OptionButton` | `{ option, state, onSelect }` | CC | 選択肢クリック（正誤アニメーション） |
| `CodeBlock` | `{ code, language? }` | CC | コードの表示（読み取り専用） |
| `ResultsSummary` | `{ results, totalTime }` | CC | 結果確認、再挑戦ナビゲーション |
| `ChatPanel` | `{ topicContext }` | CC | AI への自由質問 |

**状態管理**: `useQuizSession` フックで `useReducer` を使用。詳細はセクション5を参照。

### 3-5. `/explain/[topicId]` — 口頭説明モード

`type = 'explain'` の問題を1問ずつ表示し、テキストまたは音声で回答する。AI がルーブリックに基づいてフィードバックを返す。全問完了後は結果をインライン表示する。

```
ExplainPage (Client Component)
├── ExplainSession              — セッション全体制御（useExplainSession）
│   ├── [出題フェーズ]
│   │   ├── ProgressBar         — 進捗バー
│   │   ├── PromptCard          — 説明プロンプト表示
│   │   │   └── 問題文（question_ja / question_en）
│   │   ├── AnswerInput         — テキスト入力エリア
│   │   ├── VoiceRecordButton   — マイク録音 → Whisper → テキスト変換
│   │   ├── SubmitButton        — 「回答を送信」
│   │   └── FeedbackPanel       — AI フィードバック表示
│   │       ├── 理解度評価（1-4）
│   │       ├── 評価コメント
│   │       ├── 不足点・誤りの指摘
│   │       ├── 英語表現の提案
│   │       └── 模範解答（展開表示）
│   │
│   ├── [結果フェーズ（インライン）]
│   │   └── ResultsSummary      — セッション結果
│   │       ├── 平均評価スコア
│   │       ├── 問題別結果一覧（評価 1-4）
│   │       └── 「もう一度」「トピックに戻る」ボタン
│   │
│   └── ChatPanel (slide-out)   — AI チャットパネル
```

| コンポーネント | Props | SC/CC | ユーザー操作 |
|---|---|---|---|
| `ExplainSession` | `{ topicId }` | CC | セッション全体の状態管理 |
| `PromptCard` | `{ question, language }` | CC | 問題文の表示 |
| `AnswerInput` | `{ value, onChange }` | CC | テキスト入力 |
| `VoiceRecordButton` | `{ onTranscription }` | CC | 録音開始/停止、Whisper API 連携 |
| `FeedbackPanel` | `{ feedback, modelAnswer }` | CC | フィードバック表示、模範解答展開 |
| `ResultsSummary` | `{ results }` | CC | 結果確認、再挑戦ナビゲーション |

### 3-6. `/dashboard` — 進捗ダッシュボード

ログインユーザーの学習進捗を可視化する。未ログインは `/login` へリダイレクト（middleware で制御）。

```
DashboardPage (Server Component — 初期データ取得)
├── StatsOverview (Client)      — 統計サマリー
│   ├── 総回答数
│   ├── 全体正答率
│   └── 連続学習日数（ストリーク）
├── ReviewSection (Client)      — 今日の復習セクション
│   ├── ReviewBadge             — 復習すべき問題数バッジ
│   └── ReviewList              — 復習対象問題のリスト
│       └── リンク → /quiz/[topicId]?mode=review
├── TopicChart (Client)         — トピック別正答率チャート（Recharts）
│   └── BarChart / RadarChart
├── BookmarkList (Client)       — ブックマーク一覧
│   └── BookmarkItem[]          — ブックマーク問題カード
└── WeaknessShortcut (Client)   — 「弱点トピックを集中練習」ボタン
```

| コンポーネント | Props | SC/CC | データ取得 |
|---|---|---|---|
| `DashboardPage` | — | SC | progress, bookmarks を集計してサーバーで取得 |
| `StatsOverview` | `{ totalAnswered, accuracy, streak }` | CC | 親から受け取り |
| `ReviewSection` | `{ dueItems }` | CC | due_date <= now() の progress レコード |
| `ReviewBadge` | `{ count }` | CC | 親から受け取り |
| `TopicChart` | `{ topicStats }` | CC | トピック別集計データ |
| `BookmarkList` | `{ bookmarks }` | CC | bookmarks JOIN questions |

**チャートライブラリ**: Recharts を使用。`TopicChart` は `BarChart`（トピック別正答率）を表示する。

### 3-7. `/admin` — 管理者ログイン

メール+パスワードによる管理者認証。

```
AdminLoginPage (Client Component)
├── メールアドレス入力
├── パスワード入力
└── ログインボタン
```

### 3-8. `/admin/generate` — 問題生成ウィザード

4ステップのウィザード形式で問題を生成する。

```
GeneratePage (Client Component)
└── GenerateWizard              — ウィザード統括（ステップ状態管理）
    ├── StepIndicator           — ステップインジケーター（1/4）
    ├── [Step 1] InputStep      — 入力
    │   ├── テキスト投入エリア（textarea）
    │   ├── トピック選択（select）
    │   └── 「分析する」ボタン → POST /api/ai/analyze
    ├── [Step 2] PlanReviewStep — 計画レビュー
    │   ├── AI 提案の問題構成表示
    │   │   ├── 面接関連度（high / medium / low）
    │   │   ├── コンテンツ要約
    │   │   └── 問題タイプ × 難易度 × 問題数（編集可能）
    │   └── 「生成する」ボタン → POST /api/ai/generate
    ├── [Step 3] PreviewStep    — プレビュー
    │   ├── 生成問題一覧
    │   │   └── QuestionEditor[]— 各問題の編集・削除
    │   ├── 重複チェック結果表示
    │   └── 「保存する」ボタン → POST /api/admin/questions
    └── [Step 4] SaveStep       — 保存完了
        ├── 保存件数の確認
        └── 「問題管理へ」「さらに生成」ボタン
```

| コンポーネント | Props | SC/CC | ユーザー操作 |
|---|---|---|---|
| `GenerateWizard` | — | CC | ステップ遷移管理 |
| `InputStep` | `{ onAnalyze }` | CC | テキスト入力、トピック選択、分析実行 |
| `PlanReviewStep` | `{ plan, onGenerate, onEdit }` | CC | 計画編集（問題数・タイプ・難易度）、生成実行 |
| `PreviewStep` | `{ questions, onSave, onEdit, onDelete }` | CC | 問題編集・削除、重複確認、保存実行 |
| `SaveStep` | `{ savedCount }` | CC | ナビゲーション |
| `QuestionEditor` | `{ question, onChange, onDelete }` | CC | 問題フィールドの編集 |

### 3-9. `/admin/questions` — 問題管理

登録済み問題の一覧表示、検索・フィルタ、編集・削除。

```
QuestionsPage (Client Component)
├── SearchBar                   — キーワード検索
├── FilterBar                   — トピック、タイプ、難易度フィルタ
├── QuestionList                — 問題テーブル
│   └── QuestionRow[]           — 問題行
│       ├── 問題文（truncated）
│       ├── タイプ / 難易度バッジ
│       ├── トピック名
│       ├── 「編集」ボタン → QuestionEditor（モーダル）
│       └── 「削除」ボタン → 確認ダイアログ → DELETE /api/admin/questions/[id]
└── Pagination                  — ページネーション
```

---

## 4. 共通コンポーネントライブラリ

### 4-1. layout/

| コンポーネント | 責務 | 主な Props |
|---|---|---|
| `Header` | ナビゲーション、認証状態表示、言語切替、ダークモードトグル。ログイン済みならアバター・ダッシュボードリンクを表示 | — |
| `Footer` | フッター情報 | — |
| `LanguageToggle` | `ja` / `en` の切替タブ。クリックで `LanguageContext` を更新し `localStorage` に永続化 | — |
| `DarkModeToggle` | ダークモードの ON/OFF 切替。`<html>` の `class="dark"` をトグル | — |

### 4-2. common/

| コンポーネント | 責務 | 主な Props |
|---|---|---|
| `ChatPanel` | スライドアウトパネルで AI チャット機能を提供。クイズ・口頭説明画面で使用。チャット履歴はセッション中のみ保持（DB 保存なし） | `{ topicContext, isOpen, onClose }` |
| `VoiceRecordButton` | マイクアイコンボタン。クリックで録音開始/停止。停止時に音声データを `/api/ai/transcribe` へ送信し、文字起こし結果をコールバックで返す | `{ onTranscription, isDisabled? }` |
| `Toast` | 画面右上にトースト通知を表示。成功（緑）・エラー（赤）・情報（青）の3バリアント | `{ message, type, duration? }` |
| `Skeleton` | ローディング中のプレースホルダー表示。カード型・テーブル行型・テキスト型のバリエーション | `{ variant, width?, height? }` |
| `CodeBlock` | シンタックスハイライト付きのコード表示ブロック。`type = 'code'` の問題文内コードや解説のコード例に使用 | `{ code, language? }` |
| `QuestionCard` | 問題タイプ（multiple / code / truefalse / explain）に応じたレンダリングを統一的に処理する | `{ question, language, onAnswer? }` |

---

## 5. 状態管理

グローバル状態管理ライブラリ（Redux / Zustand 等）は使用しない。React Context + `useReducer` でシンプルに管理する。

### 5-1. LanguageContext

言語設定を管理する。`localStorage` に永続化する。

```typescript
// contexts/LanguageContext.tsx
type Language = 'ja' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// 初期値: localStorage.getItem('language') || 'ja'
// setLanguage 時に localStorage.setItem('language', lang)
```

**使用箇所**: `LanguageToggle`、すべてのデータ表示コンポーネント（`*_ja` / `*_en` フィールドの切替）。

### 5-2. AuthContext

Supabase Auth のセッション状態を管理する。

```typescript
// contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;        // Supabase Auth ユーザー
  isAdmin: boolean;         // user.email === ADMIN_EMAIL
  isLoading: boolean;       // セッション取得中
}

// onAuthStateChange でセッション変化を監視
```

**使用箇所**: `Header`（認証状態表示）、middleware（ルート保護）、進捗保存の条件分岐。

### 5-3. useQuizSession (useReducer)

クイズセッションのフロー状態を管理するカスタムフック。

```typescript
// hooks/useQuizSession.ts
interface QuizState {
  phase: 'setup' | 'playing' | 'review' | 'results';
  mode: 'new' | 'review';
  questions: Question[];
  currentIndex: number;
  answers: Answer[];           // { questionId, selectedIndex, result, timeSpent }
  startTime: number;
  totalTime: number;
}

type QuizAction =
  | { type: 'START_SESSION'; payload: { mode, count, questions } }
  | { type: 'ANSWER'; payload: { selectedIndex, result } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'RETRY_QUESTION' }
  | { type: 'TOGGLE_BOOKMARK'; payload: { questionId } }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET' };
```

**フェーズ遷移**:
1. `setup` — モード・問題数を選択
2. `playing` — 問題に回答中
3. `review` — 回答後の解説表示中（「次へ」で次の問題、最後の問題なら `results` へ）
4. `results` — セッション結果のインライン表示（同一ページ内、ナビゲーションなし）

### 5-4. useExplainSession (useReducer)

口頭説明セッションのフロー状態を管理するカスタムフック。

```typescript
// hooks/useExplainSession.ts
interface ExplainState {
  phase: 'playing' | 'waiting' | 'feedback' | 'results';
  questions: Question[];       // type = 'explain' の問題のみ
  currentIndex: number;
  answers: ExplainAnswer[];    // { questionId, userAnswer, rating, feedback }
}

type ExplainAction =
  | { type: 'START_SESSION'; payload: { questions } }
  | { type: 'SUBMIT_ANSWER'; payload: { userAnswer } }
  | { type: 'RECEIVE_FEEDBACK'; payload: { rating, feedback } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET' };
```

**フェーズ遷移**:
1. `playing` — 回答入力中
2. `waiting` — AI フィードバック取得中（ローディング表示）
3. `feedback` — フィードバック表示中
4. `results` — セッション結果のインライン表示

### 5-5. TanStack Query（サーバー状態管理）

Supabase からのデータ取得・更新には **TanStack Query (React Query)** を使用する。キャッシュ・再取得・ローディング/エラー状態を宣言的に管理できるため、`useEffect` + `useState` の手書きデータフェッチを排除する。

```typescript
// app/layout.tsx — Provider 設定
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5分間はキャッシュを新鮮とみなす
      retry: 1,                     // リトライ1回
    },
  },
});

// QueryClientProvider を RootLayout の providers に追加
```

#### Query Key 設計

| キー | 用途 |
|---|---|
| `['categories']` | カテゴリ + トピック一覧 |
| `['questions', topicId]` | トピック別問題一覧 |
| `['progress', userId]` | ユーザー進捗一覧 |
| `['bookmarks', userId]` | ブックマーク一覧 |
| `['review', userId]` | 今日の復習問題 |
| `['dashboard', userId]` | ダッシュボード統計 |

#### カスタムフック例

```typescript
// hooks/queries/useCategories.ts
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('categories')
        .select('*, topics(*)')
        .is('deleted_at', null)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });
}

// hooks/queries/useProgress.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProgressUpsert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ProgressUpsertParams) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('progress')
        .upsert(params, { onConflict: 'user_id,question_id' });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // 進捗・復習・ダッシュボードのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['progress', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['review', variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', variables.user_id] });
    },
  });
}
```

#### AI エンドポイントの Mutation

AI Route Handler の呼び出しにも `useMutation` を使用する。

```typescript
// hooks/queries/useFeedback.ts
export function useFeedback() {
  return useMutation({
    mutationFn: async (params: { questionId: string; userAnswer: string; language: Language }) => {
      const res = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error('Feedback request failed');
      return res.json() as Promise<FeedbackResponse>;
    },
  });
}
```

### 5-6. 状態管理の方針まとめ

| 状態 | 管理方法 | スコープ |
|---|---|---|
| 言語設定 | `LanguageContext` + `localStorage` | アプリ全体 |
| 認証状態 | `AuthContext` + Supabase `onAuthStateChange` | アプリ全体 |
| サーバーデータ | **TanStack Query** (`useQuery` / `useMutation`) | データ取得を行うコンポーネント |
| クイズセッション | `useQuizSession` (`useReducer`) | `/quiz/[topicId]` ページ内 |
| 口頭説明セッション | `useExplainSession` (`useReducer`) | `/explain/[topicId]` ページ内 |
| チャット履歴 | `useState`（ローカル） | `ChatPanel` コンポーネント内 |
| ダークモード | `localStorage` + `<html>` クラス | アプリ全体 |

> **判断基準**: サーバーから取得するデータ（Supabase クエリ、AI API 呼び出し）は TanStack Query で管理。クライアントのみの UI 状態（セッション進行、言語、テーマ）は Context / useReducer / useState で管理。

---

## 6. i18n 戦略

### 6-1. 静的 UI 文字列

`lib/i18n.ts` でキーバリュー形式の翻訳関数を提供する。

```typescript
// lib/i18n.ts
const translations = {
  'home.title': { ja: 'トピック一覧', en: 'Topics' },
  'quiz.start': { ja: 'クイズを始める', en: 'Start Quiz' },
  'quiz.next': { ja: '次の問題へ', en: 'Next Question' },
  'quiz.retry': { ja: 'もう一度', en: 'Try Again' },
  'quiz.bookmark': { ja: 'ブックマーク', en: 'Bookmark' },
  'quiz.idk': { ja: 'わからない', en: "I don't know" },
  'explain.submit': { ja: '回答を送信', en: 'Submit Answer' },
  'dashboard.title': { ja: '進捗ダッシュボード', en: 'Dashboard' },
  'dashboard.review': { ja: '今日の復習', en: "Today's Review" },
  'common.login': { ja: 'ログイン', en: 'Login' },
  'common.logout': { ja: 'ログアウト', en: 'Logout' },
  // ...
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, language: 'ja' | 'en'): string {
  return translations[key]?.[language] ?? key;
}
```

### 6-2. DB コンテンツ

DB に保存されたバイリンガルコンテンツは `*_ja` / `*_en` フィールドで管理する。現在の言語設定に応じて適切なフィールドを読み出す。

```typescript
// 使用例
const questionText = language === 'ja' ? question.question_ja : question.question_en;
const topicName = language === 'ja' ? topic.name_ja : topic.name_en;
```

**対象フィールド**:
- `categories.name_ja` / `name_en`
- `topics.name_ja` / `name_en`
- `questions.question_ja` / `question_en`
- `questions.explanation_ja` / `explanation_en`
- `questions.options[].text_ja` / `text_en`（multiple / code）
- `questions.options.rubric_ja` / `rubric_en`（explain）
- `questions.answer.model_answer_ja` / `model_answer_en`（explain）

### 6-3. 言語切替フロー

1. ユーザーが `LanguageToggle` をクリック
2. `LanguageContext` の `setLanguage` を呼び出し
3. `localStorage` に保存
4. Context が更新 → 依存コンポーネントが再レンダリング
5. UI 文字列は `t(key, language)` で切替、DB コンテンツは `*_ja` / `*_en` で切替

---

## 7. スタイリング

### 7-1. Tailwind CSS 設定

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',              // class 戦略（<html class="dark">）
  theme: {
    extend: {
      colors: {
        primary: { /* ブランドカラー */ },
        success: { /* 正解フィードバック */ },
        danger: { /* 不正解フィードバック */ },
      },
    },
  },
  plugins: [],
};

export default config;
```

### 7-2. ダークモード

- **戦略**: Tailwind の `class` モード。`<html>` 要素に `class="dark"` を付与/除去する。
- **トグル**: `DarkModeToggle` コンポーネントで `localStorage` に設定を保存し、ページ読み込み時に復元する。
- **実装**: すべてのコンポーネントで `dark:` バリアントを使用。

```tsx
// 使用例
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  ...
</div>
```

### 7-3. レスポンシブデザイン

モバイルファーストで設計する。

| ブレークポイント | 用途 |
|---|---|
| デフォルト | モバイル（~639px） |
| `sm:` (640px) | 小型タブレット |
| `md:` (768px) | タブレット |
| `lg:` (1024px) | デスクトップ |

**レイアウト例**:
- トピックカード: モバイル1列 → `md:` 2列 → `lg:` 3列
- ダッシュボード: モバイル縦積み → `lg:` サイドバー + メイン
- `ChatPanel`: モバイルはフルスクリーンオーバーレイ → `lg:` はサイドパネル

### 7-4. アニメーション

Tailwind の `transition-*` と `animate-*` ユーティリティを使用する。

| 対象 | アニメーション |
|---|---|
| 選択肢ボタン（正解） | `transition-colors` → 緑背景にフェード |
| 選択肢ボタン（不正解） | `transition-colors` → 赤背景にフェード + 横揺れ |
| 解説パネル展開 | `transition-all` で高さアニメーション |
| `ChatPanel` スライド | `transition-transform` で右からスライドイン |
| トースト通知 | `animate-slide-in` → 自動フェードアウト |
| ページ遷移 | `loading.tsx` の Skeleton フェードイン |

---

## 8. エラー・ローディング UX

### 8-1. loading.tsx（Suspense フォールバック）

Next.js App Router の `loading.tsx` でルートごとの Suspense フォールバックを定義する。

| ルート | ローディング表示 |
|---|---|
| `/` | `Skeleton` のトピックカードグリッド |
| `/topics/[topicId]` | `Skeleton` のトピックヘッダー + 問題リスト |
| `/dashboard` | `Skeleton` の統計カード + チャートプレースホルダー |

### 8-2. error.tsx（エラーバウンダリ）

ルートレベルの `error.tsx` でアプリ全体のエラーを捕捉する。

```tsx
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <h2>エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onClick={reset}>もう一度試す</button>
    </div>
  );
}
```

### 8-3. コンポーネント単位のローディング

| コンポーネント | ローディング表示 |
|---|---|
| `QuizSession`（問題取得中） | `Skeleton` の問題カード |
| `FeedbackPanel`（AI応答待ち） | パルスアニメーション付きプレースホルダー |
| `TopicChart`（データ取得中） | `Skeleton` のチャートプレースホルダー |
| `GenerateWizard`（AI分析/生成中） | スピナー + 進捗メッセージ |

### 8-4. トースト通知

非同期操作の結果をトースト通知で表示する。

| トリガー | メッセージ例 | タイプ |
|---|---|---|
| ブックマーク追加 | 「ブックマークに追加しました」 | success |
| ブックマーク解除 | 「ブックマークを解除しました」 | success |
| 問題保存完了 | 「{n}件の問題を保存しました」 | success |
| API エラー | 「通信エラーが発生しました。もう一度お試しください」 | error |
| 音声認識失敗 | 「音声を認識できませんでした」 | error |

---

## 9. 設計判断メモ

| 判断 | 理由 |
|---|---|
| **`/results` ルート廃止** | セッション結果をクイズ・口頭説明ページ内にインライン表示することで、画面遷移を減らし UX を向上。状態のシリアライズも不要になる |
| **React Context + useReducer** | アプリの状態はページローカル（クイズセッション等）か、軽量なグローバル状態（言語・認証）のみ。Redux / Zustand の導入はオーバーエンジニアリング |
| **Server Component 優先** | データ取得はサーバーで完結させ、クライアントバンドルを最小化。インタラクティブなコンポーネントのみ `'use client'` にする |
| **Recharts 採用** | ダッシュボードのチャート表示に使用。React エコシステムとの親和性が高く、宣言的な API で開発効率が良い |
| **チャット履歴は DB 保存なし** | AI チャットは学習の補助機能。セッション中のみ保持しメモリで管理。DB スキーマとコストの増大を回避 |
| **AI フィードバックは DB 保存なし** | 口頭説明のフィードバックテキストはセッション中のみ表示。`progress.rating` のみ DB に保存してスケジューリングに活用 |
| **ダークモードを MVP に含む** | Tailwind の `dark:` クラスで追加コストが低い。`class` 戦略で `localStorage` と連動させる |
| **pnpm 採用** | ディスク効率とインストール速度に優れたパッケージマネージャー。strict な依存関係管理で phantom dependency を防止 |
