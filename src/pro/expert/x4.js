// Expert x4 — Big-O in Practice. See ../SCHEMA.md for the shape.

export default {
  id: 'x4',
  title: 'Big-O in Practice',
  tagline: 'Not "is it fast?" but "how does it slow down as the data grows?"',
  badge: { name: 'Complexity Whisperer', emoji: '📈' },
  intro: `Every engineer eventually asks the wrong question about performance: "Is this code fast?" Speed depends on the machine, the language, the mood of the operating system — it is a moving target. The question that actually matters, the one that survives changing hardware and holds up in every technical interview you will ever sit, is different: **"As the input grows, how does the amount of work grow?"** That is the question **Big-O notation** answers, and this chapter turns it from a piece of vocabulary you can recite into a tool you can feel.

Big-O describes the *shape* of a cost curve, not a stopwatch reading. It deliberately ignores constant factors and small inputs, because those wash out at scale, and zooms in on the one thing that decides whether your program survives success: the growth rate. An algorithm that takes ten steps per item — O(n) — beats an algorithm that takes one step per *pair* of items — O(n²) — the moment the data gets large, no matter how much slower each individual step is. Ten million versus a hundred trillion is not a contest. Learning to see that shape at a glance, from the structure of the code, is the skill.

You cannot measure this from inside the code runner — a two-thousand-millisecond timeout is not a benchmark, and micro-timings on small arrays lie. So this chapter teaches complexity through the **reading**, and asks you to write code that is *correct*, with the readings naming exactly why each solution sits where it does on the growth curve. You will build the same feature two ways — the slow O(n²) way and the fast O(n) way — and prove they return the same answers, while understanding in your bones why one of them falls over at scale and the other does not.

We will count operations to make "n" concrete, then learn to recognize the four complexity classes you will meet ninety percent of the time: O(1), O(log n), O(n), and O(n²). You will solve "does this array have duplicates?" with nested loops and then annihilate that solution with a \`Set\`. You will see why a \`Map\` or \`Set\` lookup is a superpower and what it costs in memory — the fundamental **space-versus-time tradeoff**. And you will finish with two-sum, the most-asked interview question in the world, solved in one linear pass. By the end, "what's the time complexity?" will stop being a question you dread and become one you answer before the interviewer finishes asking.`,
  lessons: [
    {
      id: 'x4-l1',
      title: 'Counting Operations',
      reading: `Big-O starts with a habit, not a formula: **count the operations as a function of the input size.** Give the input size a name — by universal convention, \`n\` — and ask "if n doubles, how many more steps does my code run?" Everything else in this chapter is built on that one question, so we begin by making it concrete with the simplest possible example: adding up the numbers from 1 to n.

The obvious way is a loop:

\`\`\`
function sumLoop(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}
\`\`\`

Count the work. The loop body runs once per value from 1 to n — that is n additions. If n is 100, the body runs 100 times; if n is a million, a million times. The number of operations is *directly proportional to n*, which we write as **O(n)**, "linear time." The defining feel of O(n) is this: double the input, double the work. It is an honest, predictable cost, and for many problems it is the best you can do, because you genuinely have to look at every item at least once.

But summing 1 to n does *not* actually require looking at every number, and this is where the lesson turns. There is a closed-form formula, known to Gauss as a schoolboy: the sum of 1 to n equals \`n * (n + 1) / 2\`. Pair the first and last (1 + n), the second and second-last (2 + n−1), and so on — each pair sums to n+1, and there are n/2 pairs.

\`\`\`
function sumFormula(n) {
  return n * (n + 1) / 2;
}
\`\`\`

Count *this* work: one multiplication, one addition, one division. Three operations. And here is the astonishing part — it is *three operations whether n is 10 or ten billion*. The cost does not grow with the input at all. That is **O(1)**, "constant time," the holy grail of complexity: the work is bounded by a constant no matter how large the input gets. \`sumLoop\` and \`sumFormula\` return identical answers, but one does n operations and the other does three. For n = 1,000,000 that is a million steps versus three.

This tiny pair of functions contains the entire moral of the chapter. Both are "correct." Both are short. But one scales and one does not, and the difference is invisible until you ask the Big-O question. The lesson is not "always find a formula" — most problems have no magic formula, and O(n) is often genuinely optimal. The lesson is the *habit*: whenever you write a loop, count how its work grows with the input, and whenever you can restructure to do less, know exactly how much less. An interviewer asking "can you do better than O(n) here?" is really asking "have you built this habit?" — and now you have.`,
      task: `Write two functions that both compute the sum of integers from 1 to \`n\` (assume n ≥ 0). \`sumLoop(n)\` uses a loop (O(n)). \`sumFormula(n)\` uses the closed-form \`n * (n + 1) / 2\` (O(1)). Both must return the same value for any n.`,
      starter: `// O(n): add each integer 1..n in a loop
function sumLoop(n) {

}

// O(1): the Gauss closed form, n * (n + 1) / 2
function sumFormula(n) {

}
`,
      tests: [
        { name: 'sumLoop adds 1..n', code: `assert(sumLoop(5) === 15 && sumLoop(1) === 1, 'sumLoop(5) should be 15 (1+2+3+4+5) and sumLoop(1) should be 1')` },
        { name: 'sumFormula adds 1..n', code: `assert(sumFormula(5) === 15 && sumFormula(10) === 55, 'sumFormula(5) should be 15 and sumFormula(10) should be 55')` },
        { name: 'both agree, including at n = 0', code: `assert(sumLoop(0) === 0 && sumFormula(0) === 0, 'both should return 0 when n is 0 (an empty sum)')` },
        { name: 'both agree on a larger n', code: `assert(sumLoop(1000) === sumFormula(1000), 'the O(n) loop and the O(1) formula must produce identical results — here, 500500')` },
      ],
      hints: [
        'sumLoop accumulates a running total across a loop from 1 to n. sumFormula does no loop at all — it plugs n into a single arithmetic expression.',
        'For the loop: start total at 0 and add i each pass. For the formula: `return n * (n + 1) / 2;`. Check that both give 0 when n is 0.',
        'Full: `function sumLoop(n) { let total = 0; for (let i = 1; i <= n; i++) total += i; return total; }` and `function sumFormula(n) { return n * (n + 1) / 2; }`. The loop does n additions; the formula does 3 operations regardless of n — that is the O(n) vs O(1) difference.',
      ],
      solution: `function sumLoop(n) {
  let total = 0;
  for (let i = 1; i <= n; i++) {
    total += i;
  }
  return total;
}

function sumFormula(n) {
  return n * (n + 1) / 2;
}`,
      xp: 10,
    },
    {
      id: 'x4-l2',
      title: 'Reading the Growth Curve',
      reading: `You now have the habit of counting operations. This lesson gives you the vocabulary — the four complexity classes that describe almost everything you will ever write — and, more importantly, teaches you to **read them straight off the structure of the code** without counting at all. Once your eyes are trained, you will glance at a function and know its Big-O the way you glance at a word and know how to say it.

**O(1) — constant.** The work does not depend on the input size. Grabbing \`arr[0]\`, reading \`arr.length\`, looking up a key in an object, pushing onto the end of an array — these take the same time whether the array holds ten items or ten million. The visual tell: *no loop over the input.* You reach straight to what you need.

**O(log n) — logarithmic.** The work grows, but agonizingly slowly — each step throws away a *fraction* (usually half) of what remains. Binary search from the last chapter is the poster child: a billion items, thirty steps. The tell: the input gets *cut in half* (or into some fixed fraction) each iteration, rather than stepped through one at a time. Logarithmic algorithms are so close to free that engineers treat "we got it down to log n" as a celebration.

**O(n) — linear.** One pass over the input; work proportional to its size. Summing an array, finding the max, filtering, mapping — a single loop that touches each element a constant number of times. The tell: *one loop over the data.* This is the honest, common case, and for many problems it is provably the best possible, because you must at least look at every element once.

**O(n²) — quadratic.** For each element, you do work proportional to *all* the elements — a loop inside a loop, both ranging over the same data. Selection sort, comparing every item to every other item, checking all pairs. The tell, and burn this into your reflexes: **a nested loop over the same collection is quadratic.** Double the input and the work *quadruples*. O(n²) is fine for small n and a trap at scale — the algorithm that flies in testing on 100 rows and melts in production on 100,000.

\`\`\`
function getMiddle(arr) {              // O(1): direct index, no loop
  return arr[Math.floor(arr.length / 2)];
}
function total(arr) {                  // O(n): one loop over the data
  let s = 0;
  for (const x of arr) s += x;
  return s;
}
function pairSums(arr) {               // O(n^2): nested loops, same data
  const out = [];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      out.push(arr[i] + arr[j]);
  return out;
}
\`\`\`

Look at those three and practice the reflex. \`getMiddle\` reaches straight to an index — no loop, O(1). \`total\` has one loop — O(n). \`pairSums\` has a loop inside a loop, both walking \`arr\` — O(n²); for an array of length n it produces about n²/2 sums, and that "for each element, touch the others" shape is the quadratic signature. Notice we do not care that the inner loop starts at \`i + 1\` and does *half* the full square — Big-O throws away constant factors like ½, because at scale n²/2 and n² bend upward the same way. Reporting \`pairSums\` as O(n²) is both correct and standard.

The ranking to keep in your head, best to worst: **O(1) < O(log n) < O(n) < O(n²)**. When you have a choice — and you often do — you move leftward on that list. Much of practical algorithm design is exactly this: spotting an O(n²) shape and asking "can I make this O(n)?" The next lesson does precisely that, taking a quadratic solution and collapsing it to linear with one well-chosen data structure. First, get the reflex: write these three functions, and as you write each one, say its complexity out loud.`,
      task: `Write three correctly-working functions. \`getMiddle(arr)\` returns the middle element (index \`Math.floor(length / 2)\`) — O(1). \`total(arr)\` returns the sum of all elements — O(n). \`pairSums(arr)\` returns an array of the sums of every unordered pair (each \`i < j\` once), in order — O(n²).`,
      starter: `// O(1): reach straight to the middle index — no loop
function getMiddle(arr) {

}

// O(n): one pass, summing every element
function total(arr) {

}

// O(n^2): for each i, pair it with every later j and push arr[i] + arr[j]
function pairSums(arr) {

}
`,
      tests: [
        { name: 'getMiddle returns the middle element', code: `assert(getMiddle([10, 20, 30, 40, 50]) === 30 && getMiddle([1, 2]) === 2, 'getMiddle should return arr[floor(length/2)]: 30 for a length-5 array, 2 for [1,2]')` },
        { name: 'total sums the array', code: `assert(total([4, 8, 15, 16, 23, 42]) === 108 && total([]) === 0, 'total should sum all elements (108 here) and return 0 for an empty array')` },
        { name: 'pairSums lists every pair sum in order', code: `assert(JSON.stringify(pairSums([1, 2, 3, 4])) === JSON.stringify([3, 4, 5, 5, 6, 7]), 'pairSums([1,2,3,4]) should be [1+2,1+3,1+4,2+3,2+4,3+4] = [3,4,5,5,6,7]')` },
        { name: 'pairSums of a short array', code: `assert(JSON.stringify(pairSums([5, 10])) === JSON.stringify([15]) && JSON.stringify(pairSums([7])) === JSON.stringify([]), 'pairSums([5,10]) is [15]; a single element has no pairs, so pairSums([7]) is []')` },
      ],
      hints: [
        'getMiddle needs no loop — just index into the array. total needs one loop. pairSums needs a loop inside a loop, with the inner one starting just past the outer index so each pair is counted once.',
        'getMiddle: `return arr[Math.floor(arr.length / 2)];`. total: accumulate with a single for-of loop. pairSums: outer i from 0, inner j from i + 1, push arr[i] + arr[j].',
        'pairSums shape: `const out = []; for (let i = 0; i < arr.length; i++) { for (let j = i + 1; j < arr.length; j++) { out.push(arr[i] + arr[j]); } } return out;`. Starting j at i + 1 avoids pairing an element with itself and avoids counting each pair twice.',
      ],
      solution: `function getMiddle(arr) {
  return arr[Math.floor(arr.length / 2)];
}

function total(arr) {
  let s = 0;
  for (const x of arr) {
    s += x;
  }
  return s;
}

function pairSums(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      out.push(arr[i] + arr[j]);
    }
  }
  return out;
}`,
      xp: 15,
    },
    {
      id: 'x4-l3',
      title: 'From O(n²) to O(n): The Duplicates Problem',
      reading: `Now we do the thing this whole chapter has been building toward: take a real problem, solve it the slow way, and then *watch it collapse* from quadratic to linear when we bring in the right data structure. The problem is a classic — "does this array contain any duplicate values?" — and the journey from the first solution to the second is one of the most important patterns in all of practical programming.

The instinctive solution: compare every element to every other element. If any two match, there is a duplicate.

\`\`\`
function hasDuplicatesSlow(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}
\`\`\`

This is correct, and you should recognize its shape instantly now: a nested loop over the same array, both indices sweeping the data — **O(n²)**. For a hundred elements it does about five thousand comparisons; for ten thousand elements, about fifty million; for a million elements, roughly half a *trillion*. It works perfectly in your tests and then, one day, on real data, it simply stops finishing. Every experienced engineer has shipped an accidental O(n²) and been paged for it. Recognizing the shape before it ships is the skill.

Here is the reframe that dissolves the problem. The slow version asks, for each element, "have I seen you before?" — and answers by re-scanning everything behind it. But *remembering what you have seen* is exactly what a **\`Set\`** is for. A \`Set\` is a collection of unique values with one superpower: checking whether it contains a value (\`set.has(x)\`) and adding a value (\`set.add(x)\`) are both **O(1)** — constant time, no scan, regardless of how many values it already holds. So walk the array once, and for each element, ask the Set if it has seen this before; if yes, duplicate found; if no, add it and move on.

\`\`\`
function hasDuplicatesFast(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) return true;
    seen.add(x);
  }
  return false;
}
\`\`\`

Count the work: one loop over n elements, and inside it two O(1) operations (\`has\` and \`add\`). That is n × constant = **O(n)**. The quadratic just vanished. On a million elements we went from half a trillion operations to about a million — a factor of roughly five hundred thousand, on the exact same problem, with the same answer. This is not a micro-optimization or a clever trick; it is a *category change* in how the program behaves at scale, and it came entirely from choosing a better tool to remember things.

Why does \`seen.has(x)\` run in constant time when \`arr.includes(x)\` would be linear? A \`Set\` (and its cousin the \`Map\`) is built on a **hash table**: it computes a numeric fingerprint of each value and uses it to jump more or less directly to the right storage slot, instead of walking every entry. You will study hashing more deeply later; for now, hold the practical rule that pays off constantly: **when your inner loop is searching for something, a \`Set\` or \`Map\` can usually turn that search into a constant-time lookup, dropping a whole factor of n.** Nested loop looking for a match is the smell; a hash-based lookup is the cure. This single pattern — "replace a scan with a Set/Map lookup" — is behind a huge fraction of the "can you make it faster?" answers in real work and in interviews, and the next two lessons are variations on it.`,
      task: `Write two functions that each return \`true\` if \`arr\` contains any value more than once, else \`false\`. \`hasDuplicatesSlow(arr)\` uses the nested-loop (O(n²)) approach. \`hasDuplicatesFast(arr)\` uses a \`Set\` for O(n). Both must give the same answers.`,
      starter: `// O(n^2): compare every pair of elements
function hasDuplicatesSlow(arr) {

}

// O(n): remember seen values in a Set; a repeat means a duplicate
function hasDuplicatesFast(arr) {

}
`,
      tests: [
        { name: 'both detect a duplicate', code: `assert(hasDuplicatesSlow([3, 1, 4, 1, 5]) === true && hasDuplicatesFast([3, 1, 4, 1, 5]) === true, 'both should return true — 1 appears twice')` },
        { name: 'both report no duplicate', code: `assert(hasDuplicatesSlow([3, 1, 4, 5, 9]) === false && hasDuplicatesFast([3, 1, 4, 5, 9]) === false, 'both should return false when every value is unique')` },
        { name: 'both handle empty and single-element arrays', code: `assert(hasDuplicatesSlow([]) === false && hasDuplicatesFast([]) === false && hasDuplicatesFast([7]) === false, 'no duplicates possible in an empty or single-element array — both should return false')` },
        { name: 'both agree on adjacent duplicates', code: `assert(hasDuplicatesSlow([8, 8]) === true && hasDuplicatesFast([8, 8]) === true, 'both should return true for [8, 8]')` },
      ],
      hints: [
        'The slow way compares each element with every later element. The fast way walks once, keeping a Set of values already seen and returning true the first time a value is already in the Set.',
        'Slow: nested loops, inner j starting at i + 1, return true if arr[i] === arr[j]. Fast: `const seen = new Set();` then for each x, `if (seen.has(x)) return true; seen.add(x);`.',
        'Fast shape: `function hasDuplicatesFast(arr) { const seen = new Set(); for (const x of arr) { if (seen.has(x)) return true; seen.add(x); } return false; }`. seen.has and seen.add are O(1), so the whole thing is one linear pass.',
      ],
      solution: `function hasDuplicatesSlow(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) {
        return true;
      }
    }
  }
  return false;
}

function hasDuplicatesFast(arr) {
  const seen = new Set();
  for (const x of arr) {
    if (seen.has(x)) {
      return true;
    }
    seen.add(x);
  }
  return false;
}`,
      xp: 15,
    },
    {
      id: 'x4-l4',
      title: 'Lookups vs Scans, and the Space–Time Tradeoff',
      reading: `The last lesson's trick — replace a scan with a hash lookup — is worth its own lesson, because it is the single most reusable performance move in everyday programming, and because it surfaces the deepest idea in this whole chapter: you usually buy speed with **memory**. Nothing is free; you trade one resource for another, and knowing which trade you are making is what engineering judgment is.

Consider a common task: given two arrays, find the elements of the first that also appear in the second — the intersection. The naive version reaches for \`includes\`:

\`\`\`
function commonSlow(a, b) {
  return a.filter(x => b.includes(x));   // b.includes is O(n) — inside a filter over a
}
\`\`\`

Read its cost carefully. \`filter\` walks all of \`a\` (that is n steps), and *for each* of those steps, \`b.includes(x)\` scans all of \`b\` looking for a match (another m steps). Work proportional to n × m — quadratic in the size of the input. The \`includes\` is hiding a whole loop inside an innocent-looking one-liner, which is exactly how accidental O(n²) sneaks past code review. The tell is always the same: **a search (\`includes\`, \`indexOf\`, \`find\`) inside a loop or a \`.filter\`/\`.map\` is a nested loop in disguise.**

The fix is the pattern you just learned. Build a \`Set\` from \`b\` once — that is one linear pass — and then every membership check becomes an O(1) lookup instead of an O(m) scan:

\`\`\`
function commonFast(a, b) {
  const inB = new Set(b);
  return a.filter(x => inB.has(x));
}
\`\`\`

Now the cost is one pass to build the Set (m steps) plus one pass to filter \`a\` with constant-time checks (n steps): O(n + m), linear. On two arrays of ten thousand elements each, the slow version does about a hundred million comparisons and the fast version about twenty thousand. Same result, wildly different behavior at scale — and the entire difference is that we *spent memory to save time*.

That phrase is the heart of the matter. The \`Set\` is not free: it occupies memory proportional to the size of \`b\`. We chose to allocate that extra storage so that lookups would become instant. That is the **space–time tradeoff**, and it runs through all of computing: caches trade memory for speed, indexes in a database trade disk space for fast queries, precomputed lookup tables trade storage for avoiding recalculation. The \`Map\` — a \`Set\` that stores a *value* alongside each key — is the same deal, letting you remember not just "have I seen x?" but "what did I record for x?", which is what powers frequency counts, deduplication, grouping, and joins.

When is the trade *not* worth it? When \`b\` is tiny — building a Set to search three elements is pointless ceremony, and \`includes\` is clearer. When memory is genuinely scarce and the data is enormous, the extra Set might not fit, and a slower-but-lean approach wins. When you only do the lookup once, there is nothing to amortize the Set-building cost against. Engineering is not "always use a Set"; it is *knowing there is a dial* between space and time and turning it deliberately for the situation in front of you. An interviewer who asks "can you optimize this?" and then "what does that cost you?" is probing for exactly this: not whether you know the trick, but whether you understand the trade. Reach for the Set when a repeated search is the bottleneck — and be able to say, out loud, that you paid for it in memory.`,
      task: `Write \`commonElements(a, b)\` that returns a new array of the elements in \`a\` that also appear in \`b\`, preserving \`a\`'s order and keeping duplicates from \`a\`. Build a \`Set\` from \`b\` first so each membership check is O(1) — do not use \`b.includes\` inside the loop.`,
      starter: `// Build a Set from b once. Then keep each element of a whose value is in that Set.
function commonElements(a, b) {

}
`,
      tests: [
        { name: 'returns the overlap in the order of a', code: `assert(JSON.stringify(commonElements([1, 2, 3, 4], [2, 4, 6])) === JSON.stringify([2, 4]), 'commonElements([1,2,3,4],[2,4,6]) should be [2,4] — elements of a that are also in b')` },
        { name: 'returns empty when there is no overlap', code: `assert(JSON.stringify(commonElements([1, 2], [3, 4])) === JSON.stringify([]), 'no shared elements should give []')` },
        { name: 'keeps duplicates from a', code: `assert(JSON.stringify(commonElements([5, 5, 1, 5], [5])) === JSON.stringify([5, 5, 5]), 'every occurrence in a that is in b is kept: [5,5,5]')` },
        { name: 'handles empty inputs', code: `assert(JSON.stringify(commonElements([], [1, 2])) === JSON.stringify([]) && JSON.stringify(commonElements([1, 2], [])) === JSON.stringify([]), 'if either array is empty the result is []')` },
        { name: 'works with strings too', code: `assert(JSON.stringify(commonElements(['a', 'b', 'c'], ['c', 'a'])) === JSON.stringify(['a', 'c']), "commonElements(['a','b','c'],['c','a']) should be ['a','c'] in a's order")` },
      ],
      hints: [
        'Turn b into a Set once so that "is this value in b?" is a constant-time question. Then filter a, keeping the elements the Set contains.',
        'One line does it once the Set exists: `const inB = new Set(b); return a.filter(x => inB.has(x));`. Building the Set up front is what makes each check O(1) instead of a scan of b.',
        'Full: `function commonElements(a, b) { const inB = new Set(b); return a.filter(x => inB.has(x)); }`. filter preserves a\'s order and keeps every matching occurrence, so duplicates in a that are in b are all kept.',
      ],
      solution: `function commonElements(a, b) {
  const inB = new Set(b);
  return a.filter(x => inB.has(x));
}`,
      xp: 15,
    },
    {
      id: 'x4-l5',
      title: 'Capstone: Two-Sum in One Pass',
      reading: `This is the most-asked question in technical interviewing, full stop. "**Two-sum**": given an array of numbers and a target, return the indices of the two numbers that add up to the target. It is asked everywhere because it perfectly separates candidates who reach for the obvious O(n²) from those who see the O(n) hiding in plain sight — and after this chapter, you are firmly in the second group. This capstone is your victory lap over everything Big-O has taught you.

The brute-force solution is the nested loop, and it is worth writing out just to name its cost: for every element, scan every *later* element and check whether the pair hits the target.

\`\`\`
function twoSumSlow(nums, target) {
  for (let i = 0; i < nums.length; i++)
    for (let j = i + 1; j < nums.length; j++)
      if (nums[i] + nums[j] === target) return [i, j];
  return null;
}
\`\`\`

You know this shape by heart now: nested loops over the same array, **O(n²)**. It is correct, and on small inputs it is fine. But it re-examines the same elements over and over, and we can do better by asking a sharper question.

Here is the reframe, and it is the same instinct from the duplicates and intersection lessons. As you walk the array, at each number \`x\` you are looking for its **complement** — the value \`target - x\` that would complete the pair. The slow version *searches* the rest of the array for that complement. But what if, instead, you *remembered every number you have already passed*, in a structure that can find a complement instantly? That structure is a **\`Map\`**: store each value you have seen as a key, mapped to the index where you saw it. Then for each new number, you do not search — you simply ask the Map, in O(1), "have I already seen my complement?"

\`\`\`
function twoSum(nums, target) {
  const seen = new Map();          // value -> index where we saw it
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];  // earlier index first
    }
    seen.set(nums[i], i);
  }
  return null;
}
\`\`\`

Walk it on \`nums = [2, 7, 11, 15]\`, \`target = 9\`. At \`i = 0\`, \`x = 2\`, we need \`7\`; the Map is empty, so we record \`2 → 0\`. At \`i = 1\`, \`x = 7\`, we need \`2\`; the Map *has* \`2\`, at index \`0\` — so we return \`[0, 1]\`. Two numbers, found in a single pass, because the Map turned "search for the complement" into "look up the complement." One loop over n elements, each doing O(1) Map operations: **O(n)**. We paid for it with the memory the Map occupies — the space–time tradeoff, made concrete one last time.

Three details make this bulletproof, and interviewers probe all three. First, we check for the complement *before* inserting the current number — that ordering guarantees we never pair a number with itself using a single occurrence (at index i, the Map holds only earlier indices). Second, because we store as we go and check against what came before, the returned pair is naturally \`[earlierIndex, laterIndex]\` — ordered, which is what the classic problem asks for. Third, storing \`value → index\` (not just the value) is what lets us return *indices* rather than the values themselves; choosing what the Map remembers is the whole art. Return \`null\` when no pair exists, so the caller has a clear "no answer" signal.

Step back and appreciate what just happened, because it is the thesis of this entire chapter in one function. A quadratic solution became linear not through a clever loop or a micro-optimization, but by **choosing a data structure that remembers**, trading a bit of memory to eliminate a repeated search. That move — spot the nested search, replace it with a hash-based lookup, collapse the n² to n — is the workhorse of practical algorithm design. Master two-sum and you have not memorized one interview answer; you have internalized the pattern behind a hundred of them. Write it.`,
      task: `Write \`twoSum(nums, target)\` that returns a two-element array \`[i, j]\` (with \`i < j\`) of the indices of two numbers in \`nums\` that add up to \`target\`, or \`null\` if no such pair exists. Use a \`Map\` for an O(n) single pass — do not use nested loops.`,
      starter: `// Walk once. For each nums[i], the value that completes the pair is target - nums[i].
// Keep a Map of value -> index for numbers already seen; check it before inserting.
function twoSum(nums, target) {

}
`,
      tests: [
        { name: 'finds the classic pair', code: `assert(JSON.stringify(twoSum([2, 7, 11, 15], 9)) === JSON.stringify([0, 1]), 'twoSum([2,7,11,15], 9) should be [0, 1] (2 + 7)')` },
        { name: 'finds a pair later in the array', code: `assert(JSON.stringify(twoSum([3, 2, 4], 6)) === JSON.stringify([1, 2]), 'twoSum([3,2,4], 6) should be [1, 2] (2 + 4) — note it must NOT return [0,0] by using 3 twice')` },
        { name: 'returns null when no pair works', code: `assert(twoSum([1, 2, 3], 100) === null, 'twoSum should return null when no two numbers add to the target')` },
        { name: 'handles negatives', code: `assert(JSON.stringify(twoSum([-3, 4, 1, -1], 0)) === JSON.stringify([2, 3]), 'twoSum([-3,4,1,-1], 0) should be [2, 3] (1 + -1 = 0)')` },
        { name: 'indices are in ascending order', code: `const r = twoSum([5, 1, 5], 10); assert(r !== null && r[0] < r[1] && JSON.stringify(r) === JSON.stringify([0, 2]), 'the two 5s are at indices 0 and 2; the earlier index must come first: [0, 2]')` },
      ],
      hints: [
        'For each number, its partner is target minus that number. Instead of searching the array for the partner, remember numbers you have already seen in a Map so you can look the partner up instantly.',
        'Loop with an index i. Compute `need = target - nums[i]`. If the Map already has `need`, return [Map.get(need), i]. Otherwise record `Map.set(nums[i], i)` and continue. Return null after the loop.',
        'Full shape: `const seen = new Map(); for (let i = 0; i < nums.length; i++) { const need = target - nums[i]; if (seen.has(need)) return [seen.get(need), i]; seen.set(nums[i], i); } return null;`. Checking BEFORE inserting is what stops a number from pairing with itself and keeps the indices in order.',
      ],
      solution: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
  return null;
}`,
      xp: 20,
    },
  ],
};
