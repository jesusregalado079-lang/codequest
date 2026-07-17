// Chapter 7 — Thinking in Higher Order. See ../SCHEMA.md for the shape.

export default {
  id: 'ch7',
  title: 'Thinking in Higher Order',
  tagline: 'Stop telling the computer how to loop. Start telling it what you want.',
  badge: { name: 'Pipeline Architect', emoji: '🔗' },
  intro: `Everything you have written so far treats functions as machinery: you build one, you call it, it does its job. This chapter changes your relationship with functions permanently. In JavaScript, a function is a **value** — the same kind of thing as a number or a string. You can store one in a variable, put one in an array, hand one to another function as an argument, and get one back as a return value. Once that clicks, an entire style of programming opens up: instead of writing loops that spell out every step, you describe *what transformation you want* and let a well-named function do the walking.

This is not an academic flourish. Open any professional JavaScript codebase — a React app, a Node server, a data pipeline — and you will find \`map\`, \`filter\`, and \`reduce\` doing the heavy lifting that beginners do with \`for\` loops. Interviewers lean on these constantly, because how you use them reveals whether you think in *transformations* or in *bookkeeping*. A candidate who writes \`users.filter(u => u.active).map(u => u.email)\` is telling the interviewer: I see data flowing through stages. A candidate who writes fifteen lines of loop-and-push for the same job is telling them: I am still counting on my fingers. Both work. One scales.

The deeper idea this chapter teaches is **abstraction over control flow**. A \`for\` loop mixes two concerns in one place: the mechanics of visiting each element (the counter, the condition, the increment) and the actual work you care about (the thing inside the braces). Higher-order functions split those apart. \`map\` owns the mechanics; you supply only the work, as a small function. That separation is the same instinct that drives all good engineering — isolate the part that changes from the part that never does.

By the end of this chapter you will write functions that accept functions, chain array transformations into pipelines, sort anything with a comparator, and — just as importantly — know when a plain loop is honestly the better tool. That last judgment call is what separates someone who learned the syntax from someone who thinks like an engineer.`,
  lessons: [
    {
      id: 'ch7-l1',
      title: 'Functions Are Values',
      reading: `Here is the fact this whole chapter rests on: in JavaScript, a function is a value. Not "like a value," not "sort of a value" — it is a value, a first-class citizen of the language, with exactly the same rights as \`42\` or \`'hello'\`. It can be assigned to a variable. It can sit in an array. It can be passed into another function through a parameter, and it can come back out through a \`return\`. Languages that allow this are said to have **first-class functions**, and it is one of the most consequential design decisions in JavaScript's history.

Look at what you already know and squint at it slightly differently. When you write \`function double(n) { return n * 2 }\`, two things happen: a function object is created, and the name \`double\` is bound to it. The name is just a label pointing at the function — the same way \`const x = 42\` is a label pointing at a number. That means \`const twice = double\` is perfectly legal: now two labels point at the *same* function object. Calling \`twice(5)\` and calling \`double(5)\` runs the same code, because there is only one function; it merely has two names.

Notice the crucial distinction between \`double\` and \`double(5)\`. The first is the function itself — the value, the machine. The second is the *result of running it* — the number 10. Beginners trip over this constantly, especially when handing functions around: if you mean to pass the machine, you write its name with no parentheses. Add parentheses and you have already run the machine and are passing whatever fell out of it. In real codebases this bug appears as \`button.addEventListener('click', handleClick())\` — the parentheses call \`handleClick\` immediately, once, at setup time, instead of registering it to run on every click. One pair of parentheses, completely different program.

Once functions are values, functions can *operate on other functions*. A function that takes a function as an argument, or returns one, is called a **higher-order function** — the phrase that names this chapter. Here is the smallest useful example:

\`\`\`
function applyTwice(fn, x) {
  return fn(fn(x));
}

applyTwice(double, 3);        // double(double(3)) → 12
applyTwice(s => s + '!', 'go'); // 'go!!'
\`\`\`

Read \`applyTwice\` carefully. It knows nothing about doubling or exclamation marks. It only knows the *shape* of the operation: take a thing, run the given function on it, run it again. The caller supplies the actual behavior. This is abstraction in its purest form — \`applyTwice\` captures a pattern ("do it twice") while staying completely ignorant of the specifics. Every higher-order tool you meet from here on (\`map\`, \`filter\`, \`sort\`, event handlers, middleware) is this same idea wearing different clothes.

A mental model that helps: think of a function value as a sealed machine with an input slot and an output chute. Assigning it to a variable is putting a label on the machine. Passing it to another function is wheeling the machine into someone else's workshop so *they* can decide when to pull the lever. The machine does not run when it moves — it runs when someone writes its name with parentheses. Keep the machine/lever distinction in your head and the rest of this chapter is downhill.

One engineer-mindset aside before you code: interviewers love asking "what does it mean that JavaScript has first-class functions?" A complete answer names the three abilities — functions can be stored in variables and data structures, passed as arguments, and returned from other functions — and gives one practical consequence, like callbacks or \`map\`. You are about to be able to give that answer from experience rather than memory.`,
      task: `Write a function \`double(n)\` that returns n times 2. Then assign that same function to a new name with \`const twice = double\`. Finally, write a higher-order function \`applyTwice(fn, x)\` that returns \`fn(fn(x))\`.`,
      starter: `// 1. function double(n) → n * 2
// 2. const twice = double   (a second label on the same machine)
// 3. function applyTwice(fn, x) → fn(fn(x))
`,
      tests: [
        { name: 'double doubles', code: `assert(typeof double === 'function' && double(7) === 14, 'double should be a function and double(7) should return 14')` },
        { name: 'twice is the same function object', code: `assert(twice === double, 'twice should be assigned the function double itself (no parentheses!), so twice === double')` },
        { name: 'applyTwice applies a function twice', code: `assert(typeof applyTwice === 'function' && applyTwice(double, 3) === 12, 'applyTwice(double, 3) should compute double(double(3)) = 12')` },
        { name: 'applyTwice works with any function', code: `assert(applyTwice(s => s + '!', 'go') === 'go!!', "applyTwice(s => s + '!', 'go') should return 'go!!' — it must call the given fn, not assume doubling")` },
      ],
      hints: [
        'A function name without parentheses is the function itself — a value you can assign. With parentheses, you are calling it and getting its result instead.',
        'For twice, write `const twice = double;` — no parentheses. For applyTwice, call fn on x, then call fn again on that result.',
        'Write `function double(n) { return n * 2 }`, then `const twice = double;`, then `function applyTwice(fn, x) { return fn(fn(x)); }`. The inner fn(x) runs first; its result feeds the outer call.',
      ],
      solution: `function double(n) {
  return n * 2;
}

const twice = double;

function applyTwice(fn, x) {
  return fn(fn(x));
}`,
      xp: 10,
    },
    {
      id: 'ch7-l2',
      title: 'Callbacks: Handing Over the Wheel',
      reading: `A **callback** is a function you hand to another function so it can be called later — "call me back when you get there." The word sounds exotic, but you have been on the receiving end of the idea your whole life: leaving your number with a receptionist, setting an alarm, telling a friend "text me when you land." You are not doing the work at that moment; you are registering *what should happen* when a certain moment arrives. The receptionist owns the *when*; you own the *what*.

That division of labor — the host function owns the control flow, the callback owns the behavior — is the entire trick. Consider a function that runs some work n times:

\`\`\`
function repeat(n, callback) {
  for (let i = 0; i < n; i++) {
    callback(i);
  }
}
\`\`\`

\`repeat\` owns the loop: the counter, the bound, the increment, all the fiddly parts where off-by-one bugs live. It has no idea what work will be done — it just promises to call \`callback\` with each index in turn. The caller supplies the behavior:

\`\`\`
repeat(3, i => console.log('lap ' + i));
// lap 0
// lap 1
// lap 2
\`\`\`

Notice that \`repeat\` calls the callback *with an argument* — the current index. This is a contract between the two sides: the host says "when I call you back, I will hand you the index," and the callback is written to accept it. Every higher-order function publishes a contract like this. \`map\` promises to pass each element; \`sort\` promises to pass two elements to compare. Reading a higher-order function's contract — what will it pass my callback, and what does it expect back? — is the first thing an engineer checks in the documentation, and the source of most callback bugs when skipped.

Why does this matter so much in JavaScript specifically? Because the language grew up inside the browser, where almost everything interesting happens *later*: the user clicks, the network responds, the timer fires. You cannot write \`wait for click\` as a loop — the browser would freeze. Instead you register callbacks: "when the click happens, run this." The entire asynchronous world you will meet later (events, promises, \`async/await\`) is built on top of this one idea. Learning callbacks on simple synchronous loops, as you are doing now, is learning the load-bearing wall of the whole language.

There is a subtle mindset shift hiding here, and it is worth naming: with a callback, *you are writing code that you will not run*. Someone else runs it — the host function, on its schedule, possibly many times, possibly never. Your callback must therefore stand on its own: take what the contract gives it, do its job, and not assume anything about when or how often it fires. Engineers call code like this "inversion of control" — you have inverted who drives. It feels strange for about a day and then becomes the most natural thing in the world.

One practical note on style: callbacks are usually small, so arrow functions are the idiomatic dress for them. \`repeat(5, i => squares.push(i * i))\` reads almost like a sentence. If a callback grows past a few lines, pull it out, give it a name, and pass the name — \`repeat(5, recordSquare)\` — which is also easier to test and reuse. Choosing between an inline arrow and a named function is a real code-review conversation in professional teams; the rule of thumb is that the inline form should never make the reader scroll.`,
      task: `Implement \`repeat(n, callback)\` which calls \`callback(i)\` once for each i from 0 up to (but not including) n. Then create \`const squares = []\` and use your \`repeat\` to fill it with the squares of 0 through 4.`,
      starter: `// function repeat(n, callback) — loop i from 0 to n-1, call callback(i) each time

// const squares = [];
// use repeat(5, ...) to push i*i into squares
`,
      tests: [
        { name: 'repeat calls the callback n times with each index', code: `const seen = []; repeat(3, i => seen.push(i)); assert(seen.join(',') === '0,1,2', 'repeat(3, cb) should call cb(0), cb(1), cb(2) — got indexes: [' + seen.join(',') + ']')` },
        { name: 'repeat(0) never calls the callback', code: `let calls = 0; repeat(0, () => calls++); assert(calls === 0, 'repeat(0, cb) should not call cb at all, but it was called ' + calls + ' time(s)')` },
        { name: 'squares built via repeat', code: `assert(Array.isArray(squares) && squares.join(',') === '0,1,4,9,16', 'squares should be [0,1,4,9,16] — the squares of 0 through 4')` },
      ],
      hints: [
        'repeat owns the loop; the callback owns the work. Inside the loop, invoke the parameter like any function: callback(i).',
        'Use a standard for loop: `for (let i = 0; i < n; i++) callback(i);`. Then call repeat(5, ...) passing an arrow function that pushes i*i into squares.',
        'Write `function repeat(n, callback) { for (let i = 0; i < n; i++) { callback(i); } }`, then `const squares = [];` and `repeat(5, i => squares.push(i * i));`. The arrow receives each index because repeat passes it.',
      ],
      solution: `function repeat(n, callback) {
  for (let i = 0; i < n; i++) {
    callback(i);
  }
}

const squares = [];
repeat(5, i => squares.push(i * i));`,
      xp: 10,
    },
    {
      id: 'ch7-l3',
      title: 'map and filter: Transform and Keep',
      reading: `Two operations account for a huge share of all data work: *transform every element* and *keep only some elements*. JavaScript arrays ship both as built-in higher-order methods, and once you internalize them you will see loops in a new, slightly unflattering light. Meet \`map\` and \`filter\`.

\`map\` takes a callback and returns a **new array** where each element is the callback's answer for the corresponding original element. Same length, same order, transformed contents:

\`\`\`
const prices = [10, 20, 30];
const withTax = prices.map(p => p * 1.08);
// [10.8, 21.6, 32.4] — prices is untouched
\`\`\`

The mental model is a conveyor belt through a machine: every item goes in one side, a transformed item comes out the other, and the original crate is never opened. That last part deserves emphasis: **map does not mutate the source array**. It manufactures a fresh one. In an era where most bugs in front-end code trace back to "something changed my data when I wasn't looking," non-mutating transformations are not a stylistic preference — they are how large applications stay sane. React, for instance, detects changes by comparing old and new arrays; mutate in place and the framework literally cannot see your update.

\`filter\` takes a callback that answers a yes/no question — a **predicate** — and returns a new array containing only the elements that got a yes:

\`\`\`
const affordable = prices.filter(p => p < 25);
// [10, 20]
\`\`\`

The predicate is called once per element and must return something truthy to keep it. Note what filter is *not*: it is not "remove" — the original array survives intact — and it is not "find one" — it keeps every match (there is a separate \`find\` for the first match). A classic beginner bug is writing \`prices.filter(p => p * 1.08)\` hoping to transform: filter only ever *selects*, and since every nonzero number is truthy, that predicate keeps everything and transforms nothing. Transform is map's job; selection is filter's. One verb per tool.

Because both methods return arrays, they **chain**. The output of one becomes the input of the next, and you get a pipeline that reads top to bottom like a recipe:

\`\`\`
const cheapWithTax = prices
  .filter(p => p < 25)
  .map(p => p * 1.08);
\`\`\`

Read it aloud: "take prices, keep the ones under 25, then add tax to each." That is the whole program, and the English and the code have the same shape. Compare the loop version — declare an empty result, loop, if-check, push a computed value — where the *what* is smeared across five lines of *how*. Pipelines are the reason experienced JavaScript reads faster than beginner JavaScript: each stage names its intent.

Order in a chain matters, and thinking about it is a small engineering exercise every time. Here, filtering first means the map does less work — we only tax the items we are keeping. Filter-then-map is also often the only *correct* order: if the filter condition depends on the original value (price under 25 *before* tax), running map first would change what the filter sees. When you review pipeline code — your own or a colleague's — checking each stage's input shape is the habit: what exactly is flowing into this stage, and is it still what the callback assumes?

An interview aside: "implement map using a for loop" and "what's the difference between map and forEach" are perennial warm-up questions. The answers you now own: map builds and returns a new array from callback results; \`forEach\` just visits elements and returns \`undefined\`, so it is for side effects only. If you catch yourself calling map and ignoring its return value, you wanted forEach — and a good linter will tell you so.`,
      task: `Starting from the given \`prices\` array (do not modify it), create: \`withTax\` — every price multiplied by 1.08 (map); \`affordable\` — only the original prices under 25 (filter); and \`cheapWithTax\` — the under-25 prices with tax applied, built as a single filter-then-map chain.`,
      starter: `const prices = [12.5, 48, 7, 99.99, 20];

// const withTax = ...      map: every price * 1.08
// const affordable = ...   filter: original prices under 25
// const cheapWithTax = ... chain: filter under 25, then apply tax
`,
      tests: [
        { name: 'withTax maps every price', code: `assert(Array.isArray(withTax) && withTax.length === 5 && Math.abs(withTax[0] - 13.5) < 1e-9 && Math.abs(withTax[2] - 7.56) < 1e-9, 'withTax should have all 5 prices multiplied by 1.08 (12.5 → 13.5, 7 → 7.56)')` },
        { name: 'affordable keeps only prices under 25', code: `assert(Array.isArray(affordable) && affordable.join(',') === '12.5,7,20', 'affordable should be [12.5, 7, 20] — the original prices under 25, in order')` },
        { name: 'cheapWithTax chains filter then map', code: `assert(Array.isArray(cheapWithTax) && cheapWithTax.length === 3 && Math.abs(cheapWithTax[0] - 13.5) < 1e-9 && Math.abs(cheapWithTax[1] - 7.56) < 1e-9 && Math.abs(cheapWithTax[2] - 21.6) < 1e-9, 'cheapWithTax should be the under-25 prices with tax: about [13.5, 7.56, 21.6]')` },
        { name: 'prices was never mutated', code: `assert(prices.join(',') === '12.5,48,7,99.99,20', 'prices must be unchanged — map and filter return NEW arrays; nothing should modify the original')` },
      ],
      hints: [
        'map transforms every element into a new array; filter keeps only elements whose predicate returns true. Neither touches the original array.',
        'withTax: `prices.map(p => p * 1.08)`. affordable: `prices.filter(p => p < 25)`. For the chain, call .filter first, then .map on its result.',
        'Write `const withTax = prices.map(p => p * 1.08);`, `const affordable = prices.filter(p => p < 25);`, and `const cheapWithTax = prices.filter(p => p < 25).map(p => p * 1.08);`. Filtering first means you only tax what you keep.',
      ],
      solution: `const prices = [12.5, 48, 7, 99.99, 20];

const withTax = prices.map(p => p * 1.08);
const affordable = prices.filter(p => p < 25);
const cheapWithTax = prices.filter(p => p < 25).map(p => p * 1.08);`,
      xp: 10,
    },
    {
      id: 'ch7-l4',
      title: 'reduce: The One That Builds Anything',
      reading: `\`map\` transforms, \`filter\` selects — but both return arrays, one output per surviving input. Sometimes you need to boil a whole array down to a *single* result: a total, a maximum, a combined object, a summary. That is \`reduce\`, the most powerful and the most feared of the three. Feared unfairly: reduce follows one simple ritual, and once you can narrate the ritual, you can write any reduce.

The ritual: reduce walks the array left to right, carrying a running result called the **accumulator**. At each element it calls your callback with two things — the accumulator so far, and the current element — and *whatever your callback returns becomes the new accumulator*. When the array is exhausted, the final accumulator is reduce's answer. You also hand reduce a starting value for the accumulator as its second argument.

\`\`\`
const nums = [4, 8, 15];
const total = nums.reduce((sum, n) => sum + n, 0);
// step 1: sum=0,  n=4  → returns 4
// step 2: sum=4,  n=8  → returns 12
// step 3: sum=12, n=15 → returns 27
\`\`\`

Trace that table until it feels boring — that is the entire mechanism. The mental model is a snowball rolling through the array: it starts at whatever size you gave it (here 0), and each element gets packed on according to your callback's rule. The two most common bugs both violate the ritual: forgetting to **return** the accumulator from the callback (next step receives \`undefined\`, everything collapses), and forgetting the **initial value** (reduce then uses the first element as the starting accumulator, which happens to work for sums but explodes the moment your accumulator is a different type than your elements).

That last point is where reduce earns its reputation as "the one that builds anything": the accumulator does not have to be a number. It can be a string, an array, an object — any value your callback knows how to grow. Want to find the longest word? Carry the best-so-far:

\`\`\`
const longest = words.reduce(
  (best, w) => w.length > best.length ? w : best,
  ''
);
\`\`\`

Want to count things by category? Carry an object and increment keys on it:

\`\`\`
const counts = words.reduce((acc, w) => {
  acc[w.length] = (acc[w.length] || 0) + 1;
  return acc;
}, {});
\`\`\`

Read that second one slowly, because it is the single most common real-world reduce. The accumulator starts as \`{}\`. For each word, we look up its length as a key; \`acc[w.length] || 0\` says "the count so far, or 0 if we have never seen this length." We add one, store it back, and — the crucial line — \`return acc\` so the next iteration receives the object. This grouping-and-counting pattern appears in analytics dashboards, log processing, and interview questions with remarkable regularity; interviewers use "count the occurrences of each word" as a litmus test precisely because it requires an object accumulator.

A word on judgment, engineer to engineer: reduce is powerful enough to reimplement map, filter, and everything else, and some people take that as a challenge. Resist. A reduce whose callback is ten lines of branching is usually a loop wearing a costume — harder to read than the honest \`for\` version, with none of map's or filter's at-a-glance clarity. The professional rule of thumb: use reduce when the answer is genuinely *one accumulated value* and the callback fits in a few lines. When it does fit, nothing else says "combine all of this into that" as cleanly.

One more framing that helps it stick: map and filter answer "what does each element become?" and "does each element stay?" — element-local questions. Reduce answers a question *about the whole collection*: what is the sum, the winner, the tally? When you notice your question is about the whole, reach for reduce, decide what the accumulator looks like when empty, and write the one rule that folds an element in. Accumulator shape first, rule second — in that order, every reduce writes itself.`,
      task: `Using \`reduce\` (three times), compute: \`total\` — the sum of \`nums\`; \`longest\` — the longest string in \`words\`; and \`countsByLength\` — an object mapping each word length to how many words have that length.`,
      starter: `const nums = [4, 8, 15, 16, 23, 42];
const words = ['delta', 'a', 'ferocious', 'be', 'gamma'];

// const total = nums.reduce(...)          start at 0
// const longest = words.reduce(...)       carry the best-so-far
// const countsByLength = words.reduce(...) accumulator is an object {}
`,
      tests: [
        { name: 'total sums nums', code: `assert(total === 108, 'total should be 108 (the sum of 4+8+15+16+23+42), got ' + total)` },
        { name: 'longest finds the longest word', code: `assert(longest === 'ferocious', "longest should be 'ferocious' (9 letters) — carry the best-so-far and keep the longer of the two, got '" + longest + "'")` },
        { name: 'countsByLength tallies word lengths', code: `assert(countsByLength && countsByLength[5] === 2 && countsByLength[1] === 1 && countsByLength[2] === 1 && countsByLength[9] === 1, 'countsByLength should be {5: 2, 1: 1, 2: 1, 9: 1} — two 5-letter words, one each of lengths 1, 2, 9')` },
      ],
      hints: [
        'Every reduce needs two decisions: what does the accumulator look like when empty (0? ""? {}?), and what one rule folds an element into it. The callback must return the new accumulator every time.',
        "total: `nums.reduce((sum, n) => sum + n, 0)`. longest: start at '' and return whichever of (best, w) is longer. countsByLength: start at {} and bump acc[w.length].",
        "For the counter: `words.reduce((acc, w) => { acc[w.length] = (acc[w.length] || 0) + 1; return acc; }, {})`. The `|| 0` handles the first sighting of a length; the `return acc` hands the object to the next step — forget it and everything becomes undefined.",
      ],
      solution: `const nums = [4, 8, 15, 16, 23, 42];
const words = ['delta', 'a', 'ferocious', 'be', 'gamma'];

const total = nums.reduce((sum, n) => sum + n, 0);

const longest = words.reduce(
  (best, w) => (w.length > best.length ? w : best),
  ''
);

const countsByLength = words.reduce((acc, w) => {
  acc[w.length] = (acc[w.length] || 0) + 1;
  return acc;
}, {});`,
      xp: 15,
    },
    {
      id: 'ch7-l5',
      title: 'sort, Comparators, and Honest Loops',
      reading: `Sorting looks like it should be the easy one — \`array.sort()\`, done. It is instead the method with the most famous trap in JavaScript, plus your first meeting with a callback that answers a *comparison* rather than a transformation. And at the end of this lesson we will have the conversation every pipeline enthusiast eventually needs: when a plain loop is simply the better tool.

First, the trap. With no arguments, \`sort\` converts every element to a **string** and sorts alphabetically. For words, fine. For numbers, catastrophe: \`[80, 9, 100].sort()\` yields \`[100, 80, 9]\`, because as strings, "100" comes before "80" the same way "apple" comes before "banana." This is a legacy design decision from 1995 that can never be fixed without breaking the web, so every JavaScript engineer simply learns the rule: **never sort non-strings without a comparator.** It is a genuine interview question and an even more genuine production bug.

The comparator is a callback with a three-way contract. \`sort\` hands it two elements, \`a\` and \`b\`, and reads the returned number as a verdict: negative means "a comes first," positive means "b comes first," zero means "no preference." For numbers, subtraction happens to encode the verdict perfectly:

\`\`\`
nums.sort((a, b) => a - b);   // ascending: if a < b, a-b is negative → a first
nums.sort((a, b) => b - a);   // descending
players.sort((a, b) => b.score - a.score);  // objects: highest score first
\`\`\`

That last line is the everyday form — real data is objects, and the comparator picks the field that matters. Take a second to see *why* \`b.score - a.score\` sorts descending: if b's score is bigger, the result is positive, which means "b first" — the bigger one wins. You do not memorize comparator directions; you re-derive them from the contract in five seconds, which is exactly what working engineers do at the keyboard.

Second trap, subtler and nastier: **sort mutates the array in place.** Unlike map and filter, which manufacture new arrays, sort rearranges the one you gave it — and returns that same, now-reordered array as a convenience. If some other part of your program depended on the original order, you just broke it from a distance. The idiom that avoids this is to copy first: \`const ranked = [...players].sort(...)\` — spread into a fresh array, sort the copy, original untouched. In code review, a bare \`.sort()\` on shared data is the kind of line a senior engineer circles in red.

Because sorted output is an array, sort chains like everything else. "Top three players by score" becomes a pipeline of three verbs:

\`\`\`
const topThree = [...players]
  .sort((a, b) => b.score - a.score)
  .slice(0, 3)
  .map(p => p.name);
\`\`\`

Copy, rank, take three, extract names. Four stages, each one testable in your head, and the code reads in the same order you would explain it to a colleague.

Now the honest conversation. Pipelines are not always the right call, and knowing when they are not is a skill interviewers and teammates both notice. Loops beat pipelines when you need to **stop early** — searching for the first match in a million records, a \`for\` loop can \`break\` at item three, while \`filter\` grimly visits all million (use \`find\` or a loop). Loops win when one pass must produce **several results at once** — computing the min, max, and sum together is one clean loop or three separate reduces that each re-walk the array. Loops win when the logic between elements is genuinely stateful and tangled — if your reduce callback needs comments to explain the accumulator, the \`for\` version is probably clearer. And in rare hot paths, a loop avoids the overhead of allocating intermediate arrays at every pipeline stage.

Pipelines win the rest of the time — which, in ordinary application code, is most of the time: transformations, selections, reshaping data for display. The engineering principle underneath is *say what you mean with the least ceremony*. \`map\` says "transform" instantly; a loop makes the reader deduce it. But a loop with a \`break\` says "I stop early" instantly; the pipeline version hides that. Choose the form whose meaning is on the surface. Anyone can learn the syntax of both; choosing well between them is the actual skill.`,
      task: `Without mutating \`players\`, create \`ranked\` — a new array of the players sorted by score, highest first (copy with spread, then sort with a comparator). Then chain \`slice\` and \`map\` on \`ranked\` to build \`topThree\` — the names of the three highest scorers.`,
      starter: `const players = [
  { name: 'Ada', score: 82 },
  { name: 'Grace', score: 97 },
  { name: 'Linus', score: 64 },
  { name: 'Edsger', score: 91 },
  { name: 'Barbara', score: 88 },
];

// const ranked = ...   copy first ([...players]), then .sort with a comparator
// const topThree = ... ranked.slice(0, 3).map(...) → just the names
`,
      tests: [
        { name: 'ranked is sorted by score descending', code: `assert(Array.isArray(ranked) && ranked.length === 5 && ranked[0].name === 'Grace' && ranked[1].name === 'Edsger' && ranked[4].name === 'Linus', 'ranked should order players highest score first: Grace(97), Edsger(91), Barbara(88), Ada(82), Linus(64)')` },
        { name: 'players was not mutated', code: `assert(players[0].name === 'Ada' && players[4].name === 'Barbara', 'players must keep its original order — sort mutates in place, so copy with [...players] before sorting')` },
        { name: 'topThree chains slice and map', code: `assert(Array.isArray(topThree) && topThree.join(',') === 'Grace,Edsger,Barbara', "topThree should be ['Grace','Edsger','Barbara'] — the names (strings, not objects) of the top 3")` },
      ],
      hints: [
        'sort rearranges the array you call it on. To keep players pristine, sort a copy. The comparator receives two players and must return a number: negative if the first should come first.',
        'Copy with spread: `[...players]`. Descending by score: `.sort((a, b) => b.score - a.score)`. Then `.slice(0, 3)` takes the first three, and `.map(p => p.name)` extracts names.',
        'Write `const ranked = [...players].sort((a, b) => b.score - a.score);` then `const topThree = ranked.slice(0, 3).map(p => p.name);`. b.score - a.score is positive when b is bigger, which tells sort to put b first — that is what makes it descending.',
      ],
      solution: `const players = [
  { name: 'Ada', score: 82 },
  { name: 'Grace', score: 97 },
  { name: 'Linus', score: 64 },
  { name: 'Edsger', score: 91 },
  { name: 'Barbara', score: 88 },
];

const ranked = [...players].sort((a, b) => b.score - a.score);
const topThree = ranked.slice(0, 3).map(p => p.name);`,
      xp: 15,
    },
    {
      id: 'ch7-l6',
      title: 'Capstone: The Grade Pipeline',
      reading: `Time to put the whole chapter under load. You are going to build the kind of small data-processing feature that appears, in some form, in nearly every real application: take raw records, derive a computed value for each, rank them, select a subset by a rule, and produce a summary statistic. A teacher's gradebook is our stand-in, but swap the nouns and this is a sales dashboard, a sports league table, or a server-latency report — the shapes of data work repeat far more than the domains do.

Before writing any pipeline, an engineer sketches the *stages* and the *shape of the data between them*. Do that now, on paper or in your head. We start with an array of students, each \`{ name, scores }\` where scores is an array of numbers. Stage one: we need each student's average — that is a per-element computation, so \`map\`, producing \`{ name, avg }\` objects. Stage two: rank them best first — \`sort\` with a comparator on \`avg\` (on a copy, or on the array map just built for us, which nobody else owns yet). Stage three: the honor roll is "students with avg at or above 90, names only, best first" — \`filter\` then \`map\` on the already-sorted report. Stage four: the class average is one number derived from the whole collection — \`reduce\` territory, or better, a reusable \`average\` function you call twice.

That last observation is the capstone's real lesson: **write the helper once**. Averaging appears twice in this problem — once per student, once across the class. The amateur move is to write the reduce inline in both places; the professional move is a five-line \`average(numbers)\` function used everywhere averaging happens. This is not just less typing. When the definition of "average" changes — drop the lowest score, weight the final exam — you change one function and every caller inherits the fix. Duplicated logic drifts apart; extracted logic stays true. Interviewers watch for exactly this instinct when they hand you a problem with a repeated sub-computation.

A note on building objects inside map, since it is this capstone's only new syntax wrinkle. To turn a student into a \`{ name, avg }\` record, your callback returns an object literal:

\`\`\`
students.map(s => ({ name: s.name, avg: average(s.scores) }))
\`\`\`

Those parentheses around the object are load-bearing. An arrow function whose body starts with \`{\` is parsed as a code block, not an object — so \`s => { name: ... }\` is a function that does nothing and returns undefined. Wrapping the object in \`( )\` forces it to be read as an expression. Every JavaScript developer has lost twenty minutes to this once; consider this paragraph your inoculation.

Think, too, about the *order of stages* as a correctness question, the way you did in the map/filter lesson. If you sort the report first, then filter for the honor roll, the honor roll comes out already ranked — the sort's work flows downstream for free. Filter first and you would have to sort twice. Pipelines reward this kind of thinking: each stage should hand the next one data in its most useful form.

Finally, notice what you are *not* doing: no index bookkeeping, no manually synchronized arrays of names and averages, no mutation of the input. Each derived value — \`report\`, \`honorRoll\`, \`classAverage\` — is a fresh, named, immutable-in-spirit result computed from the stage before it. Code in this style has a property engineers prize: you can read any single line and verify it without holding the rest of the program in your head. That, more than brevity, is why higher-order style won. Build it.`,
      task: `Write a function \`average(numbers)\` that returns the mean of an array of numbers (use reduce). Then build: \`report\` — an array of \`{ name, avg }\` for each student, sorted by avg descending; \`honorRoll\` — the names from report with avg >= 90, in that ranked order; and \`classAverage\` — the average of all the student averages (reuse your function!).`,
      starter: `const students = [
  { name: 'Ada', scores: [95, 88, 92] },
  { name: 'Grace', scores: [100, 92, 96] },
  { name: 'Linus', scores: [70, 80, 75] },
  { name: 'Edsger', scores: [88, 90, 92] },
  { name: 'Barbara', scores: [60, 70, 65] },
];

// function average(numbers) — reduce to a sum, divide by length

// const report = ...      map to { name, avg }, then sort by avg descending
// const honorRoll = ...   from report: avg >= 90, names only
// const classAverage = ...average of the avgs (reuse average!)
`,
      tests: [
        { name: 'average computes the mean', code: `assert(typeof average === 'function' && Math.abs(average([2, 4, 6]) - 4) < 1e-9 && average([7]) === 7, 'average([2,4,6]) should be 4 and average([7]) should be 7')` },
        { name: 'report has {name, avg} sorted by avg descending', code: `assert(Array.isArray(report) && report.length === 5 && report[0].name === 'Grace' && Math.abs(report[0].avg - 96) < 1e-9 && report[4].name === 'Barbara', 'report should rank Grace(96) first and Barbara(65) last, each entry shaped { name, avg }')` },
        { name: 'honorRoll lists avg >= 90, best first', code: `assert(Array.isArray(honorRoll) && honorRoll.join(',') === 'Grace,Ada,Edsger', "honorRoll should be ['Grace','Ada','Edsger'] — the names (only) of students averaging 90+, highest first. Edsger averages exactly 90, so >= keeps him.")` },
        { name: 'classAverage averages the averages', code: `assert(Math.abs(classAverage - 83.53333333333333) < 1e-6, 'classAverage should be about 83.533 — the mean of the five student averages (reuse your average function on the avgs)')` },
      ],
      hints: [
        'Sketch the stages: map students to {name, avg} using your helper, sort that by avg descending, then filter+map for the honor roll, and run average over the avg values for the class figure.',
        'average: `numbers.reduce((s, n) => s + n, 0) / numbers.length`. report: `students.map(s => ({ name: s.name, avg: average(s.scores) })).sort((a, b) => b.avg - a.avg)` — note the parentheses around the object literal. honorRoll: `report.filter(r => r.avg >= 90).map(r => r.name)`.',
        'The full flow: define average; `const report = students.map(s => ({ name: s.name, avg: average(s.scores) })).sort((a, b) => b.avg - a.avg);`; `const honorRoll = report.filter(r => r.avg >= 90).map(r => r.name);`; `const classAverage = average(report.map(r => r.avg));`. Because report is already sorted, honorRoll comes out ranked for free.',
      ],
      solution: `const students = [
  { name: 'Ada', scores: [95, 88, 92] },
  { name: 'Grace', scores: [100, 92, 96] },
  { name: 'Linus', scores: [70, 80, 75] },
  { name: 'Edsger', scores: [88, 90, 92] },
  { name: 'Barbara', scores: [60, 70, 65] },
];

function average(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

const report = students
  .map(s => ({ name: s.name, avg: average(s.scores) }))
  .sort((a, b) => b.avg - a.avg);

const honorRoll = report.filter(r => r.avg >= 90).map(r => r.name);

const classAverage = average(report.map(r => r.avg));`,
      xp: 20,
    },
  ],
};
