// Chapter 8 — The Engineer's Toolkit. See ../SCHEMA.md for the shape.

export default {
  id: 'ch8',
  title: "The Engineer's Toolkit",
  tagline: 'The knowledge that separates people who write code from people who engineer it.',
  badge: { name: 'Toolkit Bearer', emoji: '🧰' },
  intro: `Seven chapters ago you learned to store a number in a variable. You now write functions, wrangle collections, parse text, and compose pipelines. This final chapter is different in kind from everything before it: instead of adding one more language feature, it hands you the working knowledge that professional engineers carry into *every* language they will ever use.

Here is a secret about the software industry: the JavaScript you have learned is maybe a third of the job. The other two thirds are things no syntax highlighter can show you. Knowing what a number actually *is* underneath the syntax — and why the machine insists that 0.1 + 0.2 is not quite 0.3. Sensing, before you run anything, whether your solution will take a millisecond or an hour on real data. Hunting a bug the way a detective works a case, with evidence and hypotheses instead of hope. Reading code you did not write — which, in any real job, is most of the code you will ever touch. And writing code whose *names* do the explaining, because the next reader will not have you sitting beside them.

These five skills share a common thread: they are all about seeing through the code to what is really happening — in the processor, in the algorithm, in the running program, in the mind of the next reader. Syntax is the costume; this chapter is the anatomy underneath. It is also, not coincidentally, the material that dominates engineering interviews. Nobody gets hired for knowing where the semicolons go. People get hired for explaining why floating-point math drifts, for choosing the linear solution over the quadratic one and saying why, and for debugging a stranger's function on a whiteboard without panicking.

The exercises in this chapter are deliberately smaller than the readings. That is by design: the ideas here are the payload, and the code exists to make them concrete. Read slowly. This is the chapter you will find yourself quoting to other people a year from now.`,
  lessons: [
    {
      id: 'ch8-l1',
      title: 'What a Number Really Is',
      reading: `Type \`0.1 + 0.2 === 0.3\` into any JavaScript console and the language will look you in the eye and say \`false\`. This is not a bug, not a JavaScript quirk, and not something a future version will fix. It is a window straight down to the metal, and understanding it will permanently change how you think about numbers in every programming language — because Python, Java, C++, and Rust all give the same answer, for the same reason.

Start at the bottom. A computer's memory is billions of microscopic switches, each either off or on: 0 or 1. One switch is a **bit**; everything a computer stores — numbers, text, images, this very lesson — is ultimately a pattern of bits. To store whole numbers, computers use **binary**, base two. Where decimal digits count ones, tens, and hundreds (powers of ten), binary digits count ones, twos, fours, and eights (powers of two). The pattern \`1101\` means one 8, one 4, no 2, one 1 — thirteen. Any whole number can be written this way exactly, given enough bits, and binary arithmetic is why hardware is fast: an electrical circuit that adds two bits is a handful of transistors.

Fractions are where the trouble starts. In decimal, some fractions are tidy (1/4 = 0.25) and some repeat forever (1/3 = 0.333…). Which ones repeat depends on the *base*: a fraction terminates in decimal only if its denominator is built from 10's prime factors, 2 and 5. Binary is stricter — its only prime factor is 2. So 1/2, 1/4, 3/8 are exact in binary… and one tenth is not. In binary, 0.1 is \`0.0001100110011…\` with \`0011\` repeating forever, exactly the way 1/3 repeats in decimal. The number that looks cleanest to human eyes is one the machine *cannot finish writing down*.

But memory is finite, so the machine has to stop somewhere. JavaScript numbers use the **IEEE 754 double-precision** format: 64 bits per number — 1 bit for the sign, 11 for the exponent, 52 for the significant digits. It is scientific notation in binary, and it is a genuinely brilliant standard (it earned its designer, William Kahan, the Turing Award). But 52 bits means the infinite tail of 0.1 gets cut off and rounded. What is actually stored is the nearest representable value — approximately 0.1000000000000000055511151231257827. The same happens to 0.2. Add the two roundings and you get 0.30000000000000004: visibly, measurably, *correctly* not equal to the stored approximation of 0.3. The machine did flawless arithmetic on slightly wrong inputs, because the inputs could not be stored any better.

The engineering consequences are concrete. First: **never compare computed floating-point values with ===**. The professional idiom is to check whether two values are within a tolerance — called an **epsilon** — of each other: \`Math.abs(a - b) < 1e-9\`. You have already seen this chapter's tests doing exactly that; now you know why. Second: **never store money as floating-point dollars.** Banks and payment systems store integer cents (or thousandths), because integers up to \`Number.MAX_SAFE_INTEGER\` (2⁵³ − 1, about 9 quadrillion) are exact in this format. \`19.99 + 4.01\` may drift; \`1999 + 401\` never will. Real financial-code bugs from float dollars have made the news more than once.

Third, the interview angle, because this is a genuine classic: "Why does 0.1 + 0.2 !== 0.3 in JavaScript?" The complete answer, which you can now give: numbers are IEEE 754 binary doubles; 0.1 and 0.2 have no finite binary representation, so they are stored rounded; the sum of the roundings differs from the rounding of 0.3; compare with an epsilon, or work in integers. Four sentences, and the interviewer knows you understand your tools down to the bits. That — not trivia — is what the question screens for.

One reassurance before you code: this is not a reason to fear floating point. Doubles carry roughly 15–17 significant decimal digits — precision that physics and graphics happily live inside. The rule is simply to respect the tool's nature: floats are superb *approximate* numbers and poor *exact* ones. Know which kind of number your problem needs, and you will never be bitten.`,
      task: `Create \`const surprise = 0.1 + 0.2\` and \`const naiveEqual = surprise === 0.3\` to capture the famous result. Then write the professional fix: a function \`approxEqual(a, b)\` that returns true when a and b differ by less than 1e-9.`,
      starter: `// const surprise = 0.1 + 0.2;
// const naiveEqual = ...   compare surprise === 0.3 (spoiler: false)

// function approxEqual(a, b) — true when |a - b| < 1e-9 (use Math.abs)
`,
      tests: [
        { name: 'naiveEqual demonstrates the float trap', code: `assert(naiveEqual === false, 'naiveEqual should be false — 0.1 and 0.2 are stored as rounded binary approximations, so their sum is 0.30000000000000004')` },
        { name: 'approxEqual accepts the tiny drift', code: `assert(typeof approxEqual === 'function' && approxEqual(0.1 + 0.2, 0.3) === true, 'approxEqual(0.1 + 0.2, 0.3) should be true — within epsilon is equal enough')` },
        { name: 'approxEqual still rejects real differences', code: `assert(approxEqual(1, 1.5) === false && approxEqual(100, 100.001) === false, 'approxEqual must return false for genuinely different values like 1 vs 1.5 — epsilon is for rounding drift, not for sloppiness')` },
      ],
      hints: [
        'The === comparison fails because both sides carry invisible rounding. The fix is to ask "are these within a hair of each other?" instead of "are these identical?".',
        'Math.abs(a - b) gives the distance between the two numbers. Your function should compare that distance against the epsilon 1e-9 (a billionth).',
        'Write `const surprise = 0.1 + 0.2;`, `const naiveEqual = surprise === 0.3;`, then `function approxEqual(a, b) { return Math.abs(a - b) < 1e-9; }`. Return the comparison directly — it is already a boolean.',
      ],
      solution: `const surprise = 0.1 + 0.2;
const naiveEqual = surprise === 0.3;

function approxEqual(a, b) {
  return Math.abs(a - b) < 1e-9;
}`,
      xp: 10,
    },
    {
      id: 'ch8-l2',
      title: 'Counting the Work: Big-O Intuition',
      reading: `Two programs can both be correct and yet be as different as a bicycle and a jet. The difference is how much *work* they do — and engineers have a shorthand for talking about it called **Big-O notation**. Despite the intimidating name (it comes from mathematics, "order of growth"), the core skill is something you can learn in one sitting: *count how many times the busy part of your code runs, as a function of the input size*.

Call the input size **n** — the length of the array, the number of users, the count of log lines. A single loop over the input runs its body n times: as data doubles, work doubles. That is **linear time, O(n)** — a straight-line relationship. Now put a loop *inside* that loop, with the inner one also walking the input: for each of n elements, you do n things — n × n = n² steps. That is **quadratic time, O(n²)**, and it is a different beast entirely. At n = 10 the difference is 10 versus 100 steps — imperceptible. At n = 1,000,000 (one day of logs for a busy service, one moderately popular app's user list) it is a million steps versus a **trillion**. The linear program finishes before you lift your finger off the Enter key; the quadratic one runs for many minutes, or hours. Nothing was "slow" in the code — no bad line, no wasted statement. The *shape* was slow.

Big-O deliberately ignores details. It drops constant factors (a loop that does 3 things per element is still O(n)) and keeps only the fastest-growing term (n² + n is just O(n²), because for large n the n² utterly dominates). This is not sloppiness — it is focus. Constants depend on hardware and this year's compiler; growth *shape* is eternal. An O(n²) algorithm on the world's fastest computer will always eventually lose to O(n) on a laptop, because doubling the data quadruples one workload and merely doubles the other. Big-O is how engineers reason about the future: not "is it fast today, on my test file?" but "what happens when the data is a thousand times bigger?" — and data is *always* eventually a thousand times bigger.

Let's make it concrete with the exercise you are about to do: does an array contain a duplicate? The instinctive solution compares everything to everything — for each element, scan the rest of the array looking for a match. Nested loops, n² comparisons, O(n²). It is correct, and for small inputs it is fine. The engineered solution asks a sharper question: as I walk the array *once*, have I seen this value before? Keep a \`Set\` of seen values; for each element, check membership and add. A Set is built (as a hash table) so that both operations take effectively constant time — **O(1)**, independent of how much the Set holds. One pass, constant work per element: O(n). Same answer, radically different future. This exact problem — and this exact Set trick — is one of the most common warm-up questions in software interviews, because it tests whether "too much work" registers in your gut.

The pattern behind the trick generalizes, and it is worth engraving: **nested loops that scan for "have I seen this?" or "does my partner exist?" can usually be flattened with a Set or Map** — trading a little memory for a lot of time. Space-versus-time trades are everyday engineering currency. The reverse trade exists too (recomputing to save memory), but in modern systems memory is usually the cheaper side of the exchange.

A few honest calibrations, so the tool stays sharp. O(1), constant time, means work independent of n — array indexing, Set lookups. O(log n) appears when each step *halves* the problem, as in binary search — so fast in practice it is nearly constant. Sorting well costs O(n log n) — worth knowing because "sort first, then one pass" is often the cleanest route to a linear-ish solution. And Big-O is not a religion: for n = 20, the quadratic version is instant, simpler to read, and choosing it is *good* engineering. The professional skill is not "always pick the lowest O." It is knowing the shape of what you wrote, the realistic size of n, and whether those two facts can coexist. Premature optimization wastes days; unnoticed quadratics take down services. The engineer's job is noticing.

For this lesson, you will write both solutions to the duplicate problem side by side. The tests check only correctness — no test can see your loop structure — but the point is in your fingers: feel the difference between writing "compare everything to everything" and "one pass with memory." That feeling is Big-O intuition, and it will fire on its own the next time you write a loop inside a loop.`,
      task: `Write the same function two ways. \`hasDuplicateSlow(arr)\` — nested loops: for each element, scan the elements after it for a match; return true if any pair matches, false otherwise. \`hasDuplicateFast(arr)\` — one pass with a \`Set\`: return true the moment you see a value already in the set, otherwise add and continue.`,
      starter: `// O(n²): nested loops — compare each element to every element after it
// function hasDuplicateSlow(arr) { ... }

// O(n): one pass — const seen = new Set(); seen.has(x)? / seen.add(x)
// function hasDuplicateFast(arr) { ... }
`,
      tests: [
        { name: 'slow version is correct', code: `assert(typeof hasDuplicateSlow === 'function' && hasDuplicateSlow([1, 2, 3]) === false && hasDuplicateSlow([1, 2, 2]) === true, 'hasDuplicateSlow should return false for [1,2,3] and true for [1,2,2]')` },
        { name: 'fast version is correct', code: `assert(typeof hasDuplicateFast === 'function' && hasDuplicateFast([4, 5, 6]) === false && hasDuplicateFast(['a', 'b', 'a']) === true, "hasDuplicateFast should return false for [4,5,6] and true for ['a','b','a']")` },
        { name: 'both handle empty and single-element arrays', code: `assert(hasDuplicateSlow([]) === false && hasDuplicateFast([]) === false && hasDuplicateSlow([9]) === false && hasDuplicateFast([9]) === false, 'no duplicates are possible with fewer than 2 elements — both functions should return false for [] and [9]')` },
        { name: 'both agree everywhere (they solve the same problem)', code: `const samples = [[1,1], [1,2,3,4,5], [3,1,4,1,5], ['x'], []]; for (const s of samples) { assert(hasDuplicateSlow(s) === hasDuplicateFast(s), 'both versions must give the same answer for [' + s.join(',') + '] — same problem, different cost'); }` },
      ],
      hints: [
        'Slow: outer loop picks index i, inner loop scans j from i+1 to the end; if arr[i] === arr[j], you found a duplicate. Fast: walk once, keeping a Set of values already seen.',
        'Slow skeleton: two for loops, inner starts at i + 1 (comparing an element with itself would false-alarm). Fast skeleton: `const seen = new Set();` then per element: if seen.has(x) return true, else seen.add(x).',
        'Slow: `for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] === arr[j]) return true;` then return false after both loops. Fast: `const seen = new Set(); for (const x of arr) { if (seen.has(x)) return true; seen.add(x); } return false;`. Note both return early — a loop can stop the moment the answer is known.',
      ],
      solution: `function hasDuplicateSlow(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

function hasDuplicateFast(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}`,
      xp: 15,
    },
    {
      id: 'ch8-l3',
      title: 'Debugging: Reproduce, Isolate, Fix',
      reading: `Every programmer's early debugging looks the same: stare at the code, change something that feels plausible, run it, repeat — a slot machine where the coins are your evening. Professional debugging is a different activity altogether. It is the scientific method with a keyboard: form a hypothesis, design an observation that could prove it wrong, look at the *evidence*, and repeat until the bug has nowhere left to hide. The discipline compresses into three words worth memorizing: **reproduce, isolate, fix.**

**Reproduce** means: before touching anything, find an input that makes the bug happen on demand. This sounds bureaucratic and is actually the highest-leverage step of the three. A bug you can trigger at will is a bug you can study — and later, a bug you can *prove* fixed by running the same input again. A bug you cannot reproduce is a rumor. Professional bug reports live and die on this: "averageScores([10, 20, 30]) returns 25, expected 20" is actionable; "the averages look wrong sometimes" is a support ticket that will boomerang for weeks. Pin the butterfly first.

**Isolate** means: shrink the territory where the bug could live until only one suspect remains. Your instrument is \`console.log\` — mocked by some as primitive, used daily by engineers at every level — deployed not as decoration but as *evidence collection*. The technique: log the intermediate values at each stage of the computation, run your reproduction, and compare each printed value against what you *expected* at that point. Somewhere there is a first place where expectation and reality split. That is where the bug lives — not necessarily where the error message appeared, which is merely where the damage became visible. The distance between where a bug bites and where it lives is why "stare harder at the crashing line" so often fails.

Two habits multiply isolation's power. Log *labels with values* — \`console.log('total after loop:', total)\` — because five naked numbers in a console are their own small debugging mystery. And when the code has stages, bisect: check the middle first. If the middle is healthy, the bug is downstream; sick, upstream. You just halved the search — O(log n) thinking, from last lesson, applied to your own code.

**Fix** means: change the code *because the evidence convicted a specific line*, then rerun the reproduction to watch it pass — and spend one extra minute checking nearby inputs, because bugs travel in pairs, and because a fix made without understanding sometimes just relocates the crime. If you cannot say *why* the old code was wrong, you have not fixed the bug; you have shuffled it.

Now for a truth this lesson's exercise is built around: **a buggy function can return correct-looking answers.** Your exercise code has *two* bugs — the loop starts at index 1, silently skipping the first score, and the divisor is \`scores.length - 1\`. Feed it \`[10, 10, 10]\`: skip the first 10, total 20, divide by 2 — answer 10. *Flawless-looking.* The two bugs partially cancel on uniform input. Feed it \`[10, 20, 30]\` and the mask slips: total 50, divide by 2, answer 25 instead of 20. This is why one passing test proves so little, why testers reach for varied and boundary inputs, and why "it worked when I tried it" is the most dangerous sentence in software. Bugs do not announce themselves; they wait for the input you did not try.

Interviewers probe this skill directly — "here is a function that misbehaves; walk me through finding the bug" — and what they watch for is *method*. The candidate who narrates ("first I reproduce with a small input… now I log the running total each iteration… total is 20 after a loop over three 10s, so the loop is dropping an element…") passes even if they fumble syntax. The candidate who mutates code at random fails even when a mutation happens to work. Evidence in, conclusion out. In this exercise, resist fixing the code by pattern-matching against what an average "should" look like. Run it mentally on \`[10, 20, 30]\`, log the total, catch each bug red-handed — practice the ritual, because the ritual is the skill.`,
      task: `The starter's \`averageScores\` returns wrong answers — it contains two separate bugs. Reproduce with a small input (try [10, 20, 30], which should average 20), isolate with console.log evidence, and fix both bugs so the function returns the true mean.`,
      starter: `// BUGGY — do not rewrite from scratch; find and fix the two bugs.
function averageScores(scores) {
  let total = 0;
  for (let i = 1; i < scores.length; i++) {
    total += scores[i];
  }
  return total / (scores.length - 1);
}

console.log('avg of [10,20,30]:', averageScores([10, 20, 30])); // expected 20
console.log('avg of [10,10,10]:', averageScores([10, 10, 10])); // expected 10 — looks fine, is it?
`,
      tests: [
        { name: 'the reproduction case is fixed', code: `assert(averageScores([10, 20, 30]) === 20, 'averageScores([10,20,30]) should be 20 — if you got 25, the loop is skipping the first score AND the divisor is off; log the running total to see which')` },
        { name: 'the deceptive case still passes (for the right reasons now)', code: `assert(averageScores([10, 10, 10]) === 10, 'averageScores([10,10,10]) should be 10 — the buggy version also said 10, because its two bugs canceled out on uniform input. Both must actually be fixed.')` },
        { name: 'a single score averages to itself', code: `assert(averageScores([7]) === 7, 'averageScores([7]) should be 7 — the buggy divisor (length - 1) would divide by zero here. Boundary inputs expose bugs that typical inputs hide.')` },
      ],
      hints: [
        'Reproduce first: what does the function return for [10, 20, 30]? Now isolate: log total right after the loop. Is it the sum of ALL three scores?',
        'Evidence: for [10, 20, 30], total comes out 50, not 60 — the loop never adds scores[0] because i starts at 1. And the divisor scores.length - 1 divides by one fewer than the number of scores. Two independent bugs.',
        'Fix the loop to `let i = 0` so the first element is included, and the return to `total / scores.length`. Re-run [10,20,30] → 60/3 = 20, and check [7] → 7 to confirm the divide-by-zero boundary is gone.',
      ],
      solution: `function averageScores(scores) {
  let total = 0;
  for (let i = 0; i < scores.length; i++) {
    total += scores[i];
  }
  return total / scores.length;
}`,
      xp: 10,
    },
    {
      id: 'ch8-l4',
      title: "Reading Code You Didn't Write",
      reading: `Here is a statistic that reshapes how you should practice: professional developers spend far more time *reading* code than writing it — most studies put the ratio near ten to one. Your first week at any job is reading. Reviewing a teammate's pull request is reading. Debugging is reading. Understanding a library, inheriting a legacy system, answering "what does this actually do?" in a meeting — reading, reading, reading. Yet almost all beginner practice is writing. This lesson trains the neglected majority skill, and it trains it the way engineers actually use it: by **predicting what code does before running it**.

The skill has a name among researchers — building a *notional machine* — and a practical form: you become the interpreter. Take a snippet, a pencil, and trace it line by line, keeping a little table of every variable and its current value. No skimming, no "yeah, that looks like it sums things." The discipline is exact: after line 3, \`a\` is *this*, \`b\` is *this*. Programmers who trace precisely debug quickly, because debugging *is* discovering where the real machine diverged from your mental one. If your mental machine is fuzzy, every divergence looks like magic.

Tracing JavaScript honestly means respecting a handful of rules the language never announces out loud. The big one — the one that has ended careers' worth of debugging hours — is **assignment does not copy arrays or objects; it copies a reference.** After \`const b = a\`, where \`a\` is an array, there is still exactly *one* array; \`a\` and \`b\` are two name tags on it. Push through \`b\` and \`a\` sees the change, because "both" arrays were always the same object. Primitives — numbers, strings, booleans — copy by value; collections share. When you trace, draw the array *once*, off to the side, with arrows from every variable that refers to it. The arrows are the truth; the variable names are just labels.

The same rule wears a second costume in function calls: passing a *number* to a function hands over a copy, so nothing the function does to its parameter can touch your variable. Reassigning a parameter inside a function (\`n = n + 1\`) rebinds a local name and is invisible outside. But pass an *array* and the function receives an arrow to your one-and-only array — if it mutates, you feel it. This is why the previous chapters made such noise about map and filter returning fresh arrays, and why \`sort\` mutating in place earned a warning label. When tracing a function call, ask two questions before anything else: what does each parameter receive — value or reference? and what does the function *return* versus what does it *mutate*?

Method chains — your pipelines from Chapter 7 — get traced stage by stage, writing out the full intermediate array after each link. \`[3, 1, 2].map(n => n * 2)\` → write \`[6, 2, 4]\` down, *then* apply \`.filter(n => n > 2)\` to what you wrote → \`[6, 4]\`. The classic reading error is fusing the stages and filtering the *original* values in your head. The intermediate arrays are real — the machine builds each one — and your trace should too.

A professional habit worth stealing early: when you truly cannot tell what an expression does, *make the program tell you* — assign the mystery expression to a well-named variable and print it. \`const afterFilter = nums.map(...).filter(...)\` splits a chain into inspectable checkpoints. This costs nothing at runtime, documents your investigation, and is exactly what you will do in this exercise: read three short snippets, commit to predictions, and encode each prediction as a variable. Tech interviews test precisely this under the name "what does this print?" — the questions look trivial and reliably filter out everyone whose mental machine runs on vibes.

The three snippets ahead each guard one of this lesson's rules: an aliased array (do the two names share?), a two-stage pipeline (what is the intermediate array?), and a number passed into a mutating-looking function (does the outer variable survive?). Trace with the pencil, commit to answers *before* running, and treat any miss as a gift — a miss marks the exact rule your notional machine had wrong, which is the only place learning can happen. A right answer teaches nothing; a confident wrong answer, corrected, is permanent.`,
      task: `Read the three snippets in the starter comments and predict what each marked expression evaluates to — WITHOUT running them first. Declare your answers as \`prediction1\` (a number), \`prediction2\` (a string), and \`prediction3\` (a number). Then run to grade yourself.`,
      starter: `// ---- Snippet 1: two names, how many arrays? ----
// const a = [1, 2, 3];
// const b = a;
// b.push(4);
// a.length            ← prediction1 (number)

// ---- Snippet 2: trace the pipeline one stage at a time ----
// const nums = [3, 1, 2];
// const doubled = nums.map(n => n * 2).filter(n => n > 2);
// doubled.join('-')   ← prediction2 (string)

// ---- Snippet 3: does the function change x? ----
// let x = 10;
// function bump(n) { n = n + 1; return n; }
// const y = bump(x);
// x + y               ← prediction3 (number)

// const prediction1 = ...
// const prediction2 = ...
// const prediction3 = ...
`,
      tests: [
        { name: 'snippet 1: aliasing', code: `assert(prediction1 === 4, 'prediction1 should be 4 — b = a does not copy the array; both names point at ONE array, so pushing through b grows the array a sees')` },
        { name: 'snippet 2: pipeline stages', code: `assert(prediction2 === '6-4', "prediction2 should be '6-4' — map first: [3,1,2] → [6,2,4]; then filter > 2 on THOSE values → [6,4]; joined with '-' → '6-4'")` },
        { name: 'snippet 3: pass-by-value for numbers', code: `assert(prediction3 === 21, 'prediction3 should be 21 — bump receives a COPY of the number 10; reassigning its parameter cannot touch x. x stays 10, y is 11, so x + y is 21')` },
      ],
      hints: [
        'Trace on paper with a variable table. For snippet 1, ask: after const b = a, how many arrays exist in memory? For snippet 2, write out the full array after map before you even look at the filter.',
        "Snippet 1: one array, two labels — the push is visible through both. Snippet 2: map gives [6, 2, 4]; the filter runs on those doubled values, not the originals. Snippet 3: numbers are copied into functions; n = n + 1 rebinds a local name only.",
        "prediction1 = 4 (the shared array grew to [1,2,3,4]). prediction2 = '6-4' ([6,2,4] filtered to [6,4], joined). prediction3 = 21 (x is still 10 — untouchable through a copied number — and y is the returned 11).",
      ],
      solution: `const prediction1 = 4;
const prediction2 = '6-4';
const prediction3 = 21;`,
      xp: 10,
    },
    {
      id: 'ch8-l5',
      title: 'Naming Is Design',
      reading: `There is a famous joke in software engineering: "There are only two hard things in computer science — cache invalidation and naming things." The joke endures because the second half is not really a joke. Names are the highest-leverage design decision most code contains, and the reason is structural: a name is written once and read hundreds of times, by teammates, by reviewers, by whoever debugs it at 3 a.m., and — the reader people forget — by you, eight months from now, with all context evaporated. Every one of those readers either understands instantly or pays a small tax of confusion. Multiply the tax by a career and naming stops being cosmetic.

Look at what bad naming actually costs. Here is a function you will meet in the wild, in every legacy codebase, forever:

\`\`\`
function proc(list, min) {
  const r = [];
  for (const p of list) {
    if (p.stock >= min) r.push(p.name);
  }
  return r;
}
\`\`\`

The *logic* is trivial — you could have written it in Chapter 3. But answering "what does proc do?" requires executing the whole body in your head, because the names carry zero information: \`proc\` process what? \`list\` of what? \`min\`imum what? \`r\`? The code is write-only — cheap to produce, expensive every single time it is read. Now the same function, renamed and nothing else:

\`\`\`
function namesOfInStockProducts(products, minimumStock) {
  const names = [];
  for (const product of products) {
    if (product.stock >= minimumStock) names.push(product.name);
  }
  return names;
}
\`\`\`

Same bytes of behavior, radically different reading experience: the *signature alone* tells the whole story, and the body becomes a formality you check rather than a puzzle you solve. That is the test worth internalizing — **could a reader predict what this function returns from its name and parameters, without reading the body?** When yes, callers never need to open the function again. A well-named function is an abstraction; a badly-named one is a trap with a handle.

Good naming has learnable craft, not just taste. Functions *do* things, so name them verb-first: \`calculateTotal\`, \`parseLine\`, \`sendReceipt\` — and make the verb honest (\`getUser\` that secretly *creates* missing users has lied to every caller). Booleans should read as questions with yes/no answers: \`isEmpty\`, \`hasDuplicate\`, \`canRetry\` — so that \`if (isEmpty)\` reads as English. Variables name *what the value is*, not how it is stored (\`overdueInvoices\`, not \`arr2\`), and they carry their units when units can bite: \`timeoutMs\`, \`priceInCents\`, \`distanceKm\` — a $125-million Mars orbiter was lost to two teams disagreeing about units a name could have carried. Scope sets the budget: a loop index alive for two lines may be \`i\` by universal convention, but the longer a name lives and the farther it travels, the more information it must pack.

Two failure modes bracket the craft. Under-naming you have seen: \`d\`, \`tmp\`, \`data2\`, \`doStuff\`. Over-naming is subtler — \`theArrayOfAllProductObjectsCurrentlyInStock\` buries signal in ceremony. The professional target is the *shortest name that is unambiguous in its context*. And when you cannot find any good name, treat that as a design smell, not a thesaurus problem: a function resisting naming is usually a function doing two jobs — \`validateAndSaveAndEmail\` is not crying out for a better name, it is crying out to be three functions. Naming difficulty is design feedback. Listen to it.

This is also, quietly, interview and code-review currency. Interviewers consistently report that naming quality is one of the first things they judge in a code sample — before cleverness, before performance — because names reveal whether you were thinking about the problem or just muscling through syntax. In code review at real companies, "can we find a clearer name?" is among the most common comments senior engineers leave, and it is never pedantry: they are protecting the team's future reading speed. Your exercise now is deliberately pure: take the cryptic \`proc\` above and republish it as \`namesOfInStockProducts(products, minimumStock)\` — identical behavior, honest names. The diff will touch nothing but words, and the words are the entire improvement. That is the lesson.`,
      task: `The starter contains the cryptic \`proc\` function. Write \`namesOfInStockProducts(products, minimumStock)\` — the exact same behavior (return the names of products whose stock is at least the minimum) with honest, self-explanatory names throughout the body too.`,
      starter: `// The stranger's code (works, unreadable):
// function proc(list, min) {
//   const r = [];
//   for (const p of list) {
//     if (p.stock >= min) r.push(p.name);
//   }
//   return r;
// }

// Rewrite it as namesOfInStockProducts(products, minimumStock)
// — same behavior, every name pulling its weight.
`,
      tests: [
        { name: 'function exists under its honest name', code: `assert(typeof namesOfInStockProducts === 'function', 'define namesOfInStockProducts(products, minimumStock) — verb-ish, specific, predictable from the signature alone')` },
        { name: 'returns names of products meeting the minimum', code: `const shelf = [{ name: 'nails', stock: 5 }, { name: 'glue', stock: 0 }, { name: 'tape', stock: 2 }]; assert(namesOfInStockProducts(shelf, 2).join(',') === 'nails,tape', "namesOfInStockProducts(shelf, 2) should return ['nails','tape'] — stock >= 2, names only, original order")` },
        { name: 'boundary: at-minimum counts, empty input is fine', code: `assert(namesOfInStockProducts([{ name: 'bolt', stock: 3 }], 3).join(',') === 'bolt' && namesOfInStockProducts([], 1).length === 0, 'stock exactly at the minimum should be included (>=), and an empty product list should return an empty array')` },
      ],
      hints: [
        'The behavior is already written for you in proc — your job is purely translation: give the function, both parameters, and every variable in the body names that say what they are.',
        'Signature: `function namesOfInStockProducts(products, minimumStock)`. Inside, rename r → names and p → product, and keep the p.stock >= min logic as product.stock >= minimumStock. (A filter + map chain is an equally good body.)',
        'Full rewrite: `function namesOfInStockProducts(products, minimumStock) { const names = []; for (const product of products) { if (product.stock >= minimumStock) names.push(product.name); } return names; }` — or the one-liner `return products.filter(p => p.stock >= minimumStock).map(p => p.name);`. Behavior identical to proc; only the words changed.',
      ],
      solution: `function namesOfInStockProducts(products, minimumStock) {
  const names = [];
  for (const product of products) {
    if (product.stock >= minimumStock) {
      names.push(product.name);
    }
  }
  return names;
}`,
      xp: 10,
    },
    {
      id: 'ch8-l6',
      title: 'Capstone: The Log Triage Tool',
      reading: `Final exercise of the course, so let's make it the real thing. Every production system — every server, every app with more than ten users — continuously writes a **log**: a running diary of lines like \`ERROR database timeout\` and \`INFO request handled\`. When something breaks at 2 a.m., the on-call engineer's first move is never to read the code; it is to interrogate the log. How many errors? What kinds? What is the system mostly saying? The tiny tool you are about to build — parse raw lines into structured records, select and count and summarize — is, at honest scale, the heart of products like Splunk and Datadog that companies pay millions for. The shapes of data work repeat; you have spent eight chapters learning the shapes.

This capstone is also a deliberate tour of the whole course. Watch your own toolbox as you work: string surgery with \`indexOf\` and \`slice\` (Chapter 6) turns each raw line into an object (Chapter 5); a named, reusable function (Chapter 4) does that parsing; \`map\`, \`filter\`, and \`reduce\` (Chapter 7) run the pipeline; an object-as-tally and a comparison loop over its keys close the loop back to Chapters 2 and 3. Floating a level above: honest names on everything (this chapter), linear passes rather than nested scans (this chapter), and if something misbehaves — reproduce, isolate, fix (this chapter). Nothing in this exercise is new. That is the point. Feature-complete is what "finished the course" literally means.

The architecture deserves a moment, because it is *the* canonical data-engineering pattern: **parse first, at the boundary, then never touch raw text again.** Raw strings are hostile territory — no structure, no guarantees, everything a substring away from a bug. So the first stage of any ingestion pipeline converts each line into a typed record: \`parseLine('ERROR database timeout')\` → \`{ level: 'ERROR', message: 'database timeout' }\`. Every downstream stage then works with honest fields like \`entry.level\` instead of re-slicing strings in five places. Real systems — compilers, API servers, ETL jobs — are all built this way: an outer crust that validates and structures messy input, and an interior that trusts its data. When you hear engineers say "don't let strings deep into your program," this is what they mean.

One parsing subtlety, straight from Chapter 6: the message itself contains spaces, so a naive \`split(' ')\` shatters it. The pattern for "split on the *first* occurrence only" is \`indexOf\` + two \`slice\`s — find the first space, take everything before it as the level, everything after as the message. Off-by-one alert at the boundary: \`slice(firstSpace + 1)\`, or every message arrives wearing a leading space. If your messages look subtly wrong, you know the ritual — log the parsed object and catch it red-handed.

From there the pipeline is Chapter 7 in its natural habitat. The error messages: parse all lines, keep the ERROR records, extract their messages — map, filter, map, reading exactly like the sentence describing it. The counts: a reduce with an object accumulator, the same group-and-tally you wrote for word lengths, now doing the job it holds in a thousand real dashboards. The busiest level: given a counts object like \`{ INFO: 3, WARN: 2, ERROR: 2 }\`, walk \`Object.keys\` carrying a best-so-far — the same champion pattern as your longest-word reduce. Three derived values, each computed from the stage before, each independently checkable. Notice you could also answer "what is the system mostly saying?" by *sorting* the levels — but you only need the winner, and a single O(n) pass beats an O(n log n) sort you mostly throw away. That instinct is lesson two of this chapter, already in your fingers.

A last word before you write it. Look back at Chapter 1 for a second — at the person for whom \`const x = 5\` was a genuinely new idea. That person could not have *read this paragraph*, let alone architected a parse-then-pipeline triage tool while weighing a sort against a linear scan. The distance between there and here is not trivia accumulated; it is a changed way of thinking — in values, in transformations, in evidence, in names. Computer engineering from here is more of exactly this: new domains, same escalating craft. Build the tool. Then go find real logs — they are everywhere — and notice that you can now read them. Welcome to the discipline.`,
      task: `Build the triage tool: (1) \`parseLine(line)\` — split a raw line on its FIRST space into \`{ level, message }\`; (2) \`errorMessages\` — the message strings of all ERROR lines in \`rawLog\`; (3) \`counts\` — an object tallying how many lines each level has; (4) \`mostCommonLevel\` — the level with the highest count.`,
      starter: `const rawLog = [
  'INFO server started',
  'WARN disk space low',
  'ERROR database timeout',
  'INFO request handled',
  'ERROR auth token expired',
  'WARN memory high',
  'INFO shutdown',
];

// function parseLine(line) — indexOf(' ') + slice twice → { level, message }

// const errorMessages = ...  parse, keep ERROR, extract messages
// const counts = ...         reduce → { INFO: 3, WARN: 2, ERROR: 2 }
// const mostCommonLevel = ...walk Object.keys(counts), carry the best-so-far
`,
      tests: [
        { name: 'parseLine splits on the first space only', code: `const entry = parseLine('ERROR database timeout'); assert(entry && entry.level === 'ERROR' && entry.message === 'database timeout', "parseLine('ERROR database timeout') should give level 'ERROR' and message 'database timeout' — the message keeps its internal spaces, and no leading space (slice from firstSpace + 1)")` },
        { name: 'errorMessages collects ERROR messages in order', code: `assert(Array.isArray(errorMessages) && errorMessages.join('|') === 'database timeout|auth token expired', "errorMessages should be ['database timeout', 'auth token expired'] — messages only, ERROR lines only, log order")` },
        { name: 'counts tallies every level', code: `assert(counts && counts.INFO === 3 && counts.WARN === 2 && counts.ERROR === 2, 'counts should be { INFO: 3, WARN: 2, ERROR: 2 } — one reduce with an object accumulator over the parsed levels')` },
        { name: 'mostCommonLevel finds the busiest level', code: `assert(mostCommonLevel === 'INFO', "mostCommonLevel should be 'INFO' (3 lines) — compare counts[level] for each key, keeping the champion")` },
      ],
      hints: [
        'Parse at the boundary first: get every line into { level, message } form, then build all three answers from parsed records — never re-slice raw strings downstream.',
        "parseLine: `const firstSpace = line.indexOf(' ');` then slice(0, firstSpace) and slice(firstSpace + 1). errorMessages: `rawLog.map(parseLine).filter(e => e.level === 'ERROR').map(e => e.message)`. counts: reduce with {} bumping acc[e.level].",
        "For the winner: `let mostCommonLevel = null; for (const level of Object.keys(counts)) { if (mostCommonLevel === null || counts[level] > counts[mostCommonLevel]) mostCommonLevel = level; }` — the champion pattern. (A reduce over Object.keys works identically.) Assemble: parseLine, then the three derived values in order, each built from parsed data.",
      ],
      solution: `const rawLog = [
  'INFO server started',
  'WARN disk space low',
  'ERROR database timeout',
  'INFO request handled',
  'ERROR auth token expired',
  'WARN memory high',
  'INFO shutdown',
];

function parseLine(line) {
  const firstSpace = line.indexOf(' ');
  return {
    level: line.slice(0, firstSpace),
    message: line.slice(firstSpace + 1),
  };
}

const entries = rawLog.map(parseLine);

const errorMessages = entries
  .filter(e => e.level === 'ERROR')
  .map(e => e.message);

const counts = entries.reduce((acc, e) => {
  acc[e.level] = (acc[e.level] || 0) + 1;
  return acc;
}, {});

let mostCommonLevel = null;
for (const level of Object.keys(counts)) {
  if (mostCommonLevel === null || counts[level] > counts[mostCommonLevel]) {
    mostCommonLevel = level;
  }
}`,
      xp: 20,
    },
  ],
};
