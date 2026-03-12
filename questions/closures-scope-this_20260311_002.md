# Closures, Scope & this — 問題レビュー

- **Topic ID**: b1b2c3d4-0001-4000-8000-000000000001
- **Total**: 15
- **Difficulty**: easy 3 / medium 8 / hard 4
- **Types**: multiple 7 / code 4 / truefalse 3 / explain 1

---

## Q1. [multiple] [easy]

**JA**: JavaScriptにおいて、関数内で変数を解決する際のスコープチェーンの探索順序として正しいものはどれですか？

**EN**: Which of the following correctly describes the order in which JavaScript traverses the scope chain when resolving a variable inside a function?

**選択肢**:
- A: グローバルスコープ → 外側の関数スコープ → 自身のローカルスコープ / Global scope → Outer function scope → Own local scope
- B: 自身のローカルスコープ → 外側の関数スコープ → グローバルスコープ / Own local scope → Outer function scope → Global scope
- C: 自身のローカルスコープ → グローバルスコープ → 外側の関数スコープ / Own local scope → Global scope → Outer function scope
- D: 外側の関数スコープ → 自身のローカルスコープ → グローバルスコープ / Outer function scope → Own local scope → Global scope

**正解**: B (correct_index: 1)

**解説 JA**: JavaScriptエンジンは変数を解決する際、まず自身のローカルスコープを探し、見つからなければ外側の関数スコープを探し、最終的にグローバルスコープまで遡ります。これが「スコープチェーン」です。レキシカルスコープ（静的スコープ）に基づいており、関数が「どこで定義されたか」によってチェーンが決まります。実行時の呼び出し位置は関係ありません。

**解説 EN**: When resolving a variable, the JavaScript engine first searches the function's own local scope, then moves outward to enclosing function scopes, and finally reaches the global scope. This is called the "scope chain." It is based on lexical (static) scoping, meaning the chain is determined by where the function is defined, not where it is called.

---

## Q2. [multiple] [medium]

**JA**: 次のうち、IIFE（即時実行関数式）がクロージャと組み合わせて使われる主な理由として最も適切なものはどれですか？

**EN**: Which of the following best describes the primary reason IIFEs (Immediately Invoked Function Expressions) are used in combination with closures?

**選択肢**:
- A: 関数の実行速度を向上させるため / To improve function execution speed
- B: 新しいスコープを作り、変数をカプセル化して外部からのアクセスを防ぐため / To create a new scope that encapsulates variables and prevents external access
- C: グローバル変数を効率的に管理するため / To efficiently manage global variables
- D: 非同期処理のコールバック地獄を解決するため / To solve callback hell in asynchronous processing

**正解**: B (correct_index: 1)

**解説 JA**: IIFEは即座に実行されて新しい関数スコープを生成します。この中で定義された変数は外部からアクセスできません。モジュールパターンの基盤として、IIFEが返す関数（クロージャ）だけが内部変数にアクセスできるようにすることで、プライベートな状態を実現します。ES Modulesが普及する前は、名前空間の汚染を防ぐ主要なパターンでした。

**解説 EN**: An IIFE executes immediately and creates a new function scope. Variables defined inside are inaccessible from outside. As the foundation of the module pattern, only the returned functions (closures) can access the internal variables, achieving private state. Before ES Modules became widespread, this was the primary pattern for preventing namespace pollution.

---

## Q3. [code] [medium]

**JA**: 次のコードの出力結果はどうなりますか？また、なぜそうなるのか考えてください。

```javascript
function createMultiplier(x) {
  return function(y) {
    return x * y;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));
console.log(triple(5));
console.log(double === triple);
```

**EN**: What will be the output of the following code? Think about why it produces that result.

```javascript
function createMultiplier(x) {
  return function(y) {
    return x * y;
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);

console.log(double(5));
console.log(triple(5));
console.log(double === triple);
```

**選択肢**:
- A: `10`, `15`, `true`
- B: `10`, `15`, `false`
- C: `15`, `15`, `false`
- D: `10`, `10`, `true`

**正解**: B (correct_index: 1)

**解説 JA**: `createMultiplier`を呼び出すたびに新しいクロージャが生成され、それぞれが独自の`x`の値を保持します。`double`は`x=2`、`triple`は`x=3`をキャプチャしているため、`double(5)`は`10`、`triple(5)`は`15`を返します。`double === triple`が`false`なのは、各呼び出しが新しい関数オブジェクトを生成するためです。同じ関数から生成されても、異なるオブジェクトとして扱われます。これはクロージャが「値のコピー」ではなく「独立した環境の参照」を持つことを示しています。

**解説 EN**: Each call to `createMultiplier` creates a new closure with its own captured value of `x`. `double` captures `x=2` and `triple` captures `x=3`, so `double(5)` returns `10` and `triple(5)` returns `15`. `double === triple` is `false` because each call creates a new function object — even though they come from the same function, they are distinct objects. This illustrates that closures hold references to independent environments, not copies of values.

---

## Q4. [code] [medium]

**JA**: 次のコードの出力結果はどうなりますか？変数シャドウイングがクロージャにどう影響するか考えてください。

```javascript
let x = 'global';

function outer() {
  let x = 'outer';

  function middle() {
    let x = 'middle';

    function inner() {
      console.log(x);
    }

    return inner;
  }

  return middle;
}

const middleFn = outer();
const innerFn = middleFn();
innerFn();
```

**EN**: What will be the output of the following code? Consider how variable shadowing affects the closure.

```javascript
let x = 'global';

function outer() {
  let x = 'outer';

  function middle() {
    let x = 'middle';

    function inner() {
      console.log(x);
    }

    return inner;
  }

  return middle;
}

const middleFn = outer();
const innerFn = middleFn();
innerFn();
```

**選択肢**:
- A: `"global"`
- B: `"outer"`
- C: `"middle"`
- D: `ReferenceError`が発生する / A `ReferenceError` is thrown

**正解**: C (correct_index: 2)

**解説 JA**: `inner`関数は自身のスコープに`x`がないため、スコープチェーンを上に辿ります。最も近い外側のスコープである`middle`に`x = 'middle'`があるため、そこで解決されます。これが「変数シャドウイング」です — 内側のスコープの`x`が外側の同名変数を隠します。`inner`がクロージャとしてどこで実行されようと、定義時のレキシカルスコープに基づいて変数を解決するため、常に`"middle"`が出力されます。3つの`x`はそれぞれ独立した変数であり、名前が同じだけです。

**解説 EN**: The `inner` function has no `x` in its own scope, so it traverses up the scope chain. The nearest enclosing scope with `x` is `middle`, where `x = 'middle'`, so it resolves there. This is "variable shadowing" — the inner scope's `x` hides the outer variable with the same name. Regardless of where `inner` is executed as a closure, it resolves variables based on its lexical scope at definition time, always outputting `"middle"`. The three `x` variables are independent; they only share the same name.

---

## Q5. [multiple] [easy]

**JA**: クロージャが「値のコピー」ではなく「変数への参照」を保持することを最もよく示している現象はどれですか？

**EN**: Which of the following phenomena best demonstrates that closures capture a reference to the variable, not a copy of its value?

**選択肢**:
- A: クロージャ内から外側の変数を読み取れること / Being able to read an outer variable from within a closure
- B: 外側の変数が後から変更されると、クロージャから読み取る値も変わること / When the outer variable is changed later, the value read from the closure also changes
- C: クロージャが新しい関数オブジェクトとして生成されること / The closure being created as a new function object
- D: クロージャが外側のスコープの変数を上書きできないこと / The closure being unable to overwrite variables in the outer scope

**正解**: B (correct_index: 1)

**解説 JA**: クロージャは外側のスコープの変数そのもの（参照）を保持します。値のコピーではないため、外側で変数が変更されると、クロージャから読み取る値も変わります。逆にクロージャ内で変数を変更すると、外側にも反映されます。例えば `let x = 1; const fn = () => x; x = 2; fn()` は `2` を返します。この「参照のキャプチャ」という性質が、ループ+`var`+`setTimeout`の古典的な問題の原因でもあります。選択肢Dは誤りで、クロージャは外側の変数を変更できます。

**解説 EN**: Closures capture the variable itself (a reference), not a copy of its value. Since it's not a copy, if the outer variable changes, the value read from the closure changes too. Conversely, modifying the variable inside the closure is reflected outside. For example, `let x = 1; const fn = () => x; x = 2; fn()` returns `2`. This "capture by reference" behavior is also the root cause of the classic loop + `var` + `setTimeout` problem. Option D is incorrect — closures can modify outer variables.

---

## Q6. [code] [hard]

**JA**: 次のコードの出力結果はどうなりますか？各`console.log`が実行される時点での変数の状態を追ってみてください。

```javascript
function outer() {
  let count = 0;

  function inner() {
    count++;
    console.log(count);
  }

  return inner;
}

const fn1 = outer();
const fn2 = outer();

fn1();
fn1();
fn2();
fn1();
```

**EN**: What will be the output of the following code? Trace the state of the variable at each `console.log` execution.

```javascript
function outer() {
  let count = 0;

  function inner() {
    count++;
    console.log(count);
  }

  return inner;
}

const fn1 = outer();
const fn2 = outer();

fn1();
fn1();
fn2();
fn1();
```

**選択肢**:
- A: `1`, `2`, `3`, `4`
- B: `1`, `2`, `1`, `3`
- C: `1`, `1`, `1`, `1`
- D: `1`, `2`, `1`, `2`

**正解**: B (correct_index: 1)

**解説 JA**: `outer()`を呼ぶたびに新しいレキシカル環境が生成され、それぞれ独立した`count`変数が存在します。`fn1`と`fn2`は異なる`outer()`呼び出しから返されたクロージャなので、それぞれ独自の`count`を持ちます。`fn1()`を2回呼ぶと`count`は`1→2`に。`fn2()`は別の`count`を持つので`1`を出力。その後`fn1()`を呼ぶと元の`count`が`3`になります。クロージャは変数の「値」ではなく「参照」を保持するため、呼び出しごとに状態が変化します。かつ、各`outer()`呼び出しは独立した環境を作ります。

**解説 EN**: Each call to `outer()` creates a new lexical environment with its own independent `count` variable. `fn1` and `fn2` are closures from different `outer()` calls, so they have separate `count` variables. Calling `fn1()` twice increments its `count` to `1` then `2`. `fn2()` has a different `count`, outputting `1`. Calling `fn1()` again increments its `count` to `3`. Closures retain a reference to the variable, not a copy of its value, so the state changes with each call. And each `outer()` invocation creates an independent environment.

---

## Q7. [multiple] [medium]

**JA**: 次のコードで、`privateVar`に外部からアクセスできない理由を最も正確に説明しているのはどれですか？

```javascript
const module = (function() {
  let privateVar = 42;
  return {
    getVar: () => privateVar,
    setVar: (val) => { privateVar = val; }
  };
})();
```

**EN**: Which of the following most accurately explains why `privateVar` is not accessible from outside in the following code?

```javascript
const module = (function() {
  let privateVar = 42;
  return {
    getVar: () => privateVar,
    setVar: (val) => { privateVar = val; }
  };
})();
```

**選択肢**:
- A: `let`はブロックスコープを持つため、IIFEの外からはアクセスできない / `let` has block scope, so it cannot be accessed from outside the IIFE
- B: IIFEが関数スコープを生成し、`privateVar`はそのスコープ内にのみ存在する。返されたメソッドはクロージャとして`privateVar`への参照を保持するが、外部コードは直接アクセスできない / The IIFE creates a function scope where `privateVar` exists only within it. The returned methods retain a reference to `privateVar` as closures, but external code cannot access it directly
- C: `privateVar`は即時実行後にガベージコレクションされるが、返されたメソッドがキャッシュを保持する / `privateVar` is garbage collected after immediate execution, but the returned methods hold a cache
- D: オブジェクトのプロパティとして公開されていないため、JavaScriptのプロトタイプチェーンで見つからない / It is not exposed as an object property, so JavaScript's prototype chain cannot find it

**正解**: B (correct_index: 1)

**解説 JA**: IIFEは即座に実行されて関数スコープを作ります。`privateVar`はこのスコープ内のローカル変数です。返されたオブジェクトの`getVar`と`setVar`はクロージャとして、自身が定義されたレキシカル環境への参照を保持しているため、`privateVar`にアクセスし続けられます。しかし、外部コードはIIFEのスコープに入る手段がないため、`privateVar`に直接アクセスすることはできません。選択肢Aは部分的に正しいですが、ブロックスコープよりも関数スコープとクロージャの仕組みが本質的な理由です。選択肢Cは誤りで、クロージャが参照を保持しているためGCされません。

**解説 EN**: The IIFE executes immediately and creates a function scope. `privateVar` is a local variable within this scope. The returned `getVar` and `setVar` are closures that retain a reference to the lexical environment where they were defined, so they can continue to access `privateVar`. However, external code has no way to enter the IIFE's scope, making `privateVar` directly inaccessible. Option A is partially correct, but function scope and closures are the essential mechanism, not just block scoping. Option C is wrong — `privateVar` is not garbage collected because the closure holds a reference.

---

## Q8. [truefalse] [medium]

**JA**: 次のコードで、`const self = this;` のパターンが使われる理由は、通常の関数宣言のコールバック内では `this` が外側の `this` と異なる値を持つ可能性があるためである。

```javascript
function Timer() {
  const self = this;
  setTimeout(function() {
    self.elapsed = true;
  }, 1000);
}
```

**EN**: In the following code, the `const self = this;` pattern is used because inside a regular function callback, `this` may have a different value than the outer `this`.

```javascript
function Timer() {
  const self = this;
  setTimeout(function() {
    self.elapsed = true;
  }, 1000);
}
```

**正解**: true

**解説 JA**: 正解はTrueです。`setTimeout`に渡された通常の関数のコールバック内では、`this`はデフォルトバインディングによりグローバルオブジェクト（strictモードでは`undefined`）になります。`Timer`コンストラクタ内の`this`（新しいインスタンス）とは異なります。`const self = this`は`this`の値を通常の変数に保存することで、クロージャを通じてコールバック内からアクセス可能にするテクニックです。現在はアロー関数（レキシカル`this`）で同じことがより簡潔に実現できるため、このパターンはレガシーコードで見ることが多いですが、`this`の動的バインディングの仕組みを理解する上で重要です。

**解説 EN**: The answer is True. Inside the regular function callback passed to `setTimeout`, `this` is the global object (or `undefined` in strict mode) due to default binding — different from the `this` inside the `Timer` constructor (the new instance). `const self = this` saves the `this` value into a regular variable, making it accessible inside the callback through closure. Today, arrow functions (lexical `this`) achieve the same thing more concisely, so this pattern is mostly seen in legacy code, but it's important for understanding how `this` dynamic binding works.

---

## Q9. [multiple] [medium]

**JA**: 次のコードで`obj.greet()`を呼んだ場合、`this.name`はどのように解決されますか？

```javascript
const obj = {
  name: "Alice",
  greet: function() {
    const inner = function() {
      return this.name;
    };
    return inner();
  }
};

console.log(obj.greet());
```

**EN**: When `obj.greet()` is called in the following code, how is `this.name` resolved?

```javascript
const obj = {
  name: "Alice",
  greet: function() {
    const inner = function() {
      return this.name;
    };
    return inner();
  }
};

console.log(obj.greet());
```

**選択肢**:
- A: `"Alice"` — `inner`はクロージャとして`obj`の`this`を継承する / `"Alice"` — `inner` inherits `obj`'s `this` as a closure
- B: `undefined` — `inner`は通常の関数呼び出しなので`this`はグローバル（strictモードでは`undefined`）になる / `undefined` — `inner` is a regular function call so `this` is global (or `undefined` in strict mode)
- C: `TypeError`が発生する / A `TypeError` is thrown
- D: `""` — `this`は空のオブジェクトを参照する / `""` — `this` refers to an empty object

**正解**: B (correct_index: 1)

**解説 JA**: 通常の関数の`this`は「どのように呼ばれたか」で決まります（動的バインディング）。`inner()`は`obj.inner()`ではなく単なる関数呼び出しとして実行されるため、`this`は`obj`ではなくグローバルオブジェクト（strictモードでは`undefined`）になります。クロージャは外側のスコープの「変数」を保持しますが、`this`は変数ではないため、クロージャで自動的に保持されません。これを解決するには、アロー関数を使う（レキシカル`this`）、`.bind(this)`を使う、または外側で`const self = this`として変数に保存する方法があります。

**解説 EN**: A regular function's `this` is determined by how it is called (dynamic binding). `inner()` is called as a plain function, not as `obj.inner()`, so `this` is the global object (or `undefined` in strict mode), not `obj`. Closures retain outer scope variables, but `this` is not a variable, so it is not automatically captured by closures. Solutions include using arrow functions (lexical `this`), `.bind(this)`, or saving `this` to a variable like `const self = this`.

---

## Q10. [explain] [hard]

**JA**: クロージャがメモリに与える影響について説明してください。クロージャによるメモリリークが発生するシナリオと、それを防ぐためのベストプラクティスを具体例とともに述べてください。

**EN**: Explain how closures affect memory. Describe scenarios where closures can cause memory leaks and best practices to prevent them, with concrete examples.

**ルーブリック**:
| Score | JA | EN |
|-------|----|----|
| 1 | クロージャとメモリの関係を説明できない | Cannot explain the relationship between closures and memory |
| 2 | クロージャが変数を保持することは理解しているが、メモリリークのシナリオを具体的に説明できない | Understands closures retain variables but cannot concretely describe memory leak scenarios |
| 3 | メモリリークのシナリオを1つ以上説明でき、防止策も述べられる | Can describe at least one memory leak scenario and prevention measures |
| 4 | 複数のシナリオ（イベントリスナー、タイマー、DOM参照等）を説明し、GCの仕組みと関連付けて防止策を体系的に述べられる | Explains multiple scenarios (event listeners, timers, DOM references, etc.) and systematically describes prevention measures in relation to GC mechanisms |

**模範解答 JA**: クロージャは外側のスコープの変数への参照を保持するため、その変数はクロージャが存在する限りガベージコレクションされません。メモリリークが発生する典型的なシナリオは3つあります。(1) イベントリスナーの未解除：DOM要素にクロージャをイベントリスナーとして追加し、要素の削除時にリスナーを解除しないと、クロージャとそれが参照する変数がメモリに残り続けます。(2) タイマーの未クリア：`setInterval`のコールバックが外部変数を参照している場合、`clearInterval`しない限りクロージャとその変数は解放されません。(3) 不要なDOM参照の保持：クロージャ内でDOM要素への参照を保持すると、その要素がDOMツリーから削除されてもメモリ上に残ります。防止策としては、不要になったイベントリスナーを`removeEventListener`で解除する、タイマーを適切に`clearTimeout`/`clearInterval`する、WeakRefやWeakMapを使ってGCを妨げない参照を持つ、クロージャ内で必要な変数のみを参照するよう設計する、などがあります。

**模範解答 EN**: Closures retain references to variables in their outer scope, preventing those variables from being garbage collected as long as the closure exists. There are three typical scenarios where memory leaks occur: (1) Unreleased event listeners: When a closure is added as an event listener to a DOM element and the listener is not removed when the element is deleted, the closure and its referenced variables remain in memory. (2) Uncleared timers: When a `setInterval` callback references outer variables, the closure and those variables are not freed until `clearInterval` is called. (3) Retaining unnecessary DOM references: When a closure holds a reference to a DOM element, that element remains in memory even after being removed from the DOM tree. Prevention measures include removing event listeners with `removeEventListener` when no longer needed, properly clearing timers with `clearTimeout`/`clearInterval`, using WeakRef or WeakMap to hold references that don't prevent GC, and designing closures to reference only necessary variables.

---

## Q11. [code] [hard]

**JA**: 次のコードの出力結果はどうなりますか？`this`のバインディングがどのように変化するか追ってみてください。

```javascript
const obj = {
  value: 42,
  getValue: function() {
    return this.value;
  },
  getValueArrow: () => {
    return this.value;
  }
};

const { getValue, getValueArrow } = obj;

console.log(obj.getValue());
console.log(obj.getValueArrow());
console.log(getValue());
```

**EN**: What will be the output of the following code? Trace how `this` binding changes in each case.

```javascript
const obj = {
  value: 42,
  getValue: function() {
    return this.value;
  },
  getValueArrow: () => {
    return this.value;
  }
};

const { getValue, getValueArrow } = obj;

console.log(obj.getValue());
console.log(obj.getValueArrow());
console.log(getValue());
```

**選択肢**:
- A: `42`, `42`, `42`
- B: `42`, `undefined`, `undefined`
- C: `42`, `42`, `undefined`
- D: `42`, `undefined`, `42`

**正解**: B (correct_index: 1)

**解説 JA**: `obj.getValue()`は暗黙的バインディングで`this`が`obj`になるため`42`を返します。`obj.getValueArrow()`はアロー関数なので、定義時のレキシカルスコープの`this`を使います。オブジェクトリテラルはスコープを作らないため、`this`はモジュールスコープ（`undefined`）またはグローバルオブジェクトになります。よって`undefined`。`getValue()`は分割代入で取り出した単独の関数呼び出しなので、暗黙的バインディングが失われ、`this`はグローバル（strictモードでは`undefined`）になります。これは重要な落とし穴です：オブジェクトリテラルの中でアロー関数をメソッドとして定義すると、`this`が期待通りにならないことがあります。

**解説 EN**: `obj.getValue()` uses implicit binding so `this` is `obj`, returning `42`. `obj.getValueArrow()` is an arrow function that uses `this` from its lexical scope at definition time. Object literals do not create a scope, so `this` is the module scope (`undefined`) or the global object — hence `undefined`. `getValue()` is a standalone function call after destructuring, losing implicit binding, so `this` is global (or `undefined` in strict mode). This is an important pitfall: defining arrow functions as methods in object literals can lead to unexpected `this` behavior.

---

## Q12. [truefalse] [medium]

**JA**: クロージャは外側のスコープの変数すべてを保持するため、クロージャ内で参照していない変数もガベージコレクションされない。

**EN**: Closures retain all variables from the outer scope, so even variables not referenced inside the closure are not garbage collected.

**正解**: false

**解説 JA**: 正解はFalseです。現代のJavaScriptエンジン（V8など）は最適化を行い、クロージャが実際に参照している変数のみを保持します。参照されていない変数はGCの対象になります。ただし、`eval()`がクロージャ内で使われている場合は例外で、エンジンは実行時にどの変数が必要になるか予測できないため、すべての変数を保持する必要があります。また、デバッガを使用している場合も、デバッグのためにすべての変数が保持されることがあります。この最適化は仕様ではなくエンジンの実装詳細ですが、実践上は信頼できます。

**解説 EN**: The answer is False. Modern JavaScript engines (like V8) optimize closures to retain only the variables actually referenced by the closure. Unreferenced variables are eligible for GC. However, if `eval()` is used inside the closure, the engine cannot predict which variables will be needed at runtime, so it must retain all variables. Similarly, when using a debugger, all variables may be retained for debugging purposes. This optimization is an engine implementation detail rather than a spec requirement, but it is reliable in practice.

---

## Q13. [multiple] [medium]

**JA**: 次のコードで、カリー化（currying）とクロージャの関係について最も正確な説明はどれですか？

```javascript
function curry(fn) {
  return function(a) {
    return function(b) {
      return fn(a, b);
    };
  };
}

const add = curry((x, y) => x + y);
const add5 = add(5);
console.log(add5(3)); // 8
```

**EN**: Which of the following most accurately describes the relationship between currying and closures in the following code?

```javascript
function curry(fn) {
  return function(a) {
    return function(b) {
      return fn(a, b);
    };
  };
}

const add = curry((x, y) => x + y);
const add5 = add(5);
console.log(add5(3)); // 8
```

**選択肢**:
- A: カリー化はクロージャとは無関係で、単に関数を入れ子にしているだけ / Currying is unrelated to closures; it just nests functions
- B: 各返り値の関数がクロージャとして外側の引数（`fn`、`a`）を保持するため、部分適用が実現できる / Each returned function is a closure that retains the outer arguments (`fn`, `a`), enabling partial application
- C: カリー化は引数を配列に保存して渡す手法であり、クロージャは使われていない / Currying stores arguments in an array, and closures are not used
- D: クロージャは`fn`のみを保持し、`a`は即座に評価されて破棄される / The closure only retains `fn`, and `a` is immediately evaluated and discarded

**正解**: B (correct_index: 1)

**解説 JA**: カリー化はクロージャの代表的な応用例です。`curry(fn)`を呼ぶと、`fn`をクロージャでキャプチャした関数が返されます。次に`add(5)`を呼ぶと、`fn`と`a=5`の両方をキャプチャした新しいクロージャが返されます。最終的に`add5(3)`を呼ぶと、保持されていた`fn`、`a=5`、新たな`b=3`を使って`fn(5, 3)`が実行されます。このようにクロージャが引数を段階的に「記憶」することで、関数の部分適用（partial application）が可能になります。関数型プログラミングの基本テクニックです。

**解説 EN**: Currying is a classic application of closures. Calling `curry(fn)` returns a function that captures `fn` via closure. Then calling `add(5)` returns a new closure capturing both `fn` and `a=5`. Finally, `add5(3)` executes `fn(5, 3)` using the retained `fn`, `a=5`, and the new `b=3`. Closures "remember" arguments incrementally, enabling partial application. This is a fundamental technique in functional programming.

---

## Q14. [truefalse] [medium]

**JA**: オブジェクトリテラルの`{}`はブロックスコープを生成するため、オブジェクト内で定義されたメソッドはオブジェクトのスコープに対するクロージャを形成する。

**EN**: Object literal `{}` creates a block scope, so methods defined within the object form closures over the object's scope.

**正解**: false

**解説 JA**: 正解はFalseです。オブジェクトリテラルの`{}`はブロックスコープを生成しません。`if`文や`for`ループの`{}`とは異なり、オブジェクトリテラルの波括弧は単なるオブジェクト構文です。そのため、オブジェクト内のメソッドが「オブジェクトのスコープ」に対してクロージャを形成することはありません。メソッドが外側の変数にアクセスする場合、それはオブジェクトを囲む関数スコープやモジュールスコープに対するクロージャです。この誤解は「`{}`ならスコープができる」という過度な一般化から生じます。スコープを作る`{}`は、ブロック文（`if`、`for`、単独の`{}`ブロック）と関数本体だけです。

**解説 EN**: The answer is False. Object literal `{}` does not create a block scope. Unlike `{}` in `if` statements or `for` loops, the curly braces in object literals are just object syntax. Therefore, methods within an object do not form closures over an "object scope." If a method accesses outer variables, it closes over the enclosing function scope or module scope, not the object. This misconception arises from overgeneralizing that all `{}` create scopes. Only block statements (`if`, `for`, standalone `{}` blocks) and function bodies create scopes.

---

## Q15. [multiple] [hard]

**JA**: 次のコードで、`class`構文内のプライベートフィールド（`#count`）とクロージャベースのプライベート変数の違いとして、最も正確な説明はどれですか？

```javascript
// クロージャベース
function createCounter() {
  let count = 0;
  return { increment: () => ++count, getCount: () => count };
}

// クラスベース
class Counter {
  #count = 0;
  increment() { return ++this.#count; }
  getCount() { return this.#count; }
}
```

**EN**: Which of the following most accurately describes the difference between private fields (`#count`) in `class` syntax and closure-based private variables in the following code?

```javascript
// Closure-based
function createCounter() {
  let count = 0;
  return { increment: () => ++count, getCount: () => count };
}

// Class-based
class Counter {
  #count = 0;
  increment() { return ++this.#count; }
  getCount() { return this.#count; }
}
```

**選択肢**:
- A: 両者は完全に同等であり、単なる構文の違いである / Both are completely equivalent; it's just a syntax difference
- B: クロージャ版はインスタンスごとにメソッドの新しい関数オブジェクトが生成されるが、クラス版はプロトタイプでメソッドを共有するためメモリ効率が良い / The closure version creates new function objects for methods per instance, while the class version shares methods via prototype, making it more memory-efficient
- C: クラスのプライベートフィールドはリフレクションでアクセス可能だが、クロージャ変数は絶対にアクセスできない / Class private fields are accessible via reflection, but closure variables are absolutely inaccessible
- D: クロージャ版はプライベートを実現できるが、継承をサポートしない。クラス版はプライベートと継承の両方をサポートする / The closure version can achieve privacy but doesn't support inheritance. The class version supports both privacy and inheritance

**正解**: B (correct_index: 1)

**解説 JA**: クロージャベースのパターンでは、`createCounter()`を呼ぶたびに`increment`と`getCount`の新しい関数オブジェクトが生成されます。100個のカウンターを作れば200個の関数オブジェクトがメモリに存在します。一方、クラスの`increment`と`getCount`は`Counter.prototype`に1つずつ存在し、全インスタンスで共有されます。メモリ効率の観点からは、多数のインスタンスを作る場合はクラスの方が有利です。選択肢Dも一部正しい点がありますが、クロージャベースでも継承的なパターンは実現可能であり、最も本質的な違いはメモリモデルの違い（インスタンスごと vs プロトタイプ共有）です。選択肢CのリフレクションについてはES2022のプライベートフィールドは通常のリフレクションではアクセスできません。

**解説 EN**: In the closure-based pattern, each call to `createCounter()` creates new function objects for `increment` and `getCount`. Creating 100 counters means 200 function objects in memory. In contrast, the class's `increment` and `getCount` exist once on `Counter.prototype` and are shared across all instances. For memory efficiency with many instances, classes are advantageous. Option D has some truth, but inheritance-like patterns are achievable with closures too; the most essential difference is the memory model (per-instance vs prototype-shared). Regarding Option C, ES2022 private fields are not accessible through normal reflection.
