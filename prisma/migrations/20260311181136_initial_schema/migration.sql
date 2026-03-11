-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL DEFAULT '',
    "avatar_url" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name_ja" TEXT NOT NULL,
    "name_en" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "name_ja" TEXT NOT NULL,
    "name_en" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "question_ja" TEXT NOT NULL,
    "question_en" TEXT NOT NULL DEFAULT '',
    "options" JSONB,
    "answer" JSONB NOT NULL,
    "explanation_ja" TEXT NOT NULL DEFAULT '',
    "explanation_en" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "result" TEXT NOT NULL,
    "answered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stability" REAL,
    "difficulty_fsrs" REAL,
    "due_date" TIMESTAMPTZ,
    "rating" INTEGER,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "state" INTEGER NOT NULL DEFAULT 0,
    "last_review" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_ja_key" ON "categories"("name_ja");

-- CreateIndex
CREATE INDEX "idx_topics_category_id" ON "topics"("category_id");

-- CreateIndex
CREATE INDEX "idx_questions_topic_id" ON "questions"("topic_id");

-- CreateIndex
CREATE INDEX "idx_questions_topic_difficulty" ON "questions"("topic_id", "difficulty");

-- CreateIndex
CREATE INDEX "idx_progress_user_id" ON "progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "progress_user_id_question_id_key" ON "progress"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "idx_bookmarks_user_id" ON "bookmarks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_question_id_key" ON "bookmarks"("user_id", "question_id");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "topics_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ==============================================================
-- 以下: Prisma スキーマでは表現できない追加定義
-- ==============================================================

-- FK: users.id → auth.users(id)
ALTER TABLE "users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES auth.users(id) ON DELETE CASCADE;

-- CHECK制約
ALTER TABLE "questions" ADD CONSTRAINT "questions_type_check" CHECK ("type" IN ('multiple', 'code', 'truefalse', 'explain'));
ALTER TABLE "questions" ADD CONSTRAINT "questions_difficulty_check" CHECK ("difficulty" IN ('easy', 'medium', 'hard'));
ALTER TABLE "progress" ADD CONSTRAINT "progress_result_check" CHECK ("result" IN ('correct', 'wrong', 'skipped'));
ALTER TABLE "progress" ADD CONSTRAINT "progress_rating_check" CHECK ("rating" BETWEEN 1 AND 4);
ALTER TABLE "progress" ADD CONSTRAINT "progress_state_check" CHECK ("state" BETWEEN 0 AND 3);

-- 部分インデックス
CREATE INDEX idx_progress_due ON "progress" ("user_id", "due_date") WHERE "due_date" IS NOT NULL;

-- ----------------------------------------------------------
-- RLS 有効化 + ポリシー
-- ----------------------------------------------------------

ALTER TABLE "users"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "topics"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "progress"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarks"  ENABLE ROW LEVEL SECURITY;

-- categories: 誰でも読み取り可
CREATE POLICY categories_select_public ON "categories"
  FOR SELECT USING (true);

-- topics: 誰でも読み取り可
CREATE POLICY topics_select_public ON "topics"
  FOR SELECT USING (true);

-- questions: 誰でも読み取り可
CREATE POLICY questions_select_public ON "questions"
  FOR SELECT USING (true);

-- users: 本人のみ
CREATE POLICY users_select_own ON "users"
  FOR SELECT USING (id = (SELECT auth.uid()));

CREATE POLICY users_update_own ON "users"
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- progress: 本人のみ（SELECT / INSERT / UPDATE）
CREATE POLICY progress_select_own ON "progress"
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY progress_insert_own ON "progress"
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY progress_update_own ON "progress"
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- bookmarks: 本人のみ（SELECT / INSERT / DELETE）
CREATE POLICY bookmarks_select_own ON "bookmarks"
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY bookmarks_insert_own ON "bookmarks"
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY bookmarks_delete_own ON "bookmarks"
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ----------------------------------------------------------
-- トリガー: Auth ユーザー作成時に users を自動挿入
-- ----------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
