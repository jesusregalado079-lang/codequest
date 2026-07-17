// Chapter 4 — Functions. Shape defined in ../SCHEMA.md.

export default {
  id: 'ch4',
  title: 'Functions',
  tagline: 'Name a piece of logic once, then wield it forever.',
  badge: { name: 'Function Forger', emoji: '🛠️' },
  intro: `So far, every program you have written is a single block of instructions that runs once, top to bottom. That works at twenty lines. It collapses at two hundred, and no serious software is twenty lines: the browser you are reading this in is tens of millions. The tool that makes large software possible — arguably the most important idea in this entire course — is the **function**: a named, reusable piece of logic with defined inputs and a defined output.

Functions matter for a deeper reason than saving keystrokes. They are how engineers manage *complexity*. A well-named function is a promise: "give me a price and a discount, I will give you back the sale price — and you do not need to know how." That ability to use logic without re-reading it is called **abstraction**, and it is the load-bearing wall of every real codebase. When you call \`JSON.parse\` or \`Math.max\`, you are standing on abstractions other engineers built; this chapter is where you start building your own.

We will cover function declarations, the crucial distinction between parameters and arguments, what \`return\` really does (and the silent \`undefined\` that leaks out when you forget it), the modern arrow syntax, the scope rules that decide which variables a function can see — including a first look at closures, the concept that separates junior from mid-level in interviews — and finally *pure functions* and composition, two engineering habits that will shape how you design everything from here on. The capstone has you build a small pricing engine out of pure functions snapped together like pipe fittings.

A hiring-bar observation to keep in mind as you work: interviewers rarely ask "can you write a loop?" past the screening stage. What they probe relentlessly is functions — what gets returned, what a function can see, what happens to the outside world when it runs. This chapter is the one that pays rent.`,
  lessons: [
    {
      id: 'ch4-l1',
      title: 'Declaring and Calling Functions',
      reading: `A **function declaration** creates a named, reusable block of logic:

\`\`\`js
function greet(name) {
  return 'Hello, ' + name + '!';
}
\`\`\`

Read the pieces. The keyword \`function\` starts the declaration. \`greet\` is the name — same naming rules and same camelCase convention as variables, but by convention functions are named as *verbs*, because they do things: \`calculateTax\`, \`sendEmail\`, \`isValid\`. In parentheses sits \`name\`, a **parameter**: a placeholder variable that will receive a value later. The braces hold the **body** — the instructions that run when the function is used. And \`return\` hands a value back to whoever asked (much more on that in lesson 3).

Here is the part beginners consistently underestimate: **declaring a function runs nothing.** The declaration above produces no greeting. It is a recipe filed in a drawer — the machine reads it, remembers "there is a procedure called greet," and moves on. The body only executes when you **call** the function by writing its name followed by parentheses containing the actual values:

\`\`\`js
const g = greet('Ada');   // NOW the body runs, with name = 'Ada'
console.log(g);            // Hello, Ada!
console.log(greet('Lin')); // Hello, Lin! — same recipe, new ingredient
\`\`\`

The mental model that makes everything downstream click: a function call is a **jump with luggage**. When execution hits \`greet('Ada')\`, the machine pauses the current line, packs the value \`'Ada'\` into the parameter \`name\`, jumps into the function body, runs it to a \`return\`, then jumps back to the paused line carrying the returned value — which then behaves exactly like any other value: assignable to a variable, printable, usable in a bigger expression. Real JavaScript engines implement this with a *call stack* — a literal stack of "where do I jump back to" notes — and when a program crashes, the error's *stack trace* is that stack printed out. That is why learning functions well makes you instantly better at reading error messages.

Why is this such a big deal for engineering? **One definition, many uses.** If greeting logic lives in one function and the product team decides greetings should say "Welcome back," you change one line, and every one of the two hundred call sites is updated for free. If instead that logic had been copy-pasted two hundred times, you now have two hundred edits and — worse — you will miss three of them. Codebases rot exactly this way, and the discipline that prevents it has a name every workplace will expect you to know: **DRY — Don't Repeat Yourself.** Functions are the primary tool for honoring it.

One more habit worth forming today: a function's name plus its parameters form its *signature*, and a good signature makes the call site read like a sentence — \`greet('Ada')\` needs no explanation. You will spend far more of your career *reading* code than writing it; write signatures for the reader you will be in six months.

Your task: forge your first function. \`greet\` takes a name and returns the string \`Hello, <name>!\` — returns it, not prints it. The tests will call it with several different names, which is exactly the point: one recipe, many meals.`,
      task: 'Write a function declaration named `greet` that takes one parameter `name` and returns the string `Hello, <name>!` — for example greet(\'Ada\') returns \'Hello, Ada!\'.',
      starter: `// Declare it, then the tests will call it.
function greet(name) {
  // return the greeting string
}
`,
      tests: [
        { name: 'greet is a function', code: `assert(typeof greet === 'function', 'greet should be declared with the function keyword')` },
        { name: 'greets Ada', code: `assert(greet('Ada') === 'Hello, Ada!', 'greet("Ada") should return "Hello, Ada!" but returned ' + JSON.stringify(greet('Ada')) + ' — check the exact punctuation: comma, space, exclamation mark')` },
        { name: 'works for any name (not hard-coded)', code: `assert(greet('Grace') === 'Hello, Grace!' && greet('Linus') === 'Hello, Linus!', 'greet should use its name parameter — the same function must greet Grace and Linus correctly')` },
      ],
      hints: [
        'The function receives whatever name it was called with in the parameter `name`. Your job is to build one string out of three pieces — a fixed start, the name, a fixed end — and hand it back with return.',
        'String concatenation with + does it: `"Hello, " + name + "!"`. Put that expression right after the return keyword.',
        'The whole body is one line: `function greet(name) { return "Hello, " + name + "!"; }`. Mind the details the tests check: capital H, a comma AND a space before the name, an exclamation mark after. If a test shows "Hello,Ada!", you dropped the space.',
      ],
      solution: `function greet(name) {
  return 'Hello, ' + name + '!';
}`,
      xp: 10,
    },
    {
      id: 'ch4-l2',
      title: 'Parameters, Arguments, and the return Contract',
      reading: `Two pairs of words get blurred together by beginners and kept razor-sharp by professionals. The first pair: **parameter** versus **argument**. A parameter is the *placeholder* in the declaration — \`width\` and \`height\` in \`function rectangleArea(width, height)\`. An argument is the *actual value* you pass at the call site — \`3\` and \`4\` in \`rectangleArea(3, 4)\`. Parameters are the named slots on the recipe card; arguments are the ingredients you actually hand over. When the call happens, arguments are matched to parameters *by position*: first argument into first parameter, second into second. Call \`rectangleArea(4, 3)\` instead of \`(3, 4)\` and multiplication forgives you — but \`divide(4, 2)\` versus \`divide(2, 4)\` are very different answers. Argument order bugs are real, common, and invisible to the eye skimming past.

The second pair is the one that costs beginners the most hours: **returning** a value versus **printing** it. They feel identical when you are testing by eye — either way, a number shows up on screen. They could not be more different to the machine.

\`\`\`js
function areaPrint(w, h) {
  console.log(w * h);       // displays 12, returns nothing
}
function areaReturn(w, h) {
  return w * h;             // hands 12 back to the caller
}

const a = areaPrint(3, 4);  // prints 12, but a is undefined!
const b = areaReturn(3, 4); // b is 12
const big = areaReturn(3, 4) * 100;  // returned values compose: 1200
\`\`\`

\`console.log\` is a side effect — it throws the value at the human and keeps no copy. \`return\` delivers the value back into the program, where it can be stored, compared, multiplied, or passed into the next function. And here is the rule that explains the mystery \`undefined\`s you will meet all your career: **a function that finishes without hitting a return statement returns \`undefined\` automatically.** No error, no warning. The caller receives \`undefined\` and the program marches on, often crashing three files away, long after the real culprit. When you see \`undefined\` popping out of a calculation, your first suspect should be a function somewhere that computed the right answer and then forgot to return it — or worse, \`console.log\`ged it and called that done.

Think of \`return\` as a **contract**: the signature \`rectangleArea(width, height)\` promises "numbers in, number out." Callers build on that promise sight unseen — they will happily write \`rectangleArea(3, 4) + rectangleArea(5, 6)\` without ever reading your function body. That is the entire power of abstraction, and it only works if the promise is kept on every path through the function. In code review, a function with a branch that forgets to return is a classic catch: it keeps the promise on Tuesdays and returns \`undefined\` on Thursdays. Also worth knowing: \`return\` *exits the function immediately* — nothing in the body after an executed return will run. Lesson 3 turns that into a technique.

One more professional habit: functions that return values are dramatically easier to **test** — you call them with knowns and check the answer, exactly as this editor's tests do. Functions that only print require capturing output to verify, which is clumsy. Real teams push logic into returning functions and keep printing at the edges of the program. You will hear this again in lesson 6 as "purity."

Your task: write \`rectangleArea(width, height)\` that *returns* the product. The tests will check the values — and they will explicitly check that the function actually returns, because \`console.log\` will not save you here.`,
      task: 'Write a function `rectangleArea(width, height)` that RETURNS width multiplied by height. Do not console.log the answer — return it.',
      starter: `// Numbers in, number out. Keep the contract.
function rectangleArea(width, height) {
  // ...
}
`,
      tests: [
        { name: 'returns a value (not undefined)', code: `assert(rectangleArea(3, 4) !== undefined, 'rectangleArea(3, 4) returned undefined — the function must RETURN the area, not console.log it')` },
        { name: 'computes 3 x 4 = 12', code: `assert(rectangleArea(3, 4) === 12, 'rectangleArea(3, 4) should return 12 but returned ' + rectangleArea(3, 4))` },
        { name: 'works for other sizes', code: `assert(rectangleArea(7, 5) === 35 && rectangleArea(1, 250) === 250, 'rectangleArea should multiply its two parameters — check with 7x5=35 and 1x250=250')` },
        { name: 'zero-width rectangle has zero area', code: `assert(rectangleArea(0, 100) === 0, 'rectangleArea(0, 100) should return 0 — edge cases count')` },
      ],
      hints: [
        'The function already receives the two numbers in its parameters. Combine them with the multiplication operator and make sure the result leaves the function the right way.',
        'The right way out is the return keyword: `return width * height;` — one line, no console.log.',
        'Complete function: `function rectangleArea(width, height) { return width * height; }`. If the first test fails with "returned undefined", you either wrote console.log(width * height) or computed the product into a variable and never returned it.',
      ],
      solution: `function rectangleArea(width, height) {
  return width * height;
}`,
      xp: 10,
    },
    {
      id: 'ch4-l3',
      title: 'Early Returns and the clamp Pattern',
      reading: `Last lesson ended on a fact worth its own lesson: **return exits the function immediately.** The instant a return executes, the function is over — remaining lines never run, and the value rides back to the caller. Used deliberately, this gives you one of the cleanest control-flow styles in the trade: the **early return**.

Compare two versions of the same logic:

\`\`\`js
// nested version — the logic hides in the indentation
function describe(n) {
  let result;
  if (n < 0) {
    result = 'negative';
  } else {
    if (n === 0) {
      result = 'zero';
    } else {
      result = 'positive';
    }
  }
  return result;
}

// early-return version — reads like a checklist
function describe(n) {
  if (n < 0) return 'negative';
  if (n === 0) return 'zero';
  return 'positive';
}
\`\`\`

The second version works because return is an exit. If \`n < 0\` is true, we are *gone* — so by the time execution reaches the second line, we already *know* n is not negative, no \`else\` required. Each line peels off one case and leaves the function; the final return handles whatever survived the gauntlet. Real codebases use this shape constantly, especially as **guard clauses** at the top of functions: check the weird cases first, bail out early, and let the main logic stand un-indented at the bottom. Reviewers actively push code toward this style because deeply nested if/else pyramids — engineers call the anti-pattern "arrow code," after the shape the indentation makes — are where bugs hide.

Now let's use it to build a function you will genuinely meet in the wild: **clamp**. Clamping forces a value into a range: if it is below the minimum, you get the minimum; above the maximum, the maximum; otherwise the value itself. It is everywhere once you see it — volume sliders (0 to 100), scroll positions, color channels (0 to 255), game health bars, temperature limits on real hardware. Graphics and game code call \`clamp\` thousands of times per frame. The logic is exactly three checks, and early returns render it in three lines:

\`\`\`js
clamp(150, 0, 100)  // → 100  (too high: pinned to max)
clamp(-20, 0, 100)  // → 0    (too low: pinned to min)
clamp(37, 0, 100)   // → 37   (in range: untouched)
\`\`\`

Pay attention to the **boundaries**, because this is Chapter 3's off-by-one lesson wearing a new coat. What should \`clamp(0, 0, 100)\` return? The value equals the minimum — it is not *below* it — so it should pass through untouched as \`0\`. Using \`<\` versus \`<=\` in your checks decides this, and here \`value < min\` (strictly less) is what you want. Interviewers hand out exactly this kind of function and then quietly ask about the boundary value; being ready with "equal to min is in range, my check is strict" is the mark of someone who tests edges by reflex.

Write \`clamp(value, min, max)\` with early returns. Three lines of body. The tests will hit both boundaries — dead-on and beyond.`,
      task: 'Write a function `clamp(value, min, max)` that returns min if value is below min, max if value is above max, and value itself otherwise.',
      starter: `// Pin a value into [min, max]. Early returns keep it flat.
function clamp(value, min, max) {
  // check too-low, check too-high, otherwise return value
}
`,
      tests: [
        { name: 'in-range value passes through', code: `assert(clamp(37, 0, 100) === 37, 'clamp(37, 0, 100) should return 37 unchanged, but returned ' + clamp(37, 0, 100))` },
        { name: 'too-low pins to min', code: `assert(clamp(-20, 0, 100) === 0 && clamp(-999, 10, 20) === 10, 'values below min should come back as min')` },
        { name: 'too-high pins to max', code: `assert(clamp(150, 0, 100) === 100 && clamp(21, 10, 20) === 20, 'values above max should come back as max')` },
        { name: 'boundary values are in range', code: `assert(clamp(0, 0, 100) === 0 && clamp(100, 0, 100) === 100, 'a value exactly equal to min or max is IN range and should pass through — check whether you used < or <=')` },
      ],
      hints: [
        'Three cases, in any order that covers them all: below the floor, above the ceiling, or fine as-is. Each case is one comparison and one return.',
        'Guard-clause shape: `if (value < min) return min;` then `if (value > max) return max;` then `return value;`. Strict < and > matter — the boundary test will catch <= here.',
        'Complete function: `function clamp(value, min, max) { if (value < min) return min; if (value > max) return max; return value; }`. Walk clamp(0, 0, 100) through it: 0 < 0 is false, 0 > 100 is false, so the last line returns 0 untouched — exactly right.',
      ],
      solution: `function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}`,
      xp: 10,
    },
    {
      id: 'ch4-l4',
      title: 'Arrow Functions',
      reading: `JavaScript has a second, newer syntax for writing functions, and once you start reading real code — open-source libraries, Stack Overflow answers, your future team's codebase — you will see it *more often* than the \`function\` keyword. It is the **arrow function**, added to the language in 2015:

\`\`\`js
const double = (x) => x * 2;
\`\`\`

Read it right to left of the \`=>\`: "take \`x\`, and give back \`x * 2\`." The parentheses hold the parameters, the arrow separates them from the result, and the whole thing is a *value* being assigned to a \`const\` like any other value. Calling it is identical to before: \`double(21)\` is \`42\`. Notice what is missing compared to the long form — no \`function\` keyword, no braces, and most strikingly **no \`return\`**. When an arrow function's body is a single expression, that expression's value is returned automatically. This is called an *implicit return*, and it is both the arrow's superpower and its classic gotcha: if you *do* add braces — \`(x) => { x * 2 }\` — you have opened a full function body, implicit return switches off, and the function silently returns \`undefined\` unless you write \`return\` yourself. Braces mean "I'll handle the return"; no braces means "return this expression." Burn that in now and you will skip a rite-of-passage bug.

The syntax flexes with the parameter count. One parameter may drop its parentheses; zero or several require them; a multi-statement body requires braces and an explicit return:

\`\`\`js
const double  = x => x * 2;              // one param: bare
const isEven  = n => n % 2 === 0;        // expressions of any kind
const area    = (w, h) => w * h;         // two params: parens required
const bigger  = (a, b) => {              // braces: explicit return
  if (a > b) return a;
  return b;
};
\`\`\`

Why did the language grow a second syntax? Because functions in JavaScript are **values** — the deep fact underneath this whole lesson. A function can be stored in a variable (you just did), and — as Chapter 7 will exploit heavily — handed to *another function* as an argument. Real code passes little functions around constantly: "sort with *this* comparison," "keep the items where *this* is true," "when the click happens, run *this*." When a function is a two-line errand being handed to someone else, the eight-character \`function\` ceremony is noise; \`x => x * 2\` is signal. Arrows made function-as-value ergonomic, and modern JavaScript style followed. (For completeness: arrows also treat the keyword \`this\` differently, which matters in object-heavy code — a story for a later chapter. And note \`=>\` versus \`>=\`: arrow versus greater-or-equal. Your eyes will adjust.)

So which do you use? House style varies, and both are correct. A common professional instinct: \`function\` declarations for the big named machinery of a module, arrows for short function values, especially ones passed to other functions. What is *not* optional is fluency — you must read and write both without slowing down, because every codebase you touch from now on mixes them freely.

Your task is a conversion drill: build \`double\` (multiply by 2) and \`isEven\` (true when a number is even — your \`% 2 === 0\` trick from the loops chapter) as arrow functions with implicit returns. Short, sharp, idiomatic.`,
      task: 'Write two arrow functions: `double`, which returns its argument times 2, and `isEven`, which returns true when its argument is an even number and false otherwise.',
      starter: `// Arrow syntax, implicit returns — no braces needed.
const double = /* ... */;
const isEven = /* ... */;
`,
      tests: [
        { name: 'both are functions', code: `assert(typeof double === 'function' && typeof isEven === 'function', 'double and isEven should both be functions assigned with arrow syntax')` },
        { name: 'double doubles', code: `assert(double(21) === 42 && double(0) === 0 && double(-5) === -10, 'double should multiply by 2 — check double(21)=42, double(0)=0, double(-5)=-10')` },
        { name: 'isEven detects evens and odds', code: `assert(isEven(4) === true && isEven(7) === false, 'isEven(4) should be true and isEven(7) should be false — did you compare the remainder to 0?')` },
        { name: 'zero is even (returns a real boolean)', code: `assert(isEven(0) === true, 'isEven(0) should be exactly true — 0 % 2 is 0, and comparing with === 0 yields a proper boolean')` },
      ],
      hints: [
        'Each is one arrow: parameter, =>, expression. No braces, no return keyword — the expression IS the return value.',
        'double: `x => x * 2`. For isEven, the expression is a comparison that already produces true or false: remainder-when-divided-by-2 equals 0.',
        'Both lines: `const double = x => x * 2;` and `const isEven = n => n % 2 === 0;`. If isEven fails the boolean test, you may have returned the remainder itself (0 or 1) instead of comparing it — `n % 2` is a number, `n % 2 === 0` is a boolean.',
      ],
      solution: `const double = x => x * 2;
const isEven = n => n % 2 === 0;`,
      xp: 10,
    },
    {
      id: 'ch4-l5',
      title: 'Scope and Closures',
      reading: `Here is a question that sounds trivial and is actually one of the deepest in the language: when a line of code mentions a variable, *which* variable does it get? The rulebook that answers this is called **scope**, and JavaScript's core rule is: **variables live in the block where they were declared, and are visible to everything inside that block — including nested functions — but invisible outside it.**

\`\`\`js
const planet = 'Earth';          // outer scope

function describe() {
  const mood = 'calm';           // function scope
  return planet + ' is ' + mood; // sees BOTH: inner looks outward
}

// console.log(mood);  // ReferenceError — outer cannot see inward
\`\`\`

The mental model: scopes nest like one-way mirrors. Code inside a function can look *outward* through the glass and use outer variables (\`describe\` reads \`planet\`), but code outside cannot look *in* (\`mood\` is invisible at the top level). When a name is used, the machine searches the current scope first, then the enclosing one, then the one enclosing that, out to the top. This is also why function parameters and loop-body variables don't leak everywhere, and it is the reason engineers treat *global* variables — the outermost scope, visible to everything — with suspicion: anything visible everywhere can be broken from anywhere. Keeping variables in the smallest scope that works is basic hygiene, like closing the fridge.

Now the twist that earns this lesson its "hard" badge. What happens when a function is created inside another function, *outlives* it, and still uses its variables?

\`\`\`js
function makeCounter() {
  let count = 0;               // born inside makeCounter
  return () => {               // an arrow function, returned as a value
    count = count + 1;
    return count;
  };
}

const tick = makeCounter();    // makeCounter has now finished...
tick();  // 1   ...yet count is alive
tick();  // 2
tick();  // 3
\`\`\`

By the "photograph of variables" intuition from the loops chapter, \`count\` should be garbage the moment \`makeCounter\` returns. It is not. The returned function *keeps its birth-scope alive*: it closed over \`count\`, and the pair — function plus captured variables — is called a **closure**. The engine literally keeps that little scope in memory for as long as the function that needs it exists. And each *call* to \`makeCounter()\` builds a fresh scope: \`const a = makeCounter(); const b = makeCounter();\` yields two counters with two independent \`count\`s. \`a\` can tick to 5 while \`b\` sits at 0. Private, per-instance state — no class required.

Two things make closures worth sweating over. First, they are **everywhere** in real JavaScript, mostly uncelebrated: every event handler that remembers which button it belongs to, every callback that still knows the request it was made for, is a closure quietly doing its job. You have possibly written one without noticing. Second, they are the single most reliable **interview topic** in the JavaScript world. "What will this print?" with a closure inside a loop, or "implement makeCounter" verbatim, appears in phone screens to this day, because it cleanly separates people who model scope from people who memorize syntax. Today you become the former.

So: implement \`makeCounter\`. It takes no parameters, declares a \`count\` starting at 0, and returns a function that increments and returns it. The tests will run one counter three times, then start a second counter and confirm it begins fresh at 1 — proving each closure owns its own state.`,
      task: 'Write a function `makeCounter()` that returns a new function; each call to that returned function should return 1, then 2, then 3, and so on. Two counters made by separate makeCounter() calls must count independently.',
      starter: `// A function that manufactures counting functions.
function makeCounter() {
  // declare count here, then return a function that uses it
}
`,
      tests: [
        { name: 'makeCounter returns a function', code: `assert(typeof makeCounter === 'function' && typeof makeCounter() === 'function', 'makeCounter should be a function that RETURNS another function')` },
        { name: 'counter counts 1, 2, 3', code: `const c = makeCounter(); const r1 = c(); const r2 = c(); const r3 = c(); assert(r1 === 1 && r2 === 2 && r3 === 3, 'three calls should return 1, 2, 3 — got ' + r1 + ', ' + r2 + ', ' + r3 + '. Increment count before returning it.')` },
        { name: 'two counters are independent', code: `const a = makeCounter(); const b = makeCounter(); a(); a(); a(); const bFirst = b(); assert(bFirst === 1, 'a fresh counter should start at 1 even after another counter ticked to 3 — got ' + bFirst + '. Is count declared INSIDE makeCounter (a new one per call), not outside it?')` },
      ],
      hints: [
        'Two layers: the outer function sets up a count variable and returns an inner function. The inner function is the only thing that touches count — it bumps it by one and returns the new value.',
        'Skeleton: `function makeCounter() { let count = 0; return () => { ... }; }`. Inside the arrow: increase count, then return it. The critical placement: `let count = 0` must be inside makeCounter but outside the arrow.',
        'Complete: `function makeCounter() { let count = 0; return () => { count = count + 1; return count; }; }`. If the independence test fails, your count is declared at the top level (shared by all counters) instead of inside makeCounter (fresh per call). If counting starts at 0, you returned count before incrementing.',
      ],
      solution: `function makeCounter() {
  let count = 0;
  return () => {
    count = count + 1;
    return count;
  };
}`,
      xp: 15,
    },
    {
      id: 'ch4-l6',
      title: 'Capstone: Pure Functions and Composition',
      reading: `To close the chapter, two ideas that are less about syntax and more about *how engineers design*: purity and composition. Together they explain why some codebases are a pleasure to work in and others are haunted houses.

A **pure function** obeys two rules. One: same arguments in, same result out — every time, forever, no exceptions. Two: it touches nothing outside itself — no changing outer variables, no printing, no writing files, nothing but computing its return value. Anything a function does to the world besides returning is called a **side effect**, and pure functions have none. \`clamp\` from lesson 3 is pure. \`double\` is pure. \`console.log\` is impure by definition — its entire job is a side effect. \`makeCounter\`'s inner function is impure too: calling it with the same (zero) arguments returns 1, then 2, then 3, because it mutates captured state.

Why do engineers care so much? Because purity is a bundle of guarantees you get for free. A pure function is **trivially testable** — call it, check the answer; no setup, no cleanup, no "it depends." It is **safe to reason about locally** — you never have to ask "but what else does this change?", which is precisely the question that makes 3 a.m. debugging hell. It is safe to cache, safe to run in any order, safe to retry. Whole architectural movements are built on maximizing it; React, the most popular UI library in the world, asks that your components behave as pure functions of their inputs. Real systems obviously need side effects — a program with none can only warm the CPU — so the working doctrine is the **functional core, imperative shell**: compute everything pure at the center, and push the messy world-touching (printing, saving, network) to a thin outer layer. Interviewers phrase it as "how would you make this testable?"; the answer is almost always "separate the calculation from the side effects."

The second idea: **composition**. Small pure functions snap together like pipe fittings — the return value of one becomes the argument of the next:

\`\`\`js
addTax(applyDiscount(100, 10), 8)
// inner runs first: applyDiscount(100, 10) → 90
// its result feeds the outer: addTax(90, 8) → 97.2
\`\`\`

Read composed calls **inside-out**: innermost first, results flowing outward. Each function stays small enough to verify at a glance, and the complex behavior lives in the *wiring*, not in any single function. This is how professionals avoid the 300-line mega-function that does everything and can be safely changed by no one. The design instinct — worth adopting today — is: **write the smallest functions that mean something, then build big behavior by composing them.** Each piece can be unit-tested alone; the composition can be tested as a whole; and when the tax rules change, you edit \`addTax\` and nothing else.

Your capstone is a miniature, honest-to-goodness pricing engine — the kind of logic that sits inside every checkout system you have ever clicked through. Three pure functions. \`applyDiscount(price, percent)\` returns the price reduced by that percent (10% off 100 → 90). \`addTax(price, percent)\` returns the price increased by that percent (8% on 90 → 97.2). And \`finalPrice(base, discountPercent, taxPercent)\` — here is the composition — must produce its answer by *calling the other two*: discount first, then tax on the discounted amount. Order matters and the tests know it: tax-then-discount gives a different number than discount-then-tax in general bookkeeping, and the spec here is discount first. No global variables, no console.log, nothing but parameters and returns. Three small trustworthy parts, one wired-up whole: that is the shape of real software.`,
      task: 'Write three pure functions: `applyDiscount(price, percent)` returning price reduced by percent, `addTax(price, percent)` returning price increased by percent, and `finalPrice(base, discountPercent, taxPercent)` which composes them — applying the discount first, then the tax.',
      starter: `// A tiny pricing engine: two workers plus one composer.
function applyDiscount(price, percent) {
  // ...
}

function addTax(price, percent) {
  // ...
}

function finalPrice(base, discountPercent, taxPercent) {
  // compose: discount first, then tax on the result
}
`,
      tests: [
        { name: 'applyDiscount reduces by percent', code: `assert(applyDiscount(100, 10) === 90 && applyDiscount(80, 25) === 60, 'applyDiscount(100, 10) should be 90 and applyDiscount(80, 25) should be 60 — the formula is price * (1 - percent / 100), or price - price * percent / 100')` },
        { name: 'addTax increases by percent', code: `assert(addTax(100, 8) === 108 && addTax(50, 0) === 50, 'addTax(100, 8) should be 108, and a 0% tax should change nothing')` },
        { name: 'edge cases: 0% and 100% discount', code: `assert(applyDiscount(200, 0) === 200 && applyDiscount(200, 100) === 0, 'a 0% discount should change nothing and a 100% discount should make it free')` },
        { name: 'finalPrice composes discount-then-tax', code: `const fp = finalPrice(100, 10, 8); assert(Math.abs(fp - 97.2) < 1e-9, 'finalPrice(100, 10, 8) should be 97.2 (100 → 90 after discount → 97.2 after tax) but got ' + fp + '. Apply the discount FIRST, then tax the discounted price — and build it by calling your other two functions.')` },
        { name: 'finalPrice agrees with manual composition', code: `assert(Math.abs(finalPrice(250, 20, 10) - addTax(applyDiscount(250, 20), 10)) < 1e-9, 'finalPrice(250, 20, 10) should equal addTax(applyDiscount(250, 20), 10) — the composer must produce exactly what wiring the two workers together produces')` },
      ],
      hints: [
        'Percent math first: taking p percent off multiplies the price by (1 - p/100); adding p percent multiplies by (1 + p/100). Each worker function is one return line. The composer never does math itself — it only calls the workers.',
        'Workers: `return price * (1 - percent / 100);` and `return price * (1 + percent / 100);`. Composer: call applyDiscount with the base and the discount, then hand THAT result to addTax with the tax percent.',
        'The composer in full: `function finalPrice(base, discountPercent, taxPercent) { return addTax(applyDiscount(base, discountPercent), taxPercent); }` — read it inside-out: discount first, its result taxed second. If finalPrice(100, 10, 8) gives 97.9 instead of 97.2, you taxed first and discounted second: wrong order.',
      ],
      solution: `function applyDiscount(price, percent) {
  return price * (1 - percent / 100);
}

function addTax(price, percent) {
  return price * (1 + percent / 100);
}

function finalPrice(base, discountPercent, taxPercent) {
  return addTax(applyDiscount(base, discountPercent), taxPercent);
}`,
      xp: 20,
    },
  ],
};
