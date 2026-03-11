# TechPrep — アプリケーション仕様書 v1.2

> エンジニア技術面接対策アプリ｜2026年3月

---

## 1. プロジェクト概要

TechPrep は、北米のソフトウェアエンジニア職への転職を目指す開発者向けの技術面接対策Webアプリです。断片的な学習にとどまりがちな技術知識を、クイズ・口頭説明練習・進捗管理の3本柱で体系的に定着させることを目的としています。

### 対象ユーザー

- 北米でソフトウェアエンジニアへの転職を目指す開発者（主に一般企業・スタートアップ向け）
- JavaScript / TypeScript・React / フロントエンドを優先トピックとして学習したい方
- 技術知識のインプットだけでなく、口頭で説明できるアウトプット力を高めたい方

### 解決する課題

- 既存サービスは「アルゴリズム問題」か「モック面接」の二択で、知識定着→口頭説明を一気通貫でカバーするものがない
- JavaSilver試験対策のような、トピック別・体系的なクイズ形式の面接対策ツールが存在しない
- 学習の進捗や弱点を可視化できるツールが不足している

---

## 2. 技術スタック

| 層 | 採用技術 | 選定理由 |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | 管理者画面も同一プロジェクトで完結 |
| Styling | Tailwind CSS | 既存ワークフローとの一致・高速開発 |
| Database | Supabase (PostgreSQL) | 将来的なEmbedding追加が容易・Auth機能内蔵 |
| AI問題生成 | Anthropic API (Claude) | 問題生成・重複チェック |
| AI口頭説明フィードバック | Grok API (xAI) | 口頭説明のルーブリック評価・フィードバック |
| 音声認識 | OpenAI API (Whisper) | 音声入力の文字起こし |
| AIチャット | Grok API (xAI) | 学習中の自由質問チャット機能 |
| 認証 | Supabase Auth | 一般ユーザー: Google OAuth / 管理者: メール+パスワード |
| 復習スケジューリング | ts-fsrs | FSRS v4/v5 対応のスペースドリピティション |
| Hosting | Vercel | Next.jsとの相性◎・CI/CDが容易 |

---

## 3. 画面・ルート設計

| ルート | 画面名 | 説明 |
|---|---|---|
| `/` | ホーム | トピック一覧。ログイン済みの場合は進捗サマリーも表示 |
| `/login` | ログイン | Google OAuth ログイン画面 |
| `/topics/[topicId]` | トピック詳細 | 問題一覧・習熟度・ブックマーク |
| `/quiz/[topicId]` | クイズモード | 問題を1問ずつ解く（ゲスト利用可） |
| `/explain/[topicId]` | 口頭説明モード | テキストで回答→AIフィードバック（ゲスト利用可） |
| `/results` | セッション結果 | 正答率・所要時間・間違い一覧 |
| `/dashboard` | 進捗ダッシュボード | 進捗管理・今日の復習（要ログイン） |
| `/admin` | 管理者ログイン | メール+パスワード保護（Supabase Auth） |
| `/admin/generate` | 問題生成 | テキスト投入 or トピック指定でAI生成 |
| `/admin/questions` | 問題管理 | 問題一覧・編集・削除 |

---

## 4. 機能仕様

### 4-1. クイズモード

問題を1問ずつカード形式で表示します。ユーザー設定の言語（ja / en）で問題文・解説を表示します。回答後に解説を展開表示し、理解を深めます。全問完了後にセッション結果画面へ遷移します。

#### モード

| モード | 対象問題 | 利用条件 |
|---|---|---|
| 新規 | まだ回答したことがない問題 | 誰でも利用可（ゲスト含む） |
| 復習 | FSRS の復習期日（due_date）が到来した問題 | ログインユーザーのみ |

#### 問題数の選択

セッション開始前に出題数を選択します。

| 選択肢 | 説明 |
|---|---|
| 5 / 10 / 15 / 20 | 指定した問題数を出題 |
| All | 対象問題をすべて出題 |

#### 問題フォーマット

| タイプ | 説明 | 用途 |
|---|---|---|
| 4択（multiple） | 4つの選択肢から正解を選ぶ | 概念・定義の確認 |
| コード読解（code） | コードの出力・動作を答える | 実践的な理解の確認 |
| ○×（truefalse） | 正誤を判断する | テンポよく広範囲を網羅 |
| 口頭説明（explain） | テキスト/音声で説明する | 面接での口頭説明力の強化 |

#### UX仕様

- 回答前：選択肢をハイライト表示
- 回答後：正解・不正解をアニメーションで表示
- 解説：ユーザー設定の言語で表示（ヘッダーのトグルで切り替え可能）
- 自動判定（ログインユーザーのみ）：回答の正解/不正解を自動判定。FSRS連携は `正解→Good(3)` / `不正解→Again(1)` に自動マッピングし、次回復習日を自動算出
- ゲスト利用時は進捗が保存されない
- アクション：「次の問題へ」「もう一度」「ブックマーク」の3ボタン

---

### 4-2. 口頭説明モード

面接本番を想定した口頭説明の練習モードです。`type = 'explain'` の問題が DB に事前登録されており、ルーブリック（`options`）と模範解答（`answer`）を持ちます。ユーザーがテキスト入力または音声入力（Whisper）で回答すると、AIがルーブリックに基づいて面接官視点のフィードバックを返します。

#### 入力方式

| 方式 | 説明 |
|---|---|
| テキスト入力 | 従来通りテキストボックスに入力 |
| 音声入力 | マイクボタンで録音 → Whisper APIで文字起こし → テキストとして送信 |

#### 採点フロー

1. ユーザーがテキスト/音声で回答
2. AIに送信: ユーザー回答 + ルーブリック（`options.rubric`） + 模範解答（`answer`）
3. AIがルーブリックに基づいて **1-4で評価** → そのまま FSRS rating として使用
4. rating を FSRS に渡して復習スケジュール更新

> `result` の判定: rating >= 3 → `correct` / rating <= 2 → `wrong`
> AIフィードバック（テキスト）は DB 保存しない。セッション中のみ表示。

#### フィードバック内容

フィードバックはGrok API (xAI) により、ユーザー設定の言語で返されます。DB に保存されたルーブリック（理解度の4段階基準）に基づき評価します。

- ルーブリックに基づく理解度評価（1-4）とコメント
- 説明の不足点・誤りの指摘
- より自然な英語表現の提案
- 模範解答の展開表示（DB の `answer.model_answer_ja` / `model_answer_en`）

---

### 4-3. 進捗ダッシュボード

**ログインユーザーのみ利用可能です。** 未ログインでアクセスした場合はログイン画面にリダイレクトします。

- **今日の復習**: FSRS アルゴリズムにより復習期日（due_date）が来た問題を優先表示。復習すべき問題数をバッジで表示
- トピック別の正答率をグラフ表示
- 連続学習日数（ストリーク）
- ブックマーク問題（誤答・ブックマーク済み）のピックアップ一覧
- 「弱点トピックを集中練習」ショートカットボタン

---

### 4-4. AIチャット質問機能

クイズモード・口頭説明モードの補助機能として、学習中にトピックについてAIに自由に質問できるチャット機能です。Grok API (xAI) を使用します。

- クイズ画面・口頭説明画面内のチャットパネルからアクセス（専用ルートなし）
- チャット履歴はセッション中のみ保持（DB保存なし）
- トピックのコンテキストを自動的にプロンプトに含めることで、関連性の高い回答を返す

---

## 5. 管理者機能（問題生成）

### 5-1. 認証

#### 一般ユーザー認証（Google OAuth）

- Supabase Auth の Google OAuth を使用
- ログインなしでもクイズ・口頭説明モードは利用可能（ゲスト利用）
- ログインすると進捗管理・復習スケジューリングが有効になる
- 初回ログイン時に `users` テーブルにレコードを自動作成

#### 管理者認証（メール+パスワード）

Supabase Auth を使用したメール＋パスワード認証です。管理者アカウントはSupabaseダッシュボードで1件手動作成します。未認証で `/admin` 配下にアクセスした場合はログイン画面にリダイレクトします。

### 5-2. 問題生成フロー

#### ① テキスト投入モード

- ドキュメント・記事・自分のメモなどをペーストする
- 生成したい問題数・問題タイプ・難易度を指定する
- AIがテキストを解析して問題を生成（日本語・英語両方）

#### ② トピック指定モード

- トピック名・難易度（easy / medium / hard）を指定する
- AIが問題を指定数だけ自動生成する

#### 共通：重複チェック

生成時に既存の問題リストをAIに渡し、意味的に類似した問題が生成されないよう制御します。類似度が高い問題が検出された場合は「既存の Q.XX と類似しています」として警告を表示します。将来的な拡張として、Embeddingベクトルを使ったセマンティック検索（Supabase pgvector）への移行も想定します。

### 5-3. プレビュー・保存フロー

```
入力（テキスト or トピック指定）
  └─ 生成したい問題数・タイプ・難易度を指定

       ↓ AI生成

プレビュー
  ├─ 生成された問題を一覧表示
  ├─ 1問ずつ編集・削除が可能
  └─ 重複チェック結果を各問題に表示
       例："既存の Q.23 と類似しています（類似度 高）"

       ↓ 確認後

保存
  └─ トピック・難易度・タイプをタグ付けしてSupabaseに登録
```

---

## 6. データ設計（Supabase）

### users テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | Supabase Auth の uid |
| display_name | text | Google アカウント名 |
| avatar_url | text | Google アバター URL |
| created_at | timestamptz | 登録日時 |
| updated_at | timestamptz | 更新日時 |
| deleted_at | timestamptz | 論理削除日時 |

> **言語設定**: localStorage に `{ language: "ja" }` として保存し、ヘッダーのトグルで切り替える。DBには持たせない。

### categories テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 主キー |
| name_ja | text | カテゴリ名（日本語）例：JavaScript / TypeScript |
| name_en | text | カテゴリ名（英語）例：JavaScript / TypeScript |
| sort_order | int | 表示順（デフォルト 0） |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |
| deleted_at | timestamptz | 論理削除日時 |

### topics テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 主キー |
| category_id | uuid (FK) | categories.id への外部キー |
| name_ja | text | トピック名（日本語）例：非同期処理 |
| name_en | text | トピック名（英語）例：Async / Promises |
| sort_order | int | 表示順（デフォルト 0） |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |
| deleted_at | timestamptz | 論理削除日時 |

### questions テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 主キー |
| topic_id | uuid (FK) | topics.id への外部キー |
| type | text | multiple / code / truefalse / explain |
| difficulty | text | easy / medium / hard |
| question_ja | text | 問題文（日本語） |
| question_en | text | 問題文（英語） |
| options | jsonb | 選択肢（multiple/code）or ルーブリック（explain） |
| answer | jsonb | 正解データ or 模範解答 |
| explanation_ja | text | 解説（日本語） |
| explanation_en | text | 解説（英語） |
| created_at | timestamptz | 作成日時 |
| updated_at | timestamptz | 更新日時 |
| deleted_at | timestamptz | 論理削除日時 |

### progress テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 主キー |
| user_id | uuid (FK) | users.id への外部キー |
| question_id | uuid (FK) | questions.id への外部キー |
| result | text | correct / wrong / skipped |
| answered_at | timestamptz | 回答日時 |
| stability | real | FSRS の安定性パラメータ |
| difficulty_fsrs | real | FSRS の難易度パラメータ |
| due_date | timestamptz | 次回復習日 |
| rating | int | クイズ: 自動マッピング（正解=3, 不正解=1）/ 説明: AIが1-4で評価 |
| reps | int | 復習回数 |
| lapses | int | 忘却回数 |
| state | int | FSRS カード状態（0=New, 1=Learning, 2=Review, 3=Relearning） |
| last_review | timestamptz | 最終復習日時 |
| updated_at | timestamptz | 更新日時 |
| deleted_at | timestamptz | 論理削除日時 |

### bookmarks テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| id | uuid (PK) | 主キー |
| user_id | uuid (FK) | users.id への外部キー |
| question_id | uuid (FK) | questions.id への外部キー |
| created_at | timestamptz | ブックマーク日時 |

> 未回答の問題もブックマーク可能。INSERT/DELETE のトグル操作で管理する。

---

## 7. AIプロンプト設計（概要）

### 7-1. 問題生成（テキスト投入）

```
System:
  あなたは技術面接問題の作成者です。
  与えられたテキストから {n} 問の {type} 形式の問題を生成してください。
  既存の問題リスト: {existingQuestions}
  既存と意味的に重複する問題は絶対に作らないこと。
  出力は必ずJSON形式（日本語・英語両方含む）で返すこと。

User:
  {貼り付けたテキスト}
```

### 7-2. 問題生成（トピック指定）

```
System:
  同上

User:
  トピック「{topic}」について難易度「{difficulty}」の問題を {n} 問作成してください。
```

### 7-3. 口頭説明フィードバック（Grok）

> `{language}` はユーザー設定の言語（`ja` or `en`）に動的に切り替わります。
> `{rubric}` は DB の `questions.options.rubric`（ルーブリック）、`{modelAnswer}` は `questions.answer`（模範解答）から取得します。

```
System:
  あなたは北米テック企業の面接官です。
  回答言語: {language}
  以下のルーブリック（理解度の4段階基準）に基づいて、候補者の回答を {language} で評価してください。
  ルーブリック: {rubric}
  模範解答: {modelAnswer}

  評価手順:
  1. ルーブリックに基づいて理解度を 1-4 で評価する
  2. 評価の根拠を説明する
  3. 説明の不足点・誤りを指摘する
  4. より自然な英語表現を提案する

  出力形式:
  - rating: 1-4 の整数（必須）
  - feedback: 評価コメント（{language}で記述）

User:
  質問：{question}
  回答：{userAnswer}
```

### 7-4. AIチャット質問（Grok）

```
System:
  あなたはソフトウェアエンジニアリングの専門家です。
  現在のトピック: {topic}
  ユーザーが学習中のトピックについて質問しています。
  回答言語: {language}
  正確かつ簡潔に、実務で役立つ観点を交えて {language} で回答してください。

User:
  {userQuestion}
```

---

## 8. 優先トピック一覧

### JavaScript / TypeScript

| サブトピック | 難易度 | 面接頻出度 |
|---|---|---|
| クロージャ・スコープ | Medium | ★★★ |
| プロトタイプ・継承 | Medium | ★★★ |
| 非同期（Promise / async-await / イベントループ） | Hard | ★★★ |
| this キーワード | Medium | ★★★ |
| 型システム（Generics / Utility Types） | Hard | ★★ |
| ES6+（分割代入 / spread / optional chaining） | Easy | ★★ |
| メモリ管理・ガベージコレクション | Hard | ★ |

### React / フロントエンド

| サブトピック | 難易度 | 面接頻出度 |
|---|---|---|
| Virtual DOM・Reconciliation | Medium | ★★★ |
| Hooks（useState / useEffect / useCallback / useMemo） | Medium | ★★★ |
| コンポーネント設計・再レンダリング最適化 | Hard | ★★★ |
| 状態管理（Context / Redux / Zustand 比較） | Hard | ★★ |
| CSS設計（BEM / CSS Modules / Tailwind） | Easy | ★★ |
| アクセシビリティ（ARIA） | Medium | ★ |
| パフォーマンス（Core Web Vitals / Lazy Loading） | Hard | ★★ |

---

## 9. 将来の拡張ロードマップ

- CS基礎（アルゴリズム・データ構造）トピックの追加
- システム設計 / ネットワーク / DB トピックの追加
- Embeddingベクトルによるセマンティック重複チェック（Supabase pgvector）
- 他ユーザーへの公開・SaaSへの展開
