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
  // JavaScript / TypeScript（9件）
  {
    id: "b1b2c3d4-0001-4000-8000-000000000001",
    category_id: CATEGORY_JS_ID,
    name_ja: "クロージャ・スコープ・this",
    name_en: "Closures, Scope & this",
    sort_order: 1,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000002",
    category_id: CATEGORY_JS_ID,
    name_ja: "プロトタイプ・継承",
    name_en: "Prototypes & Inheritance",
    sort_order: 2,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000003",
    category_id: CATEGORY_JS_ID,
    name_ja: "非同期処理（Promise / async-await / イベントループ）",
    name_en: "Async / Promises / Event Loop",
    sort_order: 3,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000005",
    category_id: CATEGORY_JS_ID,
    name_ja: "型システム（Generics / Utility Types）",
    name_en: "Type System (Generics / Utility Types)",
    sort_order: 4,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000006",
    category_id: CATEGORY_JS_ID,
    name_ja: "ES6+（分割代入 / spread / optional chaining）",
    name_en: "ES6+ (Destructuring / Spread / Optional Chaining)",
    sort_order: 5,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000007",
    category_id: CATEGORY_JS_ID,
    name_ja: "メモリ管理・ガベージコレクション",
    name_en: "Memory Management & Garbage Collection",
    sort_order: 6,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000015",
    category_id: CATEGORY_JS_ID,
    name_ja: "Webセキュリティ（XSS / CSRF / CORS）",
    name_en: "Web Security (XSS / CSRF / CORS)",
    sort_order: 7,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000016",
    category_id: CATEGORY_JS_ID,
    name_ja: "モジュールシステム・ビルドツール（ESM / Bundler / Tree Shaking）",
    name_en: "Module Systems & Build Tools (ESM / Bundler / Tree Shaking)",
    sort_order: 8,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000017",
    category_id: CATEGORY_JS_ID,
    name_ja: "ブラウザAPI・Web Platform（DOM / Storage / Web Workers）",
    name_en: "Browser APIs & Web Platform (DOM / Storage / Web Workers)",
    sort_order: 9,
  },
  // React / フロントエンド（10件）
  {
    id: "b1b2c3d4-0001-4000-8000-000000000008",
    category_id: CATEGORY_REACT_ID,
    name_ja: "Virtual DOM・Reconciliation",
    name_en: "Virtual DOM & Reconciliation",
    sort_order: 10,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000009",
    category_id: CATEGORY_REACT_ID,
    name_ja: "Hooks（useState / useEffect / useCallback / useMemo）",
    name_en: "Hooks (useState / useEffect / useCallback / useMemo)",
    sort_order: 11,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000010",
    category_id: CATEGORY_REACT_ID,
    name_ja: "コンポーネント設計・再レンダリング最適化",
    name_en: "Component Design & Re-render Optimization",
    sort_order: 12,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000011",
    category_id: CATEGORY_REACT_ID,
    name_ja: "状態管理（Context / Redux / Zustand 比較）",
    name_en: "State Management (Context / Redux / Zustand)",
    sort_order: 13,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000012",
    category_id: CATEGORY_REACT_ID,
    name_ja: "CSS設計（BEM / CSS Modules / Tailwind）",
    name_en: "CSS Architecture (BEM / CSS Modules / Tailwind)",
    sort_order: 14,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000013",
    category_id: CATEGORY_REACT_ID,
    name_ja: "アクセシビリティ（ARIA）",
    name_en: "Accessibility (ARIA)",
    sort_order: 15,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000014",
    category_id: CATEGORY_REACT_ID,
    name_ja: "パフォーマンス（Core Web Vitals / Lazy Loading）",
    name_en: "Performance (Core Web Vitals / Lazy Loading)",
    sort_order: 16,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000018",
    category_id: CATEGORY_REACT_ID,
    name_ja: "テスト戦略（Jest / React Testing Library / E2E）",
    name_en: "Testing (Jest / React Testing Library / E2E)",
    sort_order: 17,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000019",
    category_id: CATEGORY_REACT_ID,
    name_ja: "API通信・データフェッチ（REST / GraphQL / TanStack Query）",
    name_en: "API Communication & Data Fetching (REST / GraphQL / TanStack Query)",
    sort_order: 18,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000020",
    category_id: CATEGORY_REACT_ID,
    name_ja: "SSR・SSG・Server Components（Next.js）",
    name_en: "SSR / SSG / Server Components (Next.js)",
    sort_order: 19,
  },
];

const DELETED_TOPIC_IDS = [
  "b1b2c3d4-0001-4000-8000-000000000004", // 旧「this キーワード」→ closures に統合
];

const main = async () => {
  // --- 削除対象トピックのクリーンアップ ---
  console.log("Cleaning up deleted topics...");
  for (const topicId of DELETED_TOPIC_IDS) {
    // questions → progress は CASCADE or RLS で処理される前提
    const { error: delQErr } = await supabase
      .from("questions")
      .delete()
      .eq("topic_id", topicId);
    if (delQErr) {
      console.warn(`  ⚠ Failed to delete questions for topic ${topicId}:`, delQErr.message);
    }
    const { error: delTErr } = await supabase
      .from("topics")
      .delete()
      .eq("id", topicId);
    if (delTErr) {
      console.warn(`  ⚠ Failed to delete topic ${topicId}:`, delTErr.message);
    } else {
      console.log(`  ✓ Deleted topic ${topicId}`);
    }
  }

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
    .upsert(topics, { onConflict: "id" });

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
