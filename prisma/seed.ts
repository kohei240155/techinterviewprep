import { createClient } from "@supabase/supabase-js";

// シードスクリプトは service_role キーで RLS をバイパスして実行する
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set."
  );
  console.error(
    "Ensure .env.local (or .env.production) contains these variables."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CATEGORY_JS_ID = "a1b2c3d4-0001-4000-8000-000000000001";
const CATEGORY_REACT_ID = "a1b2c3d4-0001-4000-8000-000000000002";

const categories = [
  {
    id: CATEGORY_JS_ID,
    name_ja: "JavaScript / TypeScript",
    name_en: "JavaScript / TypeScript",
    sort_order: 1,
  },
  {
    id: CATEGORY_REACT_ID,
    name_ja: "React / フロントエンド",
    name_en: "React / Frontend",
    sort_order: 2,
  },
];

const topics = [
  // JavaScript / TypeScript（7件）
  {
    category_id: CATEGORY_JS_ID,
    name_ja: "クロージャ・スコープ",
    name_en: "Closures & Scope",
    sort_order: 1,
  },
  {
    category_id: CATEGORY_JS_ID,
    name_ja: "プロトタイプ・継承",
    name_en: "Prototypes & Inheritance",
    sort_order: 2,
  },
  {
    category_id: CATEGORY_JS_ID,
    name_ja: "非同期処理（Promise / async-await / イベントループ）",
    name_en: "Async / Promises / Event Loop",
    sort_order: 3,
  },
  {
    category_id: CATEGORY_JS_ID,
    name_ja: "this キーワード",
    name_en: "this Keyword",
    sort_order: 4,
  },
  {
    category_id: CATEGORY_JS_ID,
    name_ja: "型システム（Generics / Utility Types）",
    name_en: "Type System (Generics / Utility Types)",
    sort_order: 5,
  },
  {
    category_id: CATEGORY_JS_ID,
    name_ja: "ES6+（分割代入 / spread / optional chaining）",
    name_en: "ES6+ (Destructuring / Spread / Optional Chaining)",
    sort_order: 6,
  },
  {
    category_id: CATEGORY_JS_ID,
    name_ja: "メモリ管理・ガベージコレクション",
    name_en: "Memory Management & Garbage Collection",
    sort_order: 7,
  },
  // React / フロントエンド（7件）
  {
    category_id: CATEGORY_REACT_ID,
    name_ja: "Virtual DOM・Reconciliation",
    name_en: "Virtual DOM & Reconciliation",
    sort_order: 8,
  },
  {
    category_id: CATEGORY_REACT_ID,
    name_ja: "Hooks（useState / useEffect / useCallback / useMemo）",
    name_en: "Hooks (useState / useEffect / useCallback / useMemo)",
    sort_order: 9,
  },
  {
    category_id: CATEGORY_REACT_ID,
    name_ja: "コンポーネント設計・再レンダリング最適化",
    name_en: "Component Design & Re-render Optimization",
    sort_order: 10,
  },
  {
    category_id: CATEGORY_REACT_ID,
    name_ja: "状態管理（Context / Redux / Zustand 比較）",
    name_en: "State Management (Context / Redux / Zustand)",
    sort_order: 11,
  },
  {
    category_id: CATEGORY_REACT_ID,
    name_ja: "CSS設計（BEM / CSS Modules / Tailwind）",
    name_en: "CSS Architecture (BEM / CSS Modules / Tailwind)",
    sort_order: 12,
  },
  {
    category_id: CATEGORY_REACT_ID,
    name_ja: "アクセシビリティ（ARIA）",
    name_en: "Accessibility (ARIA)",
    sort_order: 13,
  },
  {
    category_id: CATEGORY_REACT_ID,
    name_ja: "パフォーマンス（Core Web Vitals / Lazy Loading）",
    name_en: "Performance (Core Web Vitals / Lazy Loading)",
    sort_order: 14,
  },
];

const main = async () => {
  console.log("Seeding categories...");
  const { error: catError } = await supabase
    .from("categories")
    .upsert(categories, { onConflict: "id" });

  if (catError) {
    console.error("Failed to seed categories:", catError.message);
    process.exit(1);
  }
  console.log(`  ✓ ${categories.length} categories upserted`);

  console.log("Seeding topics...");
  const { error: topicError } = await supabase
    .from("topics")
    .insert(topics);

  if (topicError) {
    // 重複エラーの場合はスキップ（既にシード済み）
    if (topicError.code === "23505") {
      console.log("  ✓ topics already seeded, skipping");
    } else {
      console.error("Failed to seed topics:", topicError.message);
      process.exit(1);
    }
  } else {
    console.log(`  ✓ ${topics.length} topics inserted`);
  }

  console.log("Seed completed successfully!");
};

main();
