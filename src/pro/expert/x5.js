// Chapter X5 — Functional Patterns & Immutability. See ../SCHEMA.md for the shape.

export default {
  id: 'x5',
  title: 'Functional Patterns & Immutability',
  tagline: 'Small pure functions, combined without surprises. The style large codebases trust.',
  badge: { name: 'Immutable Mind', emoji: '🧊' },
  intro: `You finished the intermediate track knowing how to make a program *do* things: loop, branch, transform, hold state. This chapter is about a different question — not how to make code run, but how to make code you can *trust and reason about* six months from now, on a team, under deadline. The answer the industry converged on has a name: **functional programming**, or more honestly, the functional *style*, because nobody is asking you to abandon loops and objects. They are asking you to prefer a handful of habits that make bugs rarer and code readable.

The load-bearing idea is the **pure function**: a function whose output depends only on its inputs, and which changes nothing else in the world. Feed it the same arguments and it hands back the same answer, today, tomorrow, on any machine, in any order. That single property — no hidden inputs, no hidden effects — is what makes code testable, cacheable, parallelizable, and above all *legible*. When you read a call to a pure function, you do not have to hold the rest of the program in your head. Everything that matters is right there in the arguments.

From that foundation the chapter builds a small, powerful toolkit. You will see functions that *return* functions, using closures to carry private state without a single \`class\`. You will **compose** small functions into pipelines, the way Unix pipes chain \`grep\` into \`sort\` into \`uniq\`. You will meet **currying** and **partial application** — turning one general function into a family of specialized ones. And you will learn **immutable updates**: changing data by producing a new copy rather than mutating the original in place, which is the single most important habit for surviving in a modern front-end or state-management codebase.

None of this is academic. React's entire change-detection model assumes you do not mutate. Redux is *defined* as a pure reducer over immutable state. Every senior code review you will ever sit in flags shared mutable state as a smell. An interviewer who asks "what's a pure function and why do we like them?" is checking whether you have crossed from *making it work* to *making it maintainable*. By the end of this chapter you will answer from muscle memory — and, more usefully, write that way by default.`,
  lessons: [
    {
      id: 'x5-l1',
      title: 'Pure Functions & Why They Are Testable',
      reading: `A **pure function** obeys two rules, and both matter. First, its return value is determined *entirely* by its arguments — no reading a global, no consulting the clock, no random numbers, no reaching into a database. Second, it produces no **side effects** — it does not mutate its arguments, does not write to a shared variable, does not touch the DOM or the network. Same inputs in, same output out, and the universe otherwise undisturbed. That is the whole definition, and everything good about the style flows from it.

Consider why this makes a function trivially testable. To test a pure function you supply arguments and check the return value. There is nothing to set up and nothing to tear down — no fixture, no mock database, no "arrange the global state just so." The test *is* the specification: \`applyDiscount(100, 25) === 75\`. Contrast that with an impure function that reads \`currentUser\` from somewhere and appends to a shared \`log\`; now your test has to construct that whole context and inspect it afterward. Purity is not a moral virtue, it is a practical one — it collapses the cost of verification to almost nothing.

The most common way functions go impure by accident is **mutating an argument**. Arrays and objects in JavaScript are passed by reference: when you pass an array to a function and the function calls \`.push\` on it, you have reached back through the reference and changed the caller's array. The function returned, but it also left a footprint outside itself. Now the caller's data is different, possibly in a way they never asked for, and a bug appears "at a distance" — far from the line that caused it. A pure function that needs a modified collection *returns a new one* and leaves the input pristine.

There is a mental model worth carrying: think of a pure function as a **mathematical function**, like \`f(x) = x²\`. The number 3 does not get "used up" or altered by being squared; it is just mapped to 9. Pure functions map inputs to outputs the same way. Nothing is consumed, nothing leaks. This is also why pure functions are safe to call in any order, to skip if you already know the answer (that is what caching, or *memoization*, exploits), and to run on many cores at once — none of them step on each other because none of them share mutable state.

Now, the honest caveat every engineer needs: a program of *only* pure functions does nothing observable. Eventually something must print, save, or render — those are side effects, and they are the point of software. The functional discipline is not to eliminate effects but to **push them to the edges**: a large pure core that computes *what should happen*, wrapped in a thin impure shell that actually makes it happen. When you hear "functional core, imperative shell," this is it. Your business logic stays pure and testable; the messy I/O lives in a small, obvious layer you can eyeball.

In this lesson you will write two pure functions and prove their purity holds — specifically that calling them does not disturb the data you pass in. Keep the definition in front of you: same inputs, same output, no footprints.`,
      task: `Write a pure function \`applyDiscount(price, pct)\` that returns the price with pct percent taken off (e.g. \`applyDiscount(100, 25)\` is 75). Then write a pure function \`cartTotal(items)\` that returns the sum of an array of numbers using \`reduce\`, without mutating \`items\`. The array \`cart\` is provided.`,
      starter: `const cart = [50, 80, 20];

// A pure function: output depends only on inputs, and it mutates nothing.

// function applyDiscount(price, pct) — return price minus pct% of price
function applyDiscount(price, pct) {
  return price; // TODO: subtract the discount
}

// function cartTotal(items) — sum the numbers with reduce, do NOT mutate items
function cartTotal(items) {
  return 0; // TODO
}
`,
      tests: [
        { name: 'applyDiscount computes the discounted price', code: `assert(applyDiscount(100, 25) === 75, 'applyDiscount(100, 25) should be 75 (100 minus 25%)')` },
        { name: 'applyDiscount is deterministic and handles other inputs', code: `assert(applyDiscount(200, 10) === 180 && applyDiscount(200, 10) === applyDiscount(200, 10), 'applyDiscount(200, 10) should be 180, and repeated calls with the same args must give the same answer')` },
        { name: 'cartTotal sums the array', code: `assert(cartTotal(cart) === 150, 'cartTotal([50,80,20]) should be 150')` },
        { name: 'cartTotal does not mutate its input (purity)', code: `const before = cart.slice(); cartTotal(cart); assert(cart.length === before.length && cart.every((v, i) => v === before[i]), 'cartTotal must not mutate cart — a pure function leaves its arguments untouched')` },
      ],
      hints: [
        'A discount of pct percent removes price * (pct / 100) from the price. Purity means: compute from the arguments only, and never change them — reduce reads the array without altering it.',
        'applyDiscount: `return price - price * (pct / 100);`. cartTotal: `return items.reduce((sum, n) => sum + n, 0);` — reduce walks the array and returns a fresh number, touching nothing.',
        'Write `function applyDiscount(price, pct) { return price - price * (pct / 100); }` and `function cartTotal(items) { return items.reduce((sum, n) => sum + n, 0); }`. Neither uses a variable from outside its parameters, and neither calls push/sort/splice on items — that is what keeps them pure.',
      ],
      solution: `const cart = [50, 80, 20];

function applyDiscount(price, pct) {
  return price - price * (pct / 100);
}

function cartTotal(items) {
  return items.reduce((sum, n) => sum + n, 0);
}`,
      xp: 10,
    },
    {
      id: 'x5-l2',
      title: 'Functions That Return Functions',
      reading: `You already know a function can *take* another function. The mirror-image trick is a function that *returns* a function — a **factory** that manufactures behavior. This is where closures, which you met earlier, become a design tool rather than a curiosity. Recall the rule: when a function is created inside another function, it captures the variables that were in scope at its birth, and it keeps them alive for as long as the inner function lives. The inner function carries a little backpack of remembered variables wherever it goes.

Start with the simplest useful factory, \`makeAdder\`:

\`\`\`
function makeAdder(n) {
  return function (x) {
    return x + n;
  };
}
const add5 = makeAdder(5);
add5(3); // 8
\`\`\`

\`makeAdder(5)\` runs, binds \`n\` to 5, and returns a brand-new function that remembers \`n\`. That returned function *is* \`add5\`. Every time you call \`add5\`, it reaches into its backpack, finds \`n\` is 5, and adds. Call \`makeAdder(100)\` and you get a different function with a different \`n\` in its backpack. The factory stamps out specialized functions, each closed over its own captured value — hence the word **closure**.

The deeper capability here is **private, stateful behavior without a class**. Because a closure keeps its captured variables alive *and mutable*, you can build a function that remembers things between calls, with the state completely hidden from the outside world:

\`\`\`
function makeCounter() {
  let count = 0;
  return function () {
    count = count + 1;
    return count;
  };
}
const next = makeCounter();
next(); // 1
next(); // 2
\`\`\`

That \`count\` lives inside \`makeCounter\`'s call frame, which would normally vanish when the function returns — but the returned function still references it, so JavaScript keeps the frame alive. There is no way for outside code to read or corrupt \`count\` directly; the *only* interface is calling the returned function. This is genuine encapsulation, older than JavaScript's \`class\` keyword and still used constantly in libraries. It is how a module hides its internals behind a few exposed functions.

The property that makes this trustworthy is **independence**: each call to the factory creates a *fresh* set of captured variables. \`makeCounter()\` called twice gives you two counters that do not share \`count\` — incrementing one never touches the other. If they *did* share, you would have accidental global state and the exact class of bug the functional style exists to prevent. When you build factories, this independence is the invariant to verify: two products of the same factory must not interfere.

An interviewer's favorite here is "what is a closure, and give a real use for it?" The complete answer: a closure is a function bundled with the variables it captured from its defining scope; a real use is data privacy — encapsulating mutable state (a counter, a cache, a configuration) so it can only be touched through the functions you deliberately expose. You are about to build exactly that.`,
      task: `Write \`makeAdder(n)\` that returns a function adding \`n\` to its argument. Then write \`makeCounter()\` that returns a function which, each time it is called, increments a private count and returns the new value. Counters from separate \`makeCounter()\` calls must be independent.`,
      starter: `// makeAdder(n) returns a function that adds n to whatever it is given
function makeAdder(n) {
  return function (x) {
    return x; // TODO: add n
  };
}

// makeCounter() returns a function; each call returns 1, 2, 3, ...
// The count must be private (a closure variable) and per-counter.
function makeCounter() {
  return function () {
    return 0; // TODO: keep and increment a private count
  };
}
`,
      tests: [
        { name: 'makeAdder builds an adder', code: `assert(makeAdder(5)(3) === 8 && makeAdder(100)(1) === 101, 'makeAdder(5)(3) should be 8 and makeAdder(100)(1) should be 101')` },
        { name: 'makeCounter counts up on each call', code: `const c = makeCounter(); assert(c() === 1 && c() === 2 && c() === 3, 'a counter should return 1, then 2, then 3 on successive calls')` },
        { name: 'counters are independent (no shared state)', code: `const a = makeCounter(); const b = makeCounter(); a(); a(); assert(b() === 1, 'a fresh counter must start at 1 regardless of other counters — each closure holds its own private count')` },
      ],
      hints: [
        'The inner function should reference a variable from the outer function. For makeAdder that variable is the parameter n. For makeCounter, declare a `let count = 0` in the outer function so the inner function can capture and update it.',
        'makeAdder: `return function (x) { return x + n; };`. makeCounter: put `let count = 0;` before the return, then the inner function does `count = count + 1; return count;`.',
        'Full makeCounter: `function makeCounter() { let count = 0; return function () { count += 1; return count; }; }`. Because count is declared *inside* makeCounter, every call to makeCounter creates a brand-new count — that is what makes two counters independent.',
      ],
      solution: `function makeAdder(n) {
  return function (x) {
    return x + n;
  };
}

function makeCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}`,
      xp: 10,
    },
    {
      id: 'x5-l3',
      title: 'Composition: compose and pipe',
      reading: `Once functions are values and each one does a single small job, the natural next question is: how do I *combine* them? The functional answer is **composition** — feeding the output of one function into the input of the next, building a bigger transformation out of small trustworthy pieces. You have seen the idea already every time you chained \`.filter().map()\`; composition is that same "output becomes input" flow, generalized to any functions.

Mathematicians write composition as \`f ∘ g\`, meaning "apply g, then apply f" — the one on the *right* runs first, because in \`f(g(x))\` you must evaluate \`g(x)\` before \`f\` can use it. We capture that as a higher-order function:

\`\`\`
const compose = (f, g) => x => f(g(x));

const inc = n => n + 1;
const double = n => n * 2;

const incThenDouble = compose(double, inc);
incThenDouble(3); // double(inc(3)) = double(4) = 8
\`\`\`

Read \`compose(double, inc)\` as "do inc, then double," even though \`double\` is written first — right-to-left, like the math. Some engineers find that reversal genuinely confusing at the keyboard, which is exactly why the more popular tool in JavaScript is **pipe**: same idea, but left-to-right, in *reading order*.

\`\`\`
const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);

const process = pipe(inc, double, inc);
process(3); // inc(3)=4, double(4)=8, inc(8)=9  → 9
\`\`\`

Look closely at how \`pipe\` works, because it is a beautiful little use of everything from the last chapter. It takes *any number* of functions with the rest parameter \`...fns\`, then returns a function that threads its input through them using \`reduce\`. The accumulator starts as the input \`x\`; each step applies the next function to the running value. The array of functions is folded into a single pipeline. If you can read that one line, you have internalized both higher-order functions and reduce at once.

Why compose at all instead of just writing \`double(inc(x))\` inline? Because composition lets you *name and reuse the pipeline itself*. \`const normalize = pipe(trim, toLowerCase, removeAccents)\` gives a single, testable, reusable transformation with an intention-revealing name. Each stage stays a tiny pure function you can test in isolation; the composed whole is assembled declaratively. This is precisely how data-processing libraries, middleware stacks, and functional UI pipelines are built — small units, composed, named at the level of what they accomplish.

The engineering payoff is the same one purity gave us: **local reasoning**. Each function in a pipe has one job and can be verified alone. The pipe has one job — sequencing — and can be verified alone. There is no tangled function where step three secretly depends on a variable step one left lying around, because pure stages communicate *only* through their return values. When a bug appears, you binary-search the stages: check the value flowing between them and you have localized the fault in seconds. Build \`compose\` and \`pipe\` now, and notice how ordinary they turn out to be under the intimidating names.`,
      task: `Write \`compose(f, g)\` returning a function \`x => f(g(x))\` (g runs first). Then write a variadic \`pipe(...fns)\` that returns a function threading its input through all the functions left-to-right, using \`reduce\`. The helpers \`inc\` and \`double\` are provided to combine.`,
      starter: `const inc = n => n + 1;
const double = n => n * 2;

// compose(f, g): apply g first, then f. compose(double, inc)(3) === 8
const compose = (f, g) => x => x; // TODO

// pipe(...fns): apply left-to-right. pipe(inc, double, inc)(3) === 9
const pipe = (...fns) => x => x; // TODO: reduce over fns
`,
      tests: [
        { name: 'compose applies g then f', code: `assert(compose(double, inc)(3) === 8, 'compose(double, inc)(3) should be double(inc(3)) = 8')` },
        { name: 'compose order matters', code: `assert(compose(inc, double)(3) === 7, 'compose(inc, double)(3) should be inc(double(3)) = 7 — the right function runs first')` },
        { name: 'pipe threads left-to-right through many functions', code: `assert(pipe(inc, double, inc)(3) === 9, 'pipe(inc, double, inc)(3) should be inc(double(inc(3))) = 9')` },
        { name: 'pipe with one function is just that function', code: `assert(pipe(double)(10) === 20, 'pipe(double)(10) should be 20 — a single-stage pipe applies only that function')` },
      ],
      hints: [
        'compose(f, g) must return a NEW function that, given x, computes f(g(x)). pipe should reduce over the function list, starting the accumulator at the input and applying each function in turn.',
        'compose: `const compose = (f, g) => x => f(g(x));`. pipe: the reducer applies each fn to the running value — `(acc, fn) => fn(acc)` — starting from x.',
        'Full pipe: `const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);`. The accumulator begins as x; each function transforms it; the final accumulator is the pipeline result. compose is the two-argument, right-to-left cousin: `x => f(g(x))`.',
      ],
      solution: `const inc = n => n + 1;
const double = n => n * 2;

const compose = (f, g) => x => f(g(x));

const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x);`,
      xp: 15,
    },
    {
      id: 'x5-l4',
      title: 'Currying & Partial Application',
      reading: `Here is a small idea with a big reach. A normal function takes all its arguments at once: \`multiply(3, 4)\`. A **curried** function takes them one at a time, returning a new function after each argument until it has enough to finish: \`multiply(3)(4)\`. It sounds like a party trick, but currying is the mechanism behind some of the most ergonomic APIs in the language, and it falls straight out of the closures you just built.

Watch it happen:

\`\`\`
const multiply = a => b => a * b;

multiply(3);    // returns a function: b => 3 * b
multiply(3)(4); // 12
\`\`\`

\`multiply(3)\` does not multiply anything — it captures \`a\` as 3 and hands back a function waiting for \`b\`. That returned function is a closure over \`a\`, exactly like \`makeAdder\` from two lessons ago. Currying is really just "functions returning functions" applied deliberately to a multi-argument function, one parameter per layer.

The reason anyone bothers is **partial application**: fixing some arguments now and supplying the rest later. Because \`multiply(3)\` is a real, storable function, you can name it and reuse it:

\`\`\`
const triple = multiply(3);
triple(4);  // 12
triple(10); // 30
\`\`\`

\`triple\` is a *specialized* function born from a *general* one by pinning the first argument. You did not write a separate \`triple\` from scratch; you configured \`multiply\` and gave the configuration a name. Multiply this pattern across a codebase and you get families of focused helpers — \`toFixed2\`, \`taxFor("CA")\`, \`fetchFrom("/api/v2")\` — each a partial application of one flexible core function. Less duplicated logic, one place to fix bugs.

Currying extends to any number of parameters, each layer capturing one more value in its backpack:

\`\`\`
const add3 = a => b => c => a + b + c;
add3(1)(2)(3);       // 6
const add10 = add3(10);
add10(2)(3);          // 15
\`\`\`

Where does this shine in the wild? Anywhere you pass functions around. Because \`map\`, \`filter\`, and event handlers all want a function of one argument, currying lets you pre-configure the *other* arguments and hand over exactly the one-argument function they expect: \`prices.map(multiply(1.08))\` applies tax to every price, no inline arrow needed. Functional libraries like Ramda curry *everything* for precisely this reason — it makes their functions endlessly composable with the \`pipe\` you built last lesson.

The judgment note, engineer to engineer: currying is a sharp tool, not a mandate. Deeply curried code (\`f(a)(b)(c)(d)\`) can read worse than an honest \`f(a, b, c, d)\` to a team that is not steeped in the style. Reach for it when partial application genuinely removes duplication or when it makes a function slot cleanly into a pipeline — not to prove you can. Build a curried \`multiply\`, derive \`triple\` from it, and a three-layer \`add3\`, and the mechanics will feel like the closures they are.`,
      task: `Write a curried \`multiply\` so that \`multiply(a)(b)\` returns \`a * b\`. Derive \`triple\` from it by partial application (\`multiply(3)\`). Then write a curried \`add3\` so that \`add3(a)(b)(c)\` returns \`a + b + c\`, and derive \`addTen\` as \`add3(10)\`.`,
      starter: `// Curried multiply: multiply(a)(b) === a * b
const multiply = a => b => 0; // TODO

// Partial application — fix the first argument to 3:
const triple = multiply(3);

// Curried add of three numbers: add3(a)(b)(c) === a + b + c
const add3 = a => b => c => 0; // TODO

// Partial application — fix the first argument to 10:
const addTen = add3(10);
`,
      tests: [
        { name: 'multiply is curried', code: `assert(multiply(3)(4) === 12 && multiply(6)(7) === 42, 'multiply(3)(4) should be 12 and multiply(6)(7) should be 42')` },
        { name: 'triple is a partial application of multiply', code: `assert(typeof triple === 'function' && triple(5) === 15 && triple(10) === 30, 'triple should be multiply(3), so triple(5) is 15 and triple(10) is 30')` },
        { name: 'add3 is curried across three arguments', code: `assert(add3(1)(2)(3) === 6 && add3(10)(20)(30) === 60, 'add3(1)(2)(3) should be 6 and add3(10)(20)(30) should be 60')` },
        { name: 'addTen fixes the first argument of add3', code: `assert(typeof addTen === 'function' && addTen(2)(3) === 15, 'addTen should be add3(10), so addTen(2)(3) is 15')` },
      ],
      hints: [
        'Each layer of a curried function takes one argument and returns a function waiting for the next, until the last layer finally does the arithmetic. Partial application is just calling the outer layer and storing the returned function.',
        'multiply: `a => b => a * b`. add3: `a => b => c => a + b + c`. Then triple and addTen are already written for you — they simply call the first layer.',
        'Full: `const multiply = a => b => a * b;` and `const add3 = a => b => c => a + b + c;`. `multiply(3)` captures a=3 and returns `b => 3 * b`, which is what triple is. Currying is nothing more than the closure factory pattern with one parameter per layer.',
      ],
      solution: `const multiply = a => b => a * b;

const triple = multiply(3);

const add3 = a => b => c => a + b + c;

const addTen = add3(10);`,
      xp: 15,
    },
    {
      id: 'x5-l5',
      title: 'Capstone: An Immutable Reducer',
      reading: `This capstone ties the chapter's philosophy to the pattern you are most likely to meet on the job: **immutable state updated by a reducer**. It is the beating heart of Redux, the model behind React's \`useReducer\`, and the shape of nearly every serious state-management system written in the last decade. If you understand this one exercise deeply, you understand the spine of modern front-end architecture.

First, the discipline of **immutable updates**. To "change" data immutably means: never modify the existing object or array — instead, build a *new* one that reflects the change, copying the parts that stay the same. The spread operator is your primary tool. To update a field, spread the old object and override one key: \`{ ...user, name: 'Ada' }\`. To add to a list, spread the old array and append: \`[...items, newItem]\`. To remove by id, \`filter\` out the unwanted element, which already returns a fresh array. To update one item inside a list, \`map\` over it and replace only the match with a spread copy. Every one of these produces a new value and leaves the original untouched.

Why go to this trouble instead of just mutating? Three concrete reasons that professionals feel daily. **Change detection**: frameworks like React decide what to re-render by comparing whether the state *reference* changed; mutate in place and the reference is identical, so your UI silently fails to update — a maddening bug. **Time-travel and predictability**: if each state is a distinct immutable snapshot, you can keep the old ones around, enabling undo, redo, and debugging tools that step through history. **Safety from spooky action**: mutable state shared across a codebase means any function might change data another function is mid-way through using; immutable data simply cannot be altered under your feet.

Now the **reducer** itself. A reducer is a *pure function* with the exact signature \`(state, action) => newState\`. It looks at the current state and an action describing what happened, and it returns the *next* state — a brand-new value, never a mutation of the input. That is the whole contract, and notice how it unites the entire chapter: a reducer is pure (lesson one), and it is exactly the kind of function you feed to \`reduce\` to fold a *list of actions* over an *initial state*, producing the final state. \`actions.reduce(reducer, initialState)\` replays a whole history of events into one result. The name "reducer" is literally because it is the callback you hand to \`reduce\`.

Here is the mental model that makes reducers click: a reducer is a *transition function* for a tiny state machine. Given where you are and what just happened, it names where you go next — deterministically, with no surprises, because it is pure. Feed it the same state and action and it always yields the same next state. This determinism is why reducers are a joy to test: no mocks, no setup, just "given this state and this action, I expect that state." It is also why the whole application's behavior can be understood one transition at a time.

Your task is to build a reducer for a small to-do list and an \`applyAll\` function that folds a sequence of actions over an initial state using \`reduce\`. Handle three action types — adding an item, removing one by id, and toggling one's done flag — each with an immutable update. The acceptance test that matters most is the one checking the *original* state object was never mutated: that is the difference between code that works by luck and code that works by design. Make every branch return a new state, keep the reducer pure, and unknown actions should return the state unchanged. This is the pattern you will reach for on real teams — build it once here, correctly, and it is yours.`,
      task: `Write a pure \`reducer(state, action)\` where state is \`{ items: [...] }\` and each item is \`{ id, text, done }\`. Handle \`action.type\`: \`'add'\` (append \`{ id: action.id, text: action.text, done: false }\`), \`'remove'\` (drop the item whose id is \`action.id\`), \`'toggle'\` (flip \`done\` on the item whose id is \`action.id\`), and any other type (return state unchanged). Every case must return a NEW state without mutating the input. Then write \`applyAll(state, actions)\` that folds the actions over the state with \`reduce\`.`,
      starter: `// A pure reducer: (state, action) => newState. Never mutate state or state.items.
// state shape: { items: [ { id, text, done }, ... ] }
function reducer(state, action) {
  // TODO handle 'add', 'remove', 'toggle'; unknown types return state unchanged
  return state;
}

// applyAll: fold a list of actions over an initial state using reduce
function applyAll(state, actions) {
  return state; // TODO: reduce over actions with reducer
}
`,
      tests: [
        { name: 'add appends a new item immutably', code: `const s0 = { items: [] }; const s1 = reducer(s0, { type: 'add', id: 1, text: 'buy milk' }); assert(s1.items.length === 1 && s1.items[0].id === 1 && s1.items[0].text === 'buy milk' && s1.items[0].done === false && s0.items.length === 0 && s1 !== s0, 'add should return a new state with the item appended (done:false), leaving the original state untouched')` },
        { name: 'remove drops the item by id', code: `const s = { items: [{ id: 1, text: 'a', done: false }, { id: 2, text: 'b', done: false }] }; const r = reducer(s, { type: 'remove', id: 1 }); assert(r.items.length === 1 && r.items[0].id === 2 && s.items.length === 2, 'remove should return a new state without the id:1 item, and must not mutate the original (still length 2)')` },
        { name: 'toggle flips done on the matching item only', code: `const s = { items: [{ id: 1, text: 'a', done: false }, { id: 2, text: 'b', done: false }] }; const r = reducer(s, { type: 'toggle', id: 2 }); assert(r.items[0].done === false && r.items[1].done === true && s.items[1].done === false, 'toggle should flip done on id:2 only, in a new state, without mutating the original item')` },
        { name: 'unknown action returns the state unchanged', code: `const s = { items: [] }; assert(reducer(s, { type: 'noop' }) === s, 'an unknown action type should return the exact same state object')` },
        { name: 'applyAll folds a sequence of actions', code: `const start = { items: [] }; const out = applyAll(start, [ { type: 'add', id: 1, text: 'a' }, { type: 'add', id: 2, text: 'b' }, { type: 'toggle', id: 1 }, { type: 'remove', id: 2 } ]); assert(out.items.length === 1 && out.items[0].id === 1 && out.items[0].done === true && start.items.length === 0, 'applyAll should replay all actions: end with just item 1 (done:true), and never mutate the starting state')` },
      ],
      hints: [
        'Every branch returns a NEW object. Use the spread operator: `{ ...state, items: <new items array> }`. For add, spread the old items and append; for remove, filter; for toggle, map and replace only the matching item with a spread copy. applyAll is `actions.reduce(reducer, state)`.',
        "add: `return { ...state, items: [...state.items, { id: action.id, text: action.text, done: false }] };`. remove: `items: state.items.filter(i => i.id !== action.id)`. toggle: `items: state.items.map(i => i.id === action.id ? { ...i, done: !i.done } : i)`. Default: `return state;`.",
        "Use a switch on action.type. Each case builds a fresh items array and returns `{ ...state, items }`. The toggle case is the tricky one: map over items, and for the matching id return `{ ...i, done: !i.done }` (a new item object), otherwise return i unchanged. Finally `function applyAll(state, actions) { return actions.reduce(reducer, state); }` — the reducer IS the reduce callback, folding every action into the final state.",
      ],
      solution: `function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return {
        ...state,
        items: [...state.items, { id: action.id, text: action.text, done: false }],
      };
    case 'remove':
      return {
        ...state,
        items: state.items.filter(i => i.id !== action.id),
      };
    case 'toggle':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, done: !i.done } : i
        ),
      };
    default:
      return state;
  }
}

function applyAll(state, actions) {
  return actions.reduce(reducer, state);
}`,
      xp: 20,
    },
  ],
};
