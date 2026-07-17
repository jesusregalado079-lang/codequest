// Chapter X6 — Reading & Reasoning About Code. See ../SCHEMA.md for the shape.

export default {
  id: 'x6',
  title: 'Reading & Reasoning About Code',
  tagline: 'You will read far more code than you write. This is the skill nobody teaches and everybody needs.',
  badge: { name: 'Code Whisperer', emoji: '🔍' },
  intro: `Here is a truth the tutorials leave out: across a career, you will *read* code perhaps ten times as much as you write it. You will read your own code from last month with no memory of writing it. You will read a teammate's pull request you have to approve. You will read a stack trace pointing into a library you have never opened, a legacy function nobody dares touch, a snippet in a bug report that supposedly reproduces the problem. Writing code is the glamorous part; reading and reasoning about code is where the actual hours go — and where the difference between a junior and a senior engineer is most visible. This final chapter is devoted to that undertaught skill.

Reasoning about code means being able to answer, without running it, questions like: *What does this produce? What must always be true here? Where is the bug, and how do I know? Can I change this safely?* Beginners answer these by running the code and squinting at the output — a slow, superstitious loop of "try something, see what happens." Engineers answer them by *modeling the code in their heads*: tracing values step by step, identifying the invariants a piece of code assumes and preserves, and following evidence to a root cause instead of guessing. These are learnable, mechanical skills, and this chapter drills each one.

We will move through five disciplines, each building on the last. First, **tracing** — predicting exactly what code outputs by executing it on paper, the foundational skill under all the others. Then **invariants** — the conditions a correct piece of code keeps true, and how naming them turns vague "it should work" into precise, checkable claims. Then **debugging by evidence** — the discipline of forming a hypothesis and testing it, rather than changing lines at random and praying. Then **refactoring** — transforming gnarly code into clear code while proving, through tests, that behavior did not change. And finally a capstone that demands all of it at once: a messy function with a real bug, which you must both *fix* and *clean up* until the tests pass.

A note on why this comes last, as the hardest chapter. Everything before now taught you to *produce* code. This chapter teaches you to *stand outside* code and judge it — to be the calm engineer in the incident channel at 2 a.m. who reads the failing function, forms a theory, and fixes the actual problem while everyone else is guessing. That is the person teams promote and interviewers hire. The prose here is the densest in the course because the skill is the deepest; read slowly, trace everything by hand, and resist the urge to just run it and see. The whole point is to know before you run.`,
  lessons: [
    {
      id: 'x6-l1',
      title: 'Tracing: Predicting the Output',
      reading: `The most fundamental reasoning skill is **tracing**: running code in your head, one step at a time, keeping track of every variable's value as you go, and predicting the exact result — before you let the machine tell you. It sounds tedious, and at first it is. But this is the skill that everything else in this chapter stands on. You cannot find a bug in code you cannot trace. You cannot refactor safely what you cannot predict. And every technical interview on earth will, at some point, put a snippet in front of you and ask "what does this print?" — with no console to run it in.

The technique is disciplined and boring, which is its strength. You maintain a mental (or literal, on scratch paper) table of every variable and its current value. You execute the code line by line, updating the table exactly as the engine would — not as you *wish* it would, not as the code was *intended* to, but as the language rules *actually* dictate. When you hit a function call, you step into it with the given arguments. When a variable changes, you update its row. The output is whatever the table says at the end. The moment your mental model and the real output disagree, you have found either a bug in the code or a gap in your understanding of the language — and both are gold.

This lesson works differently from the others: instead of writing a function, you will **read five snippets in this reading, trace each one by hand, and record your predicted answer** in a variable. The tests then check your predictions against reality. No running the snippets first and copying the answer — that defeats the entire exercise. Trace them cold, commit to an answer, and see how you did. The snippets are chosen to hit the exact spots where careful tracers and careless ones diverge.

**Snippet 1 — assignment through a shared reference.** Objects and arrays are held by reference, so two variables can point at the *same* array:

\`\`\`
const original = [1, 2, 3];
const alias = original;
alias.push(4);
// what is original.length ?
\`\`\`

\`alias\` is not a copy — it is a second label on the very same array. Pushing through \`alias\` grows the one array both names refer to. Assign your prediction of \`original.length\` to \`p1\`.

**Snippet 2 — the classic closure-in-a-loop.** This is the single most famous trace question in JavaScript:

\`\`\`
const fns = [];
for (let i = 0; i < 3; i++) {
  fns.push(() => i);
}
// what is fns[0]() + fns[1]() + fns[2]() ?
\`\`\`

Because the loop uses \`let\`, each iteration gets its *own* binding of \`i\` — so the three arrow functions close over three different values: 0, 1, and 2. (Had this been \`var\`, all three would share one \`i\` that ended at 3, and the sum would be 9. Knowing that difference cold is a rite of passage.) Assign the sum to \`p2\`.

**Snippet 3 — reduce with no initial value.** When \`reduce\` is called without a second argument, it uses the *first element* as the starting accumulator and begins folding from the second:

\`\`\`
// [5, 10, 15].reduce((a, b) => a + b)
\`\`\`

Trace it: a=5, b=10 → 15; then a=15, b=15 → 30. Assign the result to \`p3\`.

**Snippet 4 — short-circuit evaluation.** The \`||\` operator returns the *first truthy operand*, not a boolean. Empty string and 0 are falsy; a non-empty string is truthy:

\`\`\`
// 0 || '' || 'hello' || 'world'
\`\`\`

It walks left to right, skipping 0 and '' as falsy, and returns \`'hello'\` — stopping there without ever evaluating \`'world'\`. Assign the resulting string to \`p4\`.

**Snippet 5 — a small mutation trace.** Reassigning a plain variable inside a function that closes over it changes the outer variable:

\`\`\`
let total = 10;
function bump() { total = total + 5; }
bump();
bump();
// what is total ?
\`\`\`

Each \`bump()\` adds 5 to the shared \`total\`. Two calls, starting from 10. Assign the final value of \`total\` to \`p5\`.

Trace all five carefully, assign your five predictions, and let the tests grade your model of how JavaScript actually runs. When one is wrong, do not just patch the number — go back and find *which rule* you traced incorrectly. That correction is the whole lesson.`,
      task: `Do NOT run the snippets first. Trace each of the five snippets in the reading by hand, then assign your predicted answer to the matching variable: \`p1\` (original.length), \`p2\` (the sum of the three closures), \`p3\` (the reduce result), \`p4\` (the short-circuit string), and \`p5\` (the final total). Each should be a plain value — a number or a string.`,
      starter: `// Trace by hand, then fill in your predictions. Change each null to your answer.
const p1 = null; // snippet 1: original.length after alias.push(4)
const p2 = null; // snippet 2: fns[0]() + fns[1]() + fns[2]()  (loop uses let)
const p3 = null; // snippet 3: [5, 10, 15].reduce((a, b) => a + b)
const p4 = null; // snippet 4: 0 || '' || 'hello' || 'world'
const p5 = null; // snippet 5: total after two bump() calls, starting at 10
`,
      tests: [
        { name: 'p1 — shared reference length', code: `assert(p1 === 4, 'p1 should be 4: alias and original are the SAME array, so push(4) makes both length 4')` },
        { name: 'p2 — closures over let', code: `assert(p2 === 3, 'p2 should be 3: with let, the closures capture 0, 1, 2 separately, summing to 3 (with var it would have been 9)')` },
        { name: 'p3 — reduce with no initial value', code: `assert(p3 === 30, 'p3 should be 30: 5+10=15, then 15+15=30')` },
        { name: 'p4 — short-circuit returns first truthy', code: `assert(p4 === 'hello', "p4 should be 'hello': || returns the first truthy operand, skipping 0 and the empty string")` },
        { name: 'p5 — repeated mutation of a shared variable', code: `assert(p5 === 20, 'p5 should be 20: total starts at 10 and each bump() adds 5, twice')` },
      ],
      hints: [
        'Keep a table of every variable and update it line by line as the engine would, not as the code seems to intend. Pay special attention to references (snippet 1), to let vs var in loops (snippet 2), and to what || actually returns (snippet 4).',
        'Reference sharing means one array with two names. `let` in a loop gives each iteration its own binding. `reduce` with no seed starts from the first element. `||` yields the first truthy value, not true/false. A closure that reassigns an outer variable changes it for everyone.',
        'The answers, once traced: p1 = 4 (same array, pushed once), p2 = 0 + 1 + 2 = 3, p3 = 30, p4 = the string hello, p5 = 10 + 5 + 5 = 20. If any surprised you, re-trace that snippet until you see exactly which rule produced it.',
      ],
      solution: `const p1 = 4;  // alias === original, so push(4) grows the one shared array to length 4
const p2 = 3;  // let gives each iteration its own i; closures return 0, 1, 2 → sum 3
const p3 = 30; // no seed: 5+10=15, 15+15=30
const p4 = 'hello'; // || returns the first truthy operand
const p5 = 20; // 10, then +5, then +5`,
      xp: 10,
    },
    {
      id: 'x6-l2',
      title: 'Reasoning About Invariants',
      reading: `An **invariant** is a condition that is *always true* at a particular point in a program, no matter what path the execution took to get there. "The array is sorted." "The balance is never negative." "Every user in this list has a unique id." "This index is within bounds." Invariants are the load-bearing beams of correct code — usually unspoken, always assumed. Learning to *see* them, *name* them, and *check* them is one of the largest jumps you can make as a reasoner, because most bugs are, at bottom, a broken invariant that some later code was quietly counting on.

Why does naming an invariant matter so much? Because "it should work" is not a claim you can check, but "the result is always sorted ascending" is. Vague confidence becomes a precise, testable proposition. Once you can state an invariant, you can do three powerful things with it. You can *test* it directly — write an assertion that fails the instant it breaks. You can *reason* from it — if the input array is sorted and my function only inserts in the right place, the output is sorted too, without me re-checking every element. And you can *localize bugs* with it — sprinkle invariant checks through a pipeline and the first one that fails points a finger at the exact stage that violated an assumption.

There are two flavors worth distinguishing. A **precondition** is an invariant a function *assumes about its inputs* — "the caller promises this array is already sorted." A **postcondition** is an invariant the function *guarantees about its output* — "I promise the array I return is sorted." Good functions are honest about both: they document what they require and what they deliver. When a precondition and a postcondition line up — this function's output-is-sorted guarantee is the next function's input-is-sorted assumption — you can chain functions and trust the whole chain, reasoning locally at each link. That is the entire secret to understanding large programs without holding all of them in your head at once.

Consider the invariant this lesson is built around: **inserting an element into a sorted array should leave it sorted.** The precondition is "the input array is sorted ascending." The postcondition is "the returned array is sorted ascending, contains every original element, plus the new one." If you hold that postcondition firmly in mind, the implementation almost writes itself: walk the array, and place the new value at the first position where it is less than or equal to the current element; if you reach the end without placing it, it belongs last. At every step you are preserving the invariant — you never put the new value somewhere that would break the ordering.

Here is the mental shift, and it is a big one. Beginners write code and then wonder whether it is correct. Engineers decide *what must be true* first, and write code that keeps it true. The invariant comes before the implementation and judges it. This is also how you read unfamiliar code productively: rather than tracing every line, ask "what is this function trying to keep true?" and check whether it succeeds. A sort function keeps order. A cache keeps "the stored value matches the latest input." A balanced-tree insert keeps the height bound. Find the invariant and the code's purpose snaps into focus.

Your task is to write \`insertSorted(sorted, n)\` that takes a sorted-ascending array and a number, and returns a *new* sorted array with \`n\` inserted in the correct place — without mutating the input (an immutability invariant on top of the ordering one). The tests do not merely check a couple of hand-picked cases; they assert the *invariant itself* across several inputs — that the result is sorted, that it grew by exactly one, that the original was left alone. Writing code whose tests check invariants rather than specific outputs is how professionals pin down "correct." Preserve the invariant at every step and the specific cases take care of themselves.`,
      task: `Write \`insertSorted(sorted, n)\` that takes an array already sorted in ascending order and a number \`n\`, and returns a NEW array with \`n\` inserted so the result stays sorted ascending. Do not mutate the input array. Assume the input is sorted (that is your precondition).`,
      starter: `// Precondition: 'sorted' is sorted ascending.
// Postcondition: return a NEW sorted array containing all of 'sorted' plus n.
// Do not mutate 'sorted'.
function insertSorted(sorted, n) {
  return sorted; // TODO
}
`,
      tests: [
        { name: 'inserts into the middle, staying sorted', code: `const inp = [1, 3, 5, 7]; const out = insertSorted(inp, 4); assert(out.join(',') === '1,3,4,5,7', 'insertSorted([1,3,5,7], 4) should be [1,3,4,5,7]')` },
        { name: 'inserts at the front and the back', code: `assert(insertSorted([2, 4, 6], 1).join(',') === '1,2,4,6' && insertSorted([2, 4, 6], 9).join(',') === '2,4,6,9', 'should place n before everything when smallest, and after everything when largest')` },
        { name: 'does not mutate the input array', code: `const inp = [10, 20, 30]; insertSorted(inp, 25); assert(inp.join(',') === '10,20,30', 'insertSorted must not mutate its input — return a new array')` },
        { name: 'the sorted invariant holds for many inputs', code: `const base = [1, 4, 9, 16, 25]; for (let k = -3; k <= 30; k++) { const r = insertSorted(base, k); assert(r.length === base.length + 1, 'result should grow by exactly one, for n=' + k); for (let j = 1; j < r.length; j++) { assert(r[j - 1] <= r[j], 'result must stay sorted after inserting n=' + k + ', but ' + r[j - 1] + ' > ' + r[j]); } }` },
      ],
      hints: [
        'The invariant to preserve: the output is sorted ascending. n belongs just before the first element that is greater than or equal to it. Build a new array so you never mutate the input.',
        'Walk the sorted array. Track whether you have placed n yet. Before pushing an element x, if n has not been placed and n <= x, push n first. If you finish the loop without placing n, it is the largest — push it at the end.',
        'One clean approach: `const result = []; let placed = false; for (const x of sorted) { if (!placed && n <= x) { result.push(n); placed = true; } result.push(x); } if (!placed) result.push(n); return result;`. Each push preserves the ordering, so the postcondition holds by construction.',
      ],
      solution: `function insertSorted(sorted, n) {
  const result = [];
  let placed = false;
  for (const x of sorted) {
    if (!placed && n <= x) {
      result.push(n);
      placed = true;
    }
    result.push(x);
  }
  if (!placed) {
    result.push(n);
  }
  return result;
}`,
      xp: 15,
    },
    {
      id: 'x6-l3',
      title: 'Debugging by Evidence, Not Guessing',
      reading: `When code misbehaves, there are two ways to respond, and they define two kinds of programmer. The first changes a line, reruns, sees it still broken, changes another line, reruns, flips a \`<\` to a \`<=\`, adds a random \`+1\`, comments something out — a frantic dance of superstition, hoping to stumble onto a fix without ever understanding the problem. The second treats the bug as a *mystery to be solved with evidence*: reproduce it reliably, gather facts, form a hypothesis, and test that hypothesis. This lesson is about becoming the second kind, permanently. It is possibly the highest-leverage habit in this entire course.

The method has a shape, borrowed straight from the scientific method. **Reproduce**: find the smallest, most reliable input that triggers the bug — an intermittent bug you cannot reproduce is nearly impossible to fix, so making it reproducible is job one. **Observe**: gather evidence about what actually happens — the real inputs, the real output, the values at intermediate steps. **Hypothesize**: form a specific, falsifiable theory — "I think the boundary case at exactly 90 is being classified wrong." **Test the hypothesis**: check that one theory, ideally with the smallest possible probe. **Fix and verify**: change the code, then confirm the bug is gone *and* nothing else broke. Notice that "change the code" is the second-to-last step, not the first. Guessers start there; engineers earn their way there.

The single most important discipline in that loop is to **let evidence, not intuition, tell you where the bug is**. Your intuition about where a bug lives is frequently wrong — the symptom often appears far from the cause. So you *narrow down* with evidence. Binary-search the code: check a value halfway through the pipeline. Is it already wrong there? Then the bug is upstream. Is it still right there? Then the bug is downstream. A couple of these checks can collapse a hundred lines of suspects to two or three. This is dramatically faster than reading everything, and infinitely faster than random flailing. "Don't guess where the bug is — measure" is advice worth tattooing on your keyboard.

There is a particular class of bug this lesson targets because it is so common and so instructive: the **boundary bug**. Off-by-one errors, wrong comparison operators, \`<\` where you meant \`<=\`, \`>\` where you meant \`>=\` — these cluster at the edges of ranges, exactly where careless testing never looks. A grading function that works fine for a score of 85 and a score of 95 can still be silently wrong for a score of *exactly* 90, because 90 sits on a threshold. The evidence-driven tester *specifically probes the boundaries*: the value right on the line, one below, one above. That is where bugs hide, so that is where you shine the light first.

You are going to fix exactly such a bug. The provided \`grade(score)\` function is supposed to map a score to a letter — 90 and up is an A, 80–89 is a B, 70–79 a C, 60–69 a D, and anything below 60 an F. But there is a bug report: *"A student who scored exactly 90 was given a B instead of an A."* Read that as evidence, not as an annoyance. It points you straight at a boundary: what happens at exactly 90? Look at the comparison the code uses for the A threshold. The function uses \`>\` where a correct classifier at an inclusive boundary needs \`>=\` — so 90 fails the "greater than 90" test and falls through to B. The same flaw sits at every threshold, so a score of exactly 80, 70, or 60 is misclassified too.

The lazy, symptom-only fix would be to special-case 90. Resist it. The *root cause* is the wrong operator, and it recurs at every boundary — so the correct fix is systematic: use \`>=\` at each threshold, and every boundary heals at once. This is the difference between patching a symptom and fixing a cause, and it is the habit that keeps you from playing whack-a-mole with the same bug in five disguises. Fix \`grade\` so that scores exactly on a threshold receive the higher grade, and let the tests — which deliberately probe 90, 80, 70, 60, and the values just below them — confirm your reasoning.`,
      task: `The provided \`grade(score)\` has a boundary bug: scores exactly on a threshold get the grade one level too low. Fix it so 90+ is 'A', 80–89 is 'B', 70–79 is 'C', 60–69 is 'D', and below 60 is 'F' — with the boundary values (90, 80, 70, 60) getting the higher grade. Fix the root cause, not just the 90 case.`,
      starter: `// Bug report: grade(90) returns 'B', but it should return 'A'.
// The comparisons use > where they should be >= — fix every threshold.
function grade(score) {
  if (score > 90) return 'A';
  if (score > 80) return 'B';
  if (score > 70) return 'C';
  if (score > 60) return 'D';
  return 'F';
}
`,
      tests: [
        { name: 'boundary scores get the higher grade', code: `assert(grade(90) === 'A' && grade(80) === 'B' && grade(70) === 'C' && grade(60) === 'D', 'exact thresholds 90/80/70/60 should give A/B/C/D')` },
        { name: 'scores just below a boundary drop a grade', code: `assert(grade(89) === 'B' && grade(79) === 'C' && grade(69) === 'D' && grade(59) === 'F', 'one below each threshold should be the lower grade: 89→B, 79→C, 69→D, 59→F')` },
        { name: 'clear interior and extreme cases still work', code: `assert(grade(100) === 'A' && grade(85) === 'B' && grade(0) === 'F', 'grade(100) should be A, grade(85) B, grade(0) F')` },
      ],
      hints: [
        'The bug report points at a boundary: exactly 90 should be an A but is not. Look at the operator guarding the A case — is 90 actually "greater than 90"?',
        'Each threshold uses > (strictly greater), so the boundary value itself fails and falls through to the next grade. The inclusive boundary needs >= at every level.',
        'Change every `>` to `>=`: `if (score >= 90) return "A"; if (score >= 80) return "B";` and so on. Fixing all four thresholds (not just the 90 one) is the root-cause fix — the same operator bug sat at each boundary.',
      ],
      solution: `function grade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}`,
      xp: 15,
    },
    {
      id: 'x6-l4',
      title: 'Refactoring Without Changing Behavior',
      reading: `**Refactoring** is changing the *shape* of code without changing its *behavior* — restructuring for clarity, not for new features. The word is often used loosely to mean "rewriting stuff," but its real, disciplined meaning is precise and it is the precision that makes it valuable: the observable behavior before and after must be *identical*, byte for byte, case for case. You are improving the code's readability, its structure, its maintainability — while a wall of tests stands guard to prove you changed nothing about what it actually does. Refactoring without that guard is not refactoring; it is gambling.

Why is behavior-preservation the whole game? Because working code has enormous value that is easy to destroy. A function that has run correctly in production for two years encodes knowledge — every weird edge case it handles, every boundary someone fixed after a 2 a.m. incident. When you "clean it up," you risk silently dropping one of those hard-won cases. The only way to refactor boldly is to first pin the behavior down with tests: capture what the function does *now*, across all its cases, and then keep those tests green through every change. Green tests are your license to rip the internals apart with confidence. This is why the phrase you will hear on good teams is "let me add tests first, *then* refactor."

Consider what makes code "gnarly" and worth refactoring in the first place. Deeply nested \`if\` statements, where you have to track four levels of indentation to know which branch you are in. Redundant conditions that re-check things already known. A mutable result variable, reassigned in a dozen places, that you must trace through the whole function to know its final value. Cleverness that made sense to the author at midnight and to no one since. None of these change *what* the code does — they change how much of your brain it costs to *understand* what it does. Refactoring pays that cost down.

The most common and highest-value refactoring for exactly this kind of code is replacing a nested \`if/else\` pyramid with **guard clauses** — early returns that handle one case and get out of the way. Instead of nesting each subsequent check inside the \`else\` of the previous one, you return as soon as you know the answer. The result reads top to bottom as a flat list of "if this, then that; otherwise, if this, then that" — no indentation staircase, no mental stack to maintain. Each line handles one case and exits, so by the time you reach the bottom you have already dispatched every earlier case. Guard clauses are the single most effective tool for flattening tangled conditional logic.

Here is the function you will refactor, correct but genuinely gnarly:

\`\`\`
function priceTier(n) {
  var r;
  if (n < 0) {
    r = 'invalid';
  } else {
    if (n === 0) {
      r = 'free';
    } else {
      if (n < 20) {
        r = 'cheap';
      } else {
        if (n < 100) {
          r = 'normal';
        } else {
          r = 'premium';
        }
      }
    }
  }
  return r;
}
\`\`\`

It works — do not doubt that, the tests will confirm it does — but reading it is a chore. Four levels of nesting, a mutable \`r\` you must track to the end, and the actual logic buried under bookkeeping. Your job is to rewrite it as a flat sequence of guard clauses with *identical behavior*: negative is \`'invalid'\`, exactly zero is \`'free'\`, under 20 (but positive) is \`'cheap'\`, under 100 is \`'normal'\`, and 100-or-more is \`'premium'\`. Watch the boundaries carefully, because behavior preservation means the edges — 0, 20, 100 — must land exactly where the original put them.

The tests here are your safety net, and they play the role the pinning tests would play on the job: they encode the original behavior across negatives, zero, both sides of every boundary, and large values. Get all of them green with your clean rewrite and you have *proven* the refactoring is behavior-preserving. That proof — not your confidence, not your intuition — is what makes refactoring safe. Rewrite \`priceTier\` with guard clauses, keep every case identical, and feel how much lighter clear code is to read than clever code.`,
      task: `Rewrite \`priceTier(n)\` (shown in the reading) using guard clauses / early returns instead of nested if/else, keeping its behavior EXACTLY the same: negative → 'invalid', 0 → 'free', 0 < n < 20 → 'cheap', 20 <= n < 100 → 'normal', n >= 100 → 'premium'. The starter is an empty stub; the tests pin the behavior you must reproduce.`,
      starter: `// Rewrite this with guard clauses (early returns), same behavior as the
// nested version in the reading. Watch the boundaries: 0, 20, 100.
function priceTier(n) {
  // TODO: return 'invalid' | 'free' | 'cheap' | 'normal' | 'premium'
}
`,
      tests: [
        { name: 'invalid and free at the low end', code: `assert(priceTier(-5) === 'invalid' && priceTier(-1) === 'invalid' && priceTier(0) === 'free', 'negatives are invalid; exactly 0 is free')` },
        { name: 'cheap range and its upper boundary', code: `assert(priceTier(1) === 'cheap' && priceTier(19) === 'cheap' && priceTier(20) === 'normal', '0<n<20 is cheap; 20 itself is normal (boundary preserved)')` },
        { name: 'normal range and its upper boundary', code: `assert(priceTier(50) === 'normal' && priceTier(99) === 'normal' && priceTier(100) === 'premium', '20<=n<100 is normal; 100 itself is premium (boundary preserved)')` },
        { name: 'premium for large values', code: `assert(priceTier(100) === 'premium' && priceTier(1000) === 'premium', '100 and above is premium')` },
      ],
      hints: [
        'A guard clause returns as soon as it knows the answer, so later code can assume the earlier cases are already handled. Take the cases in order from smallest to largest and return immediately in each.',
        'Order matters: check negative first, then 0, then n < 20, then n < 100, and if none matched it must be premium. Because each returns, by the time you check n < 20 you already know n is positive.',
        'Full rewrite: `if (n < 0) return "invalid"; if (n === 0) return "free"; if (n < 20) return "cheap"; if (n < 100) return "normal"; return "premium";`. Each early return flattens one level of the original nesting, and the boundaries (0, 20, 100) land exactly where the nested version put them.',
      ],
      solution: `function priceTier(n) {
  if (n < 0) return 'invalid';
  if (n === 0) return 'free';
  if (n < 20) return 'cheap';
  if (n < 100) return 'normal';
  return 'premium';
}`,
      xp: 15,
    },
    {
      id: 'x6-l5',
      title: 'Capstone: Fix the Bug and Clean It Up',
      reading: `This is the final challenge of CodeQuest Pro, and it asks for everything at once. You are handed a messy, buggy data-processing function — the kind that shows up in real pull requests and real incident reports — and you must do the two things a professional does when they inherit such code: **find and fix the bug**, and **leave the function clearer than you found it**. Not one or the other. Both. This is the Boy Scout Rule of engineering — "leave the campground cleaner than you found it" — and it is how codebases stay healthy across years and dozens of hands instead of rotting into fear.

Here is the function, exactly as it landed in the repository:

\`\`\`
function summarize(orders) {
  let total = 0;
  let count = 0;
  for (let i = 0; i < orders.length; i++) {
    total = total + orders[i].amount;
    if (orders[i].status === 'paid') {
      count = count + 1;
    }
  }
  return { count: count, total: total, average: total / count };
}
\`\`\`

Its intended job: given an array of orders, each shaped \`{ id, amount, status }\`, produce a summary of the **paid** orders only — how many there are (\`count\`), their combined \`total\`, and their \`average\`. Revenue reports live and die on getting this right, so read carefully. Apply the discipline from the debugging lesson: do not skim and assume, gather evidence. Trace the function on a small mixed input — say two paid orders and one cancelled one — and watch what \`total\` accumulates.

The evidence indicts one line. The \`if (orders[i].status === 'paid')\` guard correctly gates \`count\`, so only paid orders are counted. But \`total = total + orders[i].amount\` sits *outside* that guard — it runs for *every* order, paid or not. So \`total\` sums the revenue of cancelled and refunded orders right alongside the paid ones, while \`count\` counts only the paid. The \`average\` is then computed from a total that includes money you never collected divided by a count that excludes those same orders — wrong in both the numerator's contents and the numerator-over-denominator meaning. This is the bug: the total is not filtered to paid orders. Every downstream number is poisoned by it.

There is a second, quieter defect hiding in \`average: total / count\` — a lurking **division by zero**. If \`orders\` contains no paid orders (or is empty), \`count\` is 0, and \`total / count\` is \`NaN\`, which will silently corrupt any report that consumes it. A careful engineer notices edge cases the happy path ignores. Part of "cleaning it up" is deciding what \`average\` should be when there is nothing to average — a sensible choice is 0 — and guarding that case explicitly rather than emitting \`NaN\`.

Now the cleanup, and here the whole course converges. The imperative loop with two manually-maintained accumulators is exactly the kind of bookkeeping that hid the bug in the first place — the mutation of \`total\` and \`count\` across iterations is what let the filter and the sum drift out of sync. The functional style you learned makes the bug *structurally impossible*: \`filter\` the orders to paid ones **first**, so there is one source of truth for "which orders count," and then derive everything from that single filtered list. The paid list's \`length\` is the count; a \`reduce\` over it is the total; the average is total over count with a zero-guard. When the filter is the first thing that happens, the sum and the count *cannot* disagree — they are computed from the same array. Clean code is not just prettier here; its structure eliminates an entire class of bug.

So: rewrite \`summarize\` to filter the paid orders once, compute \`count\`, \`total\`, and \`average\` from that filtered list, and guard the empty case so \`average\` is 0 rather than \`NaN\`. The tests pin the corrected behavior across a mixed batch of orders and the empty case — the buggy starter fails them because its total is inflated and its empty-average is \`NaN\`. Get them green and you will have done, in miniature, the thing senior engineers are paid for: inheriting messy code, understanding it deeply enough to find the real defect, fixing the cause rather than the symptom, and leaving behind something the next person can read at a glance. That is the whole course, in one function. Finish it.`,
      task: `Rewrite \`summarize(orders)\` so it correctly summarizes only the orders with \`status === 'paid'\`. Return \`{ count, total, average }\` where all three are computed from the paid orders only, and \`average\` is 0 (not NaN) when there are no paid orders. Fix the bug (the total currently includes non-paid orders) AND clean up the implementation — filtering to paid first is the clean, bug-proof approach.`,
      starter: `// BUG: total adds every order's amount, not just the paid ones.
// Also: average is NaN when there are no paid orders (division by zero).
// Fix the bug AND clean it up (filter to paid first, then derive everything).
function summarize(orders) {
  let total = 0;
  let count = 0;
  for (let i = 0; i < orders.length; i++) {
    total = total + orders[i].amount;
    if (orders[i].status === 'paid') {
      count = count + 1;
    }
  }
  return { count: count, total: total, average: total / count };
}
`,
      tests: [
        { name: 'total and count cover only paid orders', code: `const data = [ { id: 1, amount: 100, status: 'paid' }, { id: 2, amount: 50, status: 'cancelled' }, { id: 3, amount: 30, status: 'paid' }, { id: 4, amount: 70, status: 'refunded' } ]; const s = summarize(data); assert(s.count === 2 && s.total === 130, 'only the two paid orders count: count 2, total 130 (100 + 30) — not 250')` },
        { name: 'average is over paid orders only', code: `const data = [ { id: 1, amount: 100, status: 'paid' }, { id: 2, amount: 50, status: 'cancelled' }, { id: 3, amount: 30, status: 'paid' } ]; const s = summarize(data); assert(Math.abs(s.average - 65) < 1e-9, 'average should be 130 / 2 = 65, computed from paid orders only')` },
        { name: 'empty input gives zeros, not NaN', code: `const s = summarize([]); assert(s.count === 0 && s.total === 0 && s.average === 0, 'with no orders, count/total/average should all be 0 — average must not be NaN')` },
        { name: 'no paid orders gives zeros, not NaN', code: `const s = summarize([ { id: 1, amount: 100, status: 'cancelled' }, { id: 2, amount: 40, status: 'refunded' } ]); assert(s.count === 0 && s.total === 0 && s.average === 0, 'when nothing is paid, all three should be 0 and average must not be NaN')` },
        { name: 'does not mutate the input orders', code: `const data = [ { id: 1, amount: 100, status: 'paid' }, { id: 2, amount: 50, status: 'cancelled' } ]; summarize(data); assert(data.length === 2 && data[0].amount === 100 && data[1].status === 'cancelled', 'summarize should not mutate the orders it is given')` },
      ],
      hints: [
        'The bug is that total is summed for every order, while count is only bumped for paid ones — they disagree. Fix it by making the filter the single source of truth: keep only the paid orders first, then compute count, total, and average from that one list.',
        "Filter first: `const paid = orders.filter(o => o.status === 'paid');`. Then `count` is `paid.length`, `total` is `paid.reduce((s, o) => s + o.amount, 0)`, and average is total / count — but guard against count being 0.",
        "Full clean version: filter to paid, then `const count = paid.length; const total = paid.reduce((s, o) => s + o.amount, 0); const average = count === 0 ? 0 : total / count; return { count, total, average };`. Filtering first makes count and total impossible to disagree, and the `count === 0 ? 0 : ...` guard replaces the NaN from dividing by zero.",
      ],
      solution: `function summarize(orders) {
  const paid = orders.filter(o => o.status === 'paid');
  const count = paid.length;
  const total = paid.reduce((sum, o) => sum + o.amount, 0);
  const average = count === 0 ? 0 : total / count;
  return { count, total, average };
}`,
      xp: 20,
    },
  ],
};
