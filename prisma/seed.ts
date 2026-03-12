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
    id: "b1b2c3d4-0001-4000-8000-000000000001",
    category_id: CATEGORY_JS_ID,
    name_ja: "クロージャ・スコープ",
    name_en: "Closures & Scope",
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
    id: "b1b2c3d4-0001-4000-8000-000000000004",
    category_id: CATEGORY_JS_ID,
    name_ja: "this キーワード",
    name_en: "this Keyword",
    sort_order: 4,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000005",
    category_id: CATEGORY_JS_ID,
    name_ja: "型システム（Generics / Utility Types）",
    name_en: "Type System (Generics / Utility Types)",
    sort_order: 5,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000006",
    category_id: CATEGORY_JS_ID,
    name_ja: "ES6+（分割代入 / spread / optional chaining）",
    name_en: "ES6+ (Destructuring / Spread / Optional Chaining)",
    sort_order: 6,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000007",
    category_id: CATEGORY_JS_ID,
    name_ja: "メモリ管理・ガベージコレクション",
    name_en: "Memory Management & Garbage Collection",
    sort_order: 7,
  },
  // React / フロントエンド（7件）
  {
    id: "b1b2c3d4-0001-4000-8000-000000000008",
    category_id: CATEGORY_REACT_ID,
    name_ja: "Virtual DOM・Reconciliation",
    name_en: "Virtual DOM & Reconciliation",
    sort_order: 8,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000009",
    category_id: CATEGORY_REACT_ID,
    name_ja: "Hooks（useState / useEffect / useCallback / useMemo）",
    name_en: "Hooks (useState / useEffect / useCallback / useMemo)",
    sort_order: 9,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000010",
    category_id: CATEGORY_REACT_ID,
    name_ja: "コンポーネント設計・再レンダリング最適化",
    name_en: "Component Design & Re-render Optimization",
    sort_order: 10,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000011",
    category_id: CATEGORY_REACT_ID,
    name_ja: "状態管理（Context / Redux / Zustand 比較）",
    name_en: "State Management (Context / Redux / Zustand)",
    sort_order: 11,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000012",
    category_id: CATEGORY_REACT_ID,
    name_ja: "CSS設計（BEM / CSS Modules / Tailwind）",
    name_en: "CSS Architecture (BEM / CSS Modules / Tailwind)",
    sort_order: 12,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000013",
    category_id: CATEGORY_REACT_ID,
    name_ja: "アクセシビリティ（ARIA）",
    name_en: "Accessibility (ARIA)",
    sort_order: 13,
  },
  {
    id: "b1b2c3d4-0001-4000-8000-000000000014",
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

  // --- サンプル問題の投入 ---
  console.log("Seeding sample questions...");

  const topicId = "b1b2c3d4-0001-4000-8000-000000000001"; // クロージャ・スコープ

  const sampleQuestions = [
    // 1. multiple（選択式）— medium
    {
      topic_id: topicId,
      type: "multiple",
      difficulty: "medium",
      question_ja:
        "JavaScriptにおけるクロージャの説明として、最も正しいものはどれですか？",
      question_en:
        "Which of the following best describes a closure in JavaScript?",
      options: [
        {
          label: "A",
          text_ja:
            "関数が定義されたスコープの変数にアクセスし続けられる仕組み",
          text_en:
            "A mechanism that allows a function to retain access to variables from its defining scope",
        },
        {
          label: "B",
          text_ja:
            "関数が呼び出されるたびに新しいグローバル変数が作られる仕組み",
          text_en:
            "A mechanism that creates new global variables each time a function is called",
        },
        {
          label: "C",
          text_ja:
            "関数の実行が終了するとすべてのローカル変数が即座に破棄される仕組み",
          text_en:
            "A mechanism that immediately destroys all local variables when a function finishes execution",
        },
        {
          label: "D",
          text_ja: "オブジェクトのプロパティをプライベートにするための構文",
          text_en: "A syntax for making object properties private",
        },
      ],
      answer: { correct_index: 0 },
      explanation_ja:
        "クロージャとは、関数が自身の外側のスコープにある変数への参照を保持し、外側の関数が実行を終えた後もその変数にアクセスできる仕組みです。これはJavaScriptのレキシカルスコープに基づいています。",
      explanation_en:
        "A closure is when a function retains references to variables in its outer scope, allowing access even after the outer function has finished execution. This is based on JavaScript's lexical scoping.",
    },
    // 2. code（コードリーディング）— medium
    {
      topic_id: topicId,
      type: "code",
      difficulty: "medium",
      question_ja: `次のコードの出力結果は何ですか？

\`\`\`javascript
function makeCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counter = makeCounter();
console.log(counter());
console.log(counter());
console.log(counter());
\`\`\``,
      question_en: `What is the output of the following code?

\`\`\`javascript
function makeCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counter = makeCounter();
console.log(counter());
console.log(counter());
console.log(counter());
\`\`\``,
      options: [
        { label: "A", text_ja: "1, 2, 3", text_en: "1, 2, 3" },
        { label: "B", text_ja: "0, 1, 2", text_en: "0, 1, 2" },
        { label: "C", text_ja: "1, 1, 1", text_en: "1, 1, 1" },
        {
          label: "D",
          text_ja: "undefined, undefined, undefined",
          text_en: "undefined, undefined, undefined",
        },
      ],
      answer: { correct_index: 0 },
      explanation_ja:
        "`makeCounter`はクロージャを返します。内部関数は外側の`count`変数への参照を保持するため、呼び出しごとに`count`がインクリメントされ、1, 2, 3が順に出力されます。",
      explanation_en:
        "`makeCounter` returns a closure. The inner function retains a reference to the outer `count` variable, so each call increments `count`, outputting 1, 2, 3 in sequence.",
    },
    // 3. truefalse（True/False）— easy
    {
      topic_id: topicId,
      type: "truefalse",
      difficulty: "easy",
      question_ja:
        "JavaScriptでは、関数内で定義された変数は、その関数の実行が終了した後でも、クロージャを通じて参照され続ける場合がある。",
      question_en:
        "In JavaScript, variables defined inside a function can continue to be referenced through a closure even after the function has finished execution.",
      options: null,
      answer: { correct_value: true },
      explanation_ja:
        "正解はTrueです。クロージャによって、内部関数が外部関数のスコープ内の変数への参照を保持するため、外部関数の実行が終了した後もその変数はガベージコレクションの対象にならず、アクセス可能です。",
      explanation_en:
        "The answer is True. Through closures, an inner function retains references to variables in the outer function's scope, so those variables remain accessible and are not garbage collected even after the outer function has finished execution.",
    },
    // 4. explain（口頭説明）— hard
    {
      topic_id: topicId,
      type: "explain",
      difficulty: "hard",
      question_ja:
        "クロージャとは何か、そしてなぜJavaScriptで重要なのかを説明してください。実際のユースケースを少なくとも2つ挙げてください。",
      question_en:
        "Explain what closures are and why they are important in JavaScript. Provide at least two real-world use cases.",
      options: {
        rubric_ja: {
          "1": "クロージャの基本概念を説明できない",
          "2": "クロージャの基本は説明できるが、ユースケースが不十分または不正確",
          "3": "クロージャを正確に説明し、適切なユースケースを2つ挙げられる",
          "4": "クロージャの仕組みをレキシカルスコープから深く説明し、メモリへの影響やエッジケースにも言及できる",
        },
        rubric_en: {
          "1": "Cannot explain the basic concept of closures",
          "2": "Can explain basics but use cases are insufficient or inaccurate",
          "3": "Accurately explains closures and provides two appropriate use cases",
          "4": "Deeply explains closures from lexical scoping, mentioning memory implications and edge cases",
        },
      },
      answer: {
        model_answer_ja:
          "クロージャとは、関数がそのレキシカルスコープ（定義時のスコープ）にある変数への参照を保持する仕組みです。JavaScriptでは関数がファーストクラスオブジェクトであるため、関数を返り値にしたり変数に代入したりする際にクロージャが自然に生まれます。\n\n重要な理由：(1) データのカプセル化 — クロージャを使うことでプライベートな状態を持つ関数を作れます（モジュールパターン）。(2) 関数ファクトリ — 設定値を閉じ込めた特化関数を動的に生成できます。\n\nユースケース例：\n1. カウンターやアキュムレーター — 内部状態を保持しつつ、外部から直接変更できない関数を作る\n2. イベントハンドラやコールバック — 登録時の状態を保持したまま、後から実行されるコールバック内でその状態を利用する\n\n注意点として、不要なクロージャはメモリリークの原因になりうるため、参照が不要になったら適切に解放することが重要です。",
        model_answer_en:
          "A closure is a mechanism where a function retains access to variables in its lexical scope (the scope where it was defined). In JavaScript, since functions are first-class objects, closures naturally occur when functions are returned or assigned to variables.\n\nWhy important: (1) Data encapsulation — closures enable creating functions with private state (module pattern). (2) Function factories — you can dynamically create specialized functions that capture configuration values.\n\nUse case examples:\n1. Counters/accumulators — creating functions that maintain internal state that cannot be directly modified externally\n2. Event handlers/callbacks — retaining state from registration time for use when the callback executes later\n\nNote: unnecessary closures can cause memory leaks, so it's important to release references when they are no longer needed.",
      },
      explanation_ja: "",
      explanation_en: "",
    },
  ];

  const { error: questionsError } = await supabase
    .from("questions")
    .insert(sampleQuestions);

  if (questionsError) {
    if (questionsError.code === "23505") {
      console.log("  ✓ sample questions already seeded, skipping");
    } else {
      console.error(
        "Failed to seed sample questions:",
        questionsError.message
      );
      process.exit(1);
    }
  } else {
    console.log(`  ✓ ${sampleQuestions.length} sample questions inserted`);
  }

  console.log("Seed completed successfully!");
};

main();
