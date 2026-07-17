// Chapter 3 — Loops & Repetition. Shape defined in ../SCHEMA.md.

export default {
  id: 'ch3',
  title: 'Loops & Repetition',
  tagline: 'Make the machine do the boring part a million times without complaint.',
  badge: { name: 'Iteration Engineer', emoji: '🔁' },
  intro: `Everything a computer is genuinely good at comes down to one trick: doing a simple thing an absurd number of times, perfectly, without getting bored. Your phone redraws the screen sixty times a second. A web server answers the same kind of request millions of times a day. A physics engine updates every particle, every frame, forever. None of that is clever code — it is simple code inside a loop.

Up to now, every program you have written ran top to bottom exactly once. This chapter changes that. You will learn to write code that runs *again and again* while a condition holds, and — more importantly — you will learn to reason about it: how many times does it run? What is true when it stops? What changes on each pass? Engineers call this thinking about **invariants**, and it is the difference between loops that work and loops that hang forever or miss by one.

We will cover the \`while\` loop (repeat while something is true), the \`for\` loop (the industry-standard counting machine), the accumulator pattern (the single most-used loop idiom in existence), the infamous off-by-one error, nested loops, and the escape hatches \`break\` and \`continue\`. The capstone sends you on the Collatz flight — a famous unsolved problem in mathematics that you can explore with fifteen lines of code.

One warning before you start: an interviewer can tell within ninety seconds whether a candidate actually understands loops or has just memorized the syntax. The tell is always the same — can you say, out loud, what is true *before* the loop, *during* each pass, and *after* it exits? By the end of this chapter, you will be able to.`,
  lessons: [
    {
      id: 'ch3-l1',
      title: 'The while Loop: Repeat Until Done',
      reading: `A \`while\` loop is the most honest loop in the language. It says exactly what it does: **while this condition is true, keep running this block.**

\`\`\`js
let count = 0;
while (count < 3) {
  console.log('pass number', count);
  count = count + 1;
}
\`\`\`

Here is the machine's-eye view, because the mental model matters more than the syntax. When execution reaches the \`while\`, the computer evaluates the condition. If it is \`true\`, it runs the body, then jumps *back up* and evaluates the condition again. If it is \`false\`, it skips past the closing brace and continues with the rest of the program. That is the entire mechanism. There is no magic counter, no hidden bookkeeping — just a condition checked at the top of every lap.

That simplicity has a sharp edge. The loop only ever stops because *something in the body changes the world* so that the condition eventually becomes false. In the example above, that something is \`count = count + 1\`. Delete that line and \`count\` stays \`0\`, the condition \`0 < 3\` stays true, and the loop runs forever. This is the **infinite loop**, and every working programmer has shipped at least one. (This editor kills your code after two seconds and tells you so — real production systems are not always so forgiving. There are famous outages that were, at bottom, a while loop whose exit condition could never become true.)

So a correct while loop always has three ingredients, and it is worth naming them explicitly:

- **State before the loop** — a variable set up so the condition means something (\`let count = 0\`).
- **A condition** that reads that state (\`count < 3\`).
- **Progress inside the body** — a change that moves the state toward making the condition false (\`count = count + 1\`).

When you review a loop — yours or a colleague's — check those three things in that order. In real codebases, \`while\` shows up when you *don't* know in advance how many repetitions you need: keep reading until the file ends, keep retrying until the network call succeeds, keep halving until the number reaches one. The loop runs "as long as necessary," and the condition is the contract that defines "necessary."

One more mental model that will pay off for the rest of your career: think of each pass through the body as a photograph of the variables. Pass one: \`count\` is 0. Pass two: \`count\` is 1. Pass three: \`count\` is 2. Then the condition check sees 3, \`3 < 3\` is false, and the loop exits. Being able to replay those photographs in your head — engineers call it *tracing* — is how you debug loops without staring blankly at them. Slow is smooth, smooth is fast.

Your first task is the classic proving ground: sum every integer from 1 to 100. Legend says Gauss did it in his head as a schoolboy by spotting a shortcut (we will meet that shortcut in lesson 3). You get to do it the honest way — one lap at a time.`,
      task: 'Using a while loop, add up every integer from 1 through 100 (inclusive) and store the result in a variable named `total`.',
      starter: `// Sum the integers 1 through 100 with a while loop.
let total = 0;
let n = 1;
// your while loop here
`,
      tests: [
        { name: 'total is a number', code: `assert(typeof total === 'number', 'total should be a number — did you declare it and add to it?')` },
        { name: 'total equals 5050', code: `assert(total === 5050, 'total should be 5050 (the sum of 1..100), but got ' + total + '. Check your condition: does the loop include 100?')` },
        { name: 'loop counter finished past 100', code: `assert(typeof n === 'number' && n > 100, 'after the loop, n should have advanced past 100 — make sure the body increments n every pass')` },
      ],
      hints: [
        'You need three things: total starting at 0, a counter n starting at 1, and a loop that keeps going while n is still small enough. Each pass should add n to total and then move n forward.',
        'The condition is `while (n <= 100)`. Inside the body: first `total = total + n;`, then `n = n + 1;`. The order matters less here than remembering BOTH lines — forget the increment and the loop never ends.',
        'Full shape: start with `let total = 0; let n = 1;`. Then `while (n <= 100) { total = total + n; n = n + 1; }`. Trace the first two passes: total becomes 1 (n moves to 2), total becomes 3 (n moves to 3)… and the final pass adds 100. The condition check then sees n = 101, which fails `n <= 100`, and the loop exits with total = 5050.',
      ],
      solution: `let total = 0;
let n = 1;
while (n <= 100) {
  total = total + n;
  n = n + 1;
}`,
      xp: 10,
    },
    {
      id: 'ch3-l2',
      title: 'Anatomy of a for Loop',
      reading: `In the last lesson you wrote a while loop with three scattered pieces: setup before the loop, a condition at the top, and a step buried in the body. That pattern — *count from A to B, doing something each time* — is so common that the language gives it a dedicated form. The \`for\` loop takes those same three pieces and puts them on one line, in one place, where a reader can audit them at a glance:

\`\`\`js
for (let i = 1; i <= 10; i = i + 1) {
  console.log(i);
}
\`\`\`

Read the header left to right as **init; condition; step**. The *init* (\`let i = 1\`) runs exactly once, before anything else. The *condition* (\`i <= 10\`) is checked before every pass, exactly like a while loop's condition — if it is false on the very first check, the body runs zero times. The *step* (\`i = i + 1\`) runs after each pass of the body, just before the condition is checked again. That ordering — init, check, body, step, check, body, step, … — is worth burning in, because interviewers love asking what a loop prints, and the answer always hinges on *when* the step happens.

Here is the important secret: **a for loop is not a new kind of loop**. It compiles down to the same thing as the while loop you already wrote:

\`\`\`js
let i = 1;              // init
while (i <= 10) {       // condition
  console.log(i);       // body
  i = i + 1;            // step
}
\`\`\`

Same machine behavior, different packaging. So why does every codebase on Earth prefer \`for\` when counting? Because it is a *contract you can read in one line*. When a reviewer sees \`for (let i = 0; i < items; i = i + 1)\`, they instantly know: starts at 0, runs \`items\` times, steps by one, and — crucially — the counter cannot be forgotten, because the step lives in the header where it cannot be deleted by accident. With a while loop, the increment is just another line in the body, one careless refactor away from an infinite loop.

Two conventions you will see everywhere. First, the counter is traditionally named \`i\` (then \`j\`, then \`k\` for inner loops) — this dates back to FORTRAN in the 1950s and is so universal that naming your loop counter \`loopIndexVariable\` would actually make your code *harder* for other engineers to read. Second, most real-world loops start at 0, not 1, because (as you will see in Chapter 5) collections number their elements from 0. Today we will count from 1 because the math problem calls for it — the header adapts to the problem, not the other way around.

You will also see the shorthand \`i++\` in the step position, which means exactly \`i = i + 1\`. Use whichever you like; they are the same instruction to the machine.

Your task: compute the sum of squares 1² + 2² + 3² + … + 10². Same accumulator idea as last lesson — but this time the loop machinery lives in one tidy header, and each pass adds \`i * i\` instead of \`i\`.`,
      task: 'Using a for loop, compute 1*1 + 2*2 + ... + 10*10 and store the result in a variable named `sumOfSquares`.',
      starter: `// Sum of squares from 1 to 10, with a for loop.
let sumOfSquares = 0;
// for (init; condition; step) { ... }
`,
      tests: [
        { name: 'sumOfSquares is a number', code: `assert(typeof sumOfSquares === 'number', 'sumOfSquares should be a number')` },
        { name: 'sumOfSquares equals 385', code: `assert(sumOfSquares === 385, 'sumOfSquares should be 385 (1+4+9+...+100), but got ' + sumOfSquares + '. Check that the loop runs from 1 through 10 inclusive and adds i * i each pass.')` },
      ],
      hints: [
        'Same accumulator rhythm as the last lesson: a running total starting at 0, and a loop that visits 1 through 10. The only new part is that all three loop pieces (start, condition, step) go inside the for header.',
        'The header is `for (let i = 1; i <= 10; i = i + 1)`. Inside the body, add the square of the counter: `sumOfSquares = sumOfSquares + i * i;`.',
        'Put it together: `let sumOfSquares = 0;` then `for (let i = 1; i <= 10; i = i + 1) { sumOfSquares = sumOfSquares + i * i; }`. Trace the first three passes: 0+1=1, 1+4=5, 5+9=14 … and the last pass adds 100, landing on 385.',
      ],
      solution: `let sumOfSquares = 0;
for (let i = 1; i <= 10; i = i + 1) {
  sumOfSquares = sumOfSquares + i * i;
}`,
      xp: 10,
    },
    {
      id: 'ch3-l3',
      title: 'The Accumulator Pattern',
      reading: `You have now used the same idea twice without naming it, so let's name it, because it is arguably the single most common loop idiom in all of programming: the **accumulator pattern**. Start a variable at a neutral value, then let each pass of the loop fold one more piece into it. Sum of a range. Total of a shopping cart. Longest word seen so far. Number of failed login attempts. A log file built line by line. Different problems, identical skeleton:

\`\`\`js
let acc = /* neutral starting value */;
for (/* each item or number */) {
  acc = /* combine acc with this pass's contribution */;
}
// after the loop, acc holds the answer
\`\`\`

The subtle skill is choosing the right **neutral value** — the value that leaves the combination unchanged. Summing? Start at \`0\`, because adding 0 changes nothing. Multiplying? Start at \`1\`, because multiplying by 1 changes nothing. Building a string? Start at \`''\`, the empty string. Get this wrong and every result is silently off: a product accumulator that starts at \`0\` will multiply everything into 0 and never recover. In algebra this neutral value is called the *identity element*, and when you reach Chapter 7 you will meet \`reduce\`, a built-in function whose entire job is running this exact pattern — it literally asks you for the starting value as an argument. What you are practicing now is the manual transmission version of a machine you will drive daily.

There is a second mental model worth installing here: the accumulator is the loop's **memory**. Each pass of a loop is otherwise amnesiac — variables declared inside the body are born and die within that single pass. The accumulator, declared *outside* the loop, is the one thread of continuity, the notebook the loop writes in. When a loop's answer is wrong, the very first question to ask is: what was in the notebook before pass one, and what did each pass write? Trace three passes by hand. This works on a whiteboard in an interview and it works at 2 a.m. on a production bug, and it is the same skill.

Now, an engineer-mindset confession: for *this particular* sum there is a famous shortcut. Gauss noticed that 1..100 pairs up into fifty pairs of 101, so the sum is \`n * (n + 1) / 2\` — no loop at all, one multiplication, instant for n of a hundred or a hundred trillion. A closed-form formula beats a loop every time one exists. So why practice loops? Because closed forms are rare luxuries. Nobody has a formula for "total of whatever ended up in this shopping cart" or "how many log lines mention this error." The accumulator pattern is the general-purpose tool; formulas are the occasional gift. Part of engineering judgment — and we will return to this in the capstone — is recognizing which situation you are in before reaching for a loop.

Time to prove you can drive both accumulators. You will compute two answers in one program: the sum of every even number from 2 through 50, and the product 1 × 2 × 3 × … × 10 (written \`10!\`, "ten factorial"). One starts at 0 and adds; the other starts at 1 and multiplies. You can use two separate loops — clarity beats cleverness, and two simple loops are easier to verify than one entangled one.`,
      task: 'Create `sumEven`, the sum of all even numbers from 2 through 50, and `factorial10`, the product 1 * 2 * ... * 10. Use loops with accumulators (any mix of while/for).',
      starter: `// Two accumulators, two neutral starting values.
let sumEven = 0;
let factorial10 = 1;
// loop(s) here
`,
      tests: [
        { name: 'sumEven equals 650', code: `assert(sumEven === 650, 'sumEven should be 650 (2+4+...+50), but got ' + sumEven + '. Are you only adding even numbers, and including 50?')` },
        { name: 'factorial10 equals 3628800', code: `assert(factorial10 === 3628800, 'factorial10 should be 3628800, but got ' + factorial10 + '. Did the product accumulator start at 1 (not 0), and does the loop reach 10?')` },
        { name: 'accumulators are numbers', code: `assert(typeof sumEven === 'number' && typeof factorial10 === 'number', 'both sumEven and factorial10 should be numbers')` },
      ],
      hints: [
        'Two independent jobs: one accumulator starts at 0 and adds; the other starts at 1 and multiplies. Write one loop for each — no prize for cramming them together.',
        'For the evens, either step by 2 — `for (let i = 2; i <= 50; i = i + 2)` — or loop over all numbers and add only when `i % 2 === 0`. For the factorial, loop i from 1 to 10 and do `factorial10 = factorial10 * i;`.',
        'Full shape: `for (let i = 2; i <= 50; i = i + 2) { sumEven = sumEven + i; }` then `for (let i = 1; i <= 10; i = i + 1) { factorial10 = factorial10 * i; }`. Sanity-check the factorial by tracing: 1, 2, 6, 24, 120 after five passes — if you see 0, your accumulator started at 0.',
      ],
      solution: `let sumEven = 0;
let factorial10 = 1;
for (let i = 2; i <= 50; i = i + 2) {
  sumEven = sumEven + i;
}
for (let i = 1; i <= 10; i = i + 1) {
  factorial10 = factorial10 * i;
}`,
      xp: 10,
    },
    {
      id: 'ch3-l4',
      title: 'Off-by-One: The Classic Bug',
      reading: `There is an old joke that gets retold in every engineering org on the planet: *"The two hardest problems in computer science are cache invalidation, naming things, and off-by-one errors."* The joke is the bug. An **off-by-one error** is a loop that runs one time too many or one time too few, and it is plausibly the most common bug in the history of software — it has crashed rockets' worth of code, corrupted the last element of a million arrays, and cost uncountable debugging hours. It deserves its own lesson because it is not a typo; it is a *reasoning* error, and it has a cure.

Where does it come from? Boundaries. Quick: how many integers are there from 3 to 7, inclusive? The reflex answer is 7 − 3 = 4. The real answer is 5 (count them: 3, 4, 5, 6, 7). Human intuition about ranges is reliably off by one, and loop headers are made of ranges. \`i < 10\` versus \`i <= 10\` is a one-character difference that changes how many times the body runs. Neither is "correct" in general — each is correct for a *different intent* — and the bug happens when the character on screen doesn't match the intent in your head.

The cure is a habit, not talent: **interrogate the boundaries**. For any loop you write, answer three questions out loud: What is the value of the counter on the *first* pass? On the *last* pass? And *how many* passes is that in total? For \`for (let i = 0; i < 10; i++)\`: first pass 0, last pass 9, ten passes. For \`for (let i = 1; i <= 10; i++)\`: first pass 1, last pass 10, also ten passes. Both run ten times — they just visit different numbers. Interviewers probe exactly this, and senior engineers reviewing your pull request will check exactly this, because they have all been burned.

The purest form of the trap even has a name: the **fencepost problem**. Build a fence 100 meters long with a post every 10 meters — how many posts? Not 10. Eleven, because posts stand at *both* ends: 10 sections, 11 posts. The pattern generalizes: *N sections of fence need N + 1 posts, and N posts have N − 1 gaps between them.* Now look at how that ambushes real code. Join the numbers 1 through 5 with dashes:

\`\`\`js
// naive attempt — glue "i-" each pass:
// 1-2-3-4-5-   ← trailing dash. 5 posts, but we built 5 gaps.
\`\`\`

Five numbers (posts) need only four dashes (gaps), but a loop that appends \`i + '-'\` every pass builds five dashes. Every engineer has produced that trailing-separator bug; every CSV formatter and URL builder ever written has had to solve it. The standard fixes are worth knowing by name. **Seed-then-append**: put the first item in the accumulator before the loop, then have the loop append \`'-' + i\` for the remaining items — separator *before* each subsequent item means no dangling tail. **Guard inside the loop**: append the separator only \`if (i > 1)\`. Either is fine; pick one and be able to explain it.

Your task is exactly that fencepost: build the string \`"1-2-3-4-5-6-7-8-9-10"\`. Ten posts, nine gaps. The tests will check the boundaries — because that is where the bugs live.`,
      task: 'Using a loop, build the exact string `1-2-3-4-5-6-7-8-9-10` (numbers 1 through 10 joined by single dashes, no leading or trailing dash) and store it in a variable named `fence`.',
      starter: `// Ten posts, nine gaps. Watch the boundaries.
let fence = '';
// your loop here
`,
      tests: [
        { name: 'fence is a string', code: `assert(typeof fence === 'string', 'fence should be a string built up by the loop')` },
        { name: 'no trailing or leading dash', code: `assert(fence[0] !== '-' && fence[fence.length - 1] !== '-', 'fence starts or ends with a dash — the fencepost trap! 10 numbers need only 9 dashes. Got: "' + fence + '"')` },
        { name: 'fence is exactly 1-2-3-4-5-6-7-8-9-10', code: `assert(fence === '1-2-3-4-5-6-7-8-9-10', 'expected "1-2-3-4-5-6-7-8-9-10" but got "' + fence + '". Check your first pass, last pass, and where the dash is added.')` },
      ],
      hints: [
        'Ten numbers, nine dashes — so one pass of the loop must NOT add a dash. Decide which pass is special: the first or the last.',
        'Cleanest fix: seed the accumulator with the first post before the loop (`let fence = "1";`), then loop i from 2 to 10 appending the separator BEFORE the number: `fence = fence + "-" + i;`. Every appended piece brings its own dash, so no dash is ever left dangling.',
        'Full shape: `let fence = "1"; for (let i = 2; i <= 10; i = i + 1) { fence = fence + "-" + i; }`. Trace it: "1", then "1-2", then "1-2-3" … each pass adds exactly one gap and one post, and the string never ends in a dash. (Equally valid: loop 1..10 and add the dash only when `i > 1`.)',
      ],
      solution: `let fence = '1';
for (let i = 2; i <= 10; i = i + 1) {
  fence = fence + '-' + i;
}`,
      xp: 10,
    },
    {
      id: 'ch3-l5',
      title: 'Nested Loops, break, and continue',
      reading: `Put a loop inside a loop and you get a machine for sweeping *two dimensions*: every row and every column, every pair of players in a tournament, every pixel of an image. The rule of nested loops is simple but must be internalized: **the inner loop runs to completion for every single pass of the outer loop.** Outer pass 1 → inner runs fully. Outer pass 2 → inner runs fully again, from its init. If the outer loop runs 4 times and the inner runs 6 times, the innermost body executes 4 × 6 = 24 times. Multiplication, not addition.

\`\`\`js
for (let row = 0; row < 4; row = row + 1) {
  for (let col = 0; col < 6; col = col + 1) {
    // this line runs 24 times
  }
}
\`\`\`

That multiplication is also your first taste of *performance thinking*. A nested loop over a thousand items each way runs its body a million times; over a million items each way, a trillion. Engineers call this quadratic growth, and Chapter 8 will give it its formal name (Big-O). For now, plant the flag: when code is mysteriously slow, the culprit is very often a loop hiding inside another loop — sometimes hiding inside a function call, where you can't see it. Also note the naming convention: the outer counter and inner counter must be *different variables* (\`i\` and \`j\`, or better, \`row\` and \`col\`). Reusing the same name for both is a classic beginner catastrophe that makes the loops fight over one counter.

Sometimes a loop should not run to completion. The language gives you two escape hatches, and they mean very different things. \`break\` **exits the loop entirely**, right now — execution continues after the closing brace. \`continue\` **abandons only the current pass** and jumps ahead to the next one (in a for loop, the step still runs). A useful pair of slogans: *break means "found it / done early"; continue means "skip this one."*

\`\`\`js
// break: find the smallest divisor of n greater than 1, then STOP.
let firstFactor = 0;
for (let d = 2; d <= n; d = d + 1) {
  if (n % d === 0) {
    firstFactor = d;
    break;            // no reason to keep scanning
  }
}
\`\`\`

Why does \`break\` matter beyond style? Correctness and cost. The loop above wants the *first* divisor; without \`break\` it would keep overwriting \`firstFactor\` and hand you the *last* one instead — a wrong answer, not just a slow one. And in search problems, breaking on the first hit can turn a million-pass loop into a three-pass loop. \`continue\`, meanwhile, is mostly a readability tool: \`if (item is irrelevant) continue;\` at the top of a body lets the interesting logic stand un-indented, instead of being buried inside an \`else\`. Real codebases use this "early skip" shape constantly — it reads like a bouncer at the door turning away non-guests. One caveat from the trenches: in *nested* loops, \`break\` only exits the **innermost** loop it sits in. Forgetting that is a rite of passage.

Two tasks. First, nested loops: build a 4-line string, each line six \`*\` characters, lines separated by \`\\n\` (the newline character — note the fencepost again: 4 lines, 3 newlines). Second, \`break\`: find the smallest divisor of 91 greater than 1, and stop the instant you find it. (91 looks prime. It is not — that is exactly why computers do this job.)`,
      task: 'Build `grid`: 4 lines of `******` (six stars) joined by newline characters (`\\n`), using nested loops. Then find `firstFactor`: the smallest divisor of 91 that is greater than 1, using a loop with `break`.',
      starter: `// Part 1: 4 rows x 6 stars, rows separated by '\\n'.
let grid = '';

// Part 2: smallest divisor of 91 above 1 — break when found.
let firstFactor = 0;
`,
      tests: [
        { name: 'grid has 4 rows of 6 stars', code: `assert(grid === '******\\n******\\n******\\n******', 'grid should be 4 lines of "******" joined by \\n. Got: ' + JSON.stringify(grid) + ' — check for a trailing newline (4 rows need only 3 newlines).')` },
        { name: 'grid built with correct dimensions', code: `assert(grid.split('\\n').length === 4 && grid.split('\\n')[0].length === 6, 'grid should split into exactly 4 lines of length 6')` },
        { name: 'firstFactor is 7', code: `assert(firstFactor === 7, 'the smallest divisor of 91 above 1 is 7 (91 = 7 x 13), but got ' + firstFactor + '. If you got 13 or 91, your loop kept going after the first hit — that is what break is for.')` },
      ],
      hints: [
        'For the grid: outer loop over rows, inner loop appending one star at a time. Remember the newline is a separator between rows — fencepost rules apply. For the factor: test divisors d = 2, 3, 4, … with the remainder operator %, and stop at the first one that divides evenly.',
        'Grid: `for (let row = 0; row < 4; row++) { if (row > 0) grid = grid + "\\n"; for (let col = 0; col < 6; col++) { grid = grid + "*"; } }`. Factor: loop d from 2 upward; when `91 % d === 0`, record d and `break`.',
        'Factor in full: `for (let d = 2; d <= 91; d = d + 1) { if (91 % d === 0) { firstFactor = d; break; } }`. It tests 2 (no), 3 (no), 4, 5, 6 (no), then 7 — 91 % 7 === 0 — records 7 and breaks. Without the break it would march on to 13 and 91, overwriting your answer each time.',
      ],
      solution: `let grid = '';
for (let row = 0; row < 4; row = row + 1) {
  if (row > 0) {
    grid = grid + '\\n';
  }
  for (let col = 0; col < 6; col = col + 1) {
    grid = grid + '*';
  }
}
let firstFactor = 0;
for (let d = 2; d <= 91; d = d + 1) {
  if (91 % d === 0) {
    firstFactor = d;
    break;
  }
}`,
      xp: 15,
    },
    {
      id: 'ch3-l6',
      title: 'Capstone: The Collatz Flight Recorder',
      reading: `Time to fly. Here is a genuine piece of unsolved mathematics that you — after five lessons of loops — can explore with real code. Take any positive integer. If it is even, halve it. If it is odd, triple it and add one. Repeat. The **Collatz conjecture** says that no matter where you start, this sequence always crashes down to 1 eventually. Start at 6: 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1. Start at 7 and it wanders for 16 steps. Mathematicians have verified it for every starting number up to nearly 10²⁰, yet *nobody has ever proven it always works*. Paul Erdős, one of the great mathematicians of the twentieth century, said of this problem: "Mathematics may not be ready for such problems."

Notice something structural before you write a line: you cannot use a \`for\` loop's counting header here, because **you do not know how many steps it will take** — that unknown is literally the open question. This is the while loop's home turf, the situation it was born for: *keep going while we have not reached 1*. Choosing the right loop for the shape of the problem — for when the count is known, while when only the stopping condition is known — is precisely the kind of judgment this chapter has been building.

Your program is a flight recorder. Starting from **27** — a famously wild trajectory — you will track two instruments while the sequence runs: \`collatzSteps\`, counting how many transformations it takes to reach 1, and \`maxAltitude\`, the highest value the sequence ever touches along the way. Starting at just 27, the sequence climbs above **nine thousand** before finally descending — that violent, unpredictable flight is why this problem has resisted proof for almost a century. You already own every tool this needs: a while loop with a stopping condition, an if/else choosing the even or odd rule (the \`%\` operator tells you which), a counter accumulator, and a *maximum* accumulator — a new flavor: \`if (n > maxAltitude) maxAltitude = n;\`, the "best seen so far" pattern, which you will use a thousand more times in your career.

One discipline note, because this is a capstone: this loop is not *guaranteed* to terminate — that is the whole conjecture! — yet your program will happily rely on it. Real engineers do this consciously: know what your loop's termination depends on, and know what happens if the assumption fails (here: the 2-second watchdog kills you). Production systems guard risky loops with exactly such watchdogs and iteration caps. When you write \`while (n !== 1)\`, you are making a bet; the skill is knowing that you are making it.

And a closing thought for the chapter — **when is a loop the wrong tool?** You have now seen the answer from three angles. When a closed-form formula exists (Gauss's \`n * (n + 1) / 2\`), the loop is honest but wasteful. When the language ships a built-in (you will meet \`.repeat()\`, \`.join()\`, \`map\`, and \`reduce\` in later chapters), the hand-rolled loop is re-inventing a tested wheel — real code review will ask you to use the built-in. And when the repetition count is unknowable, the for loop is the wrong *kind* of loop. The engineer's ladder is: formula if one exists, built-in if one fits, and only then the raw loop — which, as Collatz proves, is sometimes the only tool that can take you somewhere mathematics itself has not mapped. Fly the recorder. Watch it hit 9,232. Then remember that no one on Earth can yet prove it had to come down.`,
      task: 'Starting from n = 27, run the Collatz process (even: halve; odd: triple and add one) until n reaches 1. Record the number of steps taken in `collatzSteps` and the highest value ever reached (including the start) in `maxAltitude`.',
      starter: `// Flight recorder for the Collatz trajectory of 27.
let n = 27;
let collatzSteps = 0;
let maxAltitude = n;
// while n is not yet 1: transform, count the step, update the max.
`,
      tests: [
        { name: 'recorder variables are numbers', code: `assert(typeof collatzSteps === 'number' && typeof maxAltitude === 'number', 'collatzSteps and maxAltitude should both be numbers')` },
        { name: 'flight took exactly 111 steps', code: `assert(collatzSteps === 111, 'the trajectory of 27 takes exactly 111 steps to reach 1, but got ' + collatzSteps + '. Count one step per transformation — and make sure the loop stops when n === 1, not before or after.')` },
        { name: 'peak altitude is 9232', code: `assert(maxAltitude === 9232, 'the highest point of the flight is 9232, but got ' + maxAltitude + '. Update the max AFTER each transformation: if (n > maxAltitude) maxAltitude = n;')` },
        { name: 'sequence actually landed at 1', code: `assert(n === 1, 'after the loop, n should be 1 (the landing), but got ' + n)` },
      ],
      hints: [
        'The skeleton: while n is not 1, apply one transformation (even → n/2, odd → 3n+1), add one to the step counter, and check whether the new n beats the record altitude.',
        'Inside the loop: `if (n % 2 === 0) { n = n / 2; } else { n = 3 * n + 1; }` then `collatzSteps = collatzSteps + 1;` then `if (n > maxAltitude) { maxAltitude = n; }`. The condition is `while (n !== 1)`.',
        'Full shape: `while (n !== 1) { if (n % 2 === 0) { n = n / 2; } else { n = 3 * n + 1; } collatzSteps = collatzSteps + 1; if (n > maxAltitude) { maxAltitude = n; } }`. Trace the start: 27 is odd → 82 (step 1, new max), even → 41 (step 2), odd → 124 (step 3, new max)… the recorder does the remaining 108 steps for you.',
      ],
      solution: `let n = 27;
let collatzSteps = 0;
let maxAltitude = n;
while (n !== 1) {
  if (n % 2 === 0) {
    n = n / 2;
  } else {
    n = 3 * n + 1;
  }
  collatzSteps = collatzSteps + 1;
  if (n > maxAltitude) {
    maxAltitude = n;
  }
}`,
      xp: 20,
    },
  ],
};
