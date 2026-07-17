// Expert x3 — Algorithms: Search & Sort. See ../SCHEMA.md for the shape.

export default {
  id: 'x3',
  title: 'Algorithms: Search & Sort',
  tagline: 'The two operations under everything: find a thing, and put things in order.',
  badge: { name: 'Search Party', emoji: '🧭' },
  intro: `Every non-trivial program eventually does one of two things to a collection: it **looks something up**, or it **puts things in order**. Search and sort are not exotic computer-science trivia — they are the bedrock operations that databases, spreadsheets, autocomplete boxes, and leaderboards are built on. You have already used JavaScript's built-in \`indexOf\`, \`includes\`, and \`sort\`. This chapter opens those black boxes so you understand what is happening inside, why one approach can be a thousand times faster than another on the same data, and how to choose.

Why learn to implement algorithms the language already ships? Not because you will hand-roll a sort in production — you almost never should. You learn them because they are the clearest possible training ground for **algorithmic thinking**: the habit of asking "how much work is this, really?" and "is there structure in the data I can exploit?" A linear scan and a binary search both find an element, and both are three lines of code, but one of them turns a million-item lookup from a million steps into twenty. Seeing exactly why is the difference between a programmer who reaches for the first thing that works and an engineer who reaches for the right thing.

These are also the most heavily interviewed topics in the entire field. "Search a sorted array," "sort these objects by a field," "find the pair that sums to a target" — variations of these appear in technical screens at every level, from internships to staff engineer. The interviewer rarely cares whether you memorized the code; they care whether you can reason about correctness and cost out loud. By the end of this chapter you will be able to.

We will build a linear search, then a binary search and see why it demands sorted input. You will implement a sort by hand — actually moving the elements — so the machinery is never mysterious again. Then you will drive JavaScript's own \`sort\` with comparators, on numbers and on objects. Finally, the two-pointer technique and a capstone that merges two sorted arrays, the beating heart of how real sorting libraries work. Let's open the box.`,
  lessons: [
    {
      id: 'x3-l1',
      title: 'Linear Search: The Honest Baseline',
      reading: `Start with the most direct possible way to find something in an array: look at every element, one after another, until you spot the one you want or run out. This is **linear search** — "linear" because in the worst case the work grows in a straight line with the size of the input. It is the algorithm you would use with a physical stack of papers and no filing system: start at the top, check each sheet, stop when you find it.

The reason to begin here is not that linear search is clever — it is that it is *honest*. It makes no assumptions. The array can be in any order, contain anything, and linear search still works. That generality is its whole value: when your data has no structure you can exploit, a linear scan is not a fallback, it is the correct answer. An engineer who reaches for something fancier on unsorted data is often just adding bugs.

Here is the shape:

\`\`\`
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}
\`\`\`

Read the two exits carefully, because they are where beginners stumble. The \`return i\` inside the loop is the **early exit**: the moment we find a match, we stop and hand back its index. We do not keep looping — there is no reason to, and on a long array that early return is most of the performance. The \`return -1\` sits *after* the loop, reached only if every element was checked and none matched. The sentinel value \`-1\` is the near-universal convention for "not found," because it can never be a real array index; JavaScript's own \`indexOf\` uses exactly this convention. Returning \`-1\` rather than, say, \`undefined\` or \`false\` means the caller can write \`if (found === -1)\` and every JavaScript reader instantly knows what that means.

There is a subtlety worth naming: this returns the index of the *first* match. If the array contains the target more than once, you get the earliest position, because the loop runs low-to-high and returns the instant it hits. That "first occurrence" guarantee is a real part of the contract — code that depends on it is common, and code that accidentally depends on it is a common bug. When you write a search, decide deliberately whether "first," "last," or "any" match is what the caller needs.

Now the cost, because this chapter is really about cost. Linear search is **O(n)**: with n elements, the worst case — target missing, or sitting in the last slot — checks all n. On ten items that is nothing. On ten million, it is ten million comparisons for a single lookup, and if you are doing that lookup inside another loop, you have quietly built something that visits a hundred trillion times. The whole rest of this chapter is about the structure — sortedness — that lets us do dramatically better. But you can only appreciate the shortcut once you have walked the long way, so walk it first.`,
      task: `Write a function \`linearSearch(arr, target)\` that returns the index of the first element strictly equal (\`===\`) to \`target\`, or \`-1\` if no element matches. Scan from index 0 upward and return as soon as you find it.`,
      starter: `// Loop i from 0 to arr.length - 1.
// If arr[i] === target, return i immediately.
// If the loop finishes with no match, return -1.
function linearSearch(arr, target) {

}
`,
      tests: [
        { name: 'finds an element in the middle', code: `assert(linearSearch([5, 3, 9, 1, 7], 9) === 2, 'linearSearch([5,3,9,1,7], 9) should return 2 (the index of 9)')` },
        { name: 'finds the first element', code: `assert(linearSearch([42, 8, 15], 42) === 0, 'linearSearch should return 0 when the target is at the front')` },
        { name: 'returns -1 when absent', code: `assert(linearSearch([1, 2, 3], 99) === -1, 'linearSearch should return -1 when the target is not present')` },
        { name: 'returns -1 for an empty array', code: `assert(linearSearch([], 5) === -1, 'linearSearch on an empty array should return -1')` },
        { name: 'returns the FIRST matching index for duplicates', code: `assert(linearSearch([7, 4, 7, 4], 4) === 1, 'with duplicates, linearSearch should return the earliest index — 4 first appears at index 1')` },
      ],
      hints: [
        'Walk the array from the front with a for loop, comparing each element to the target. The key idea is to stop and return the moment you find a match.',
        'Inside the loop, `if (arr[i] === target) return i;`. Place a `return -1;` after the loop, so it only runs when nothing matched.',
        'Full shape: `for (let i = 0; i < arr.length; i++) { if (arr[i] === target) return i; } return -1;`. Returning inside the loop is what gives you the FIRST index and lets you stop early.',
      ],
      solution: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i;
    }
  }
  return -1;
}`,
      xp: 10,
    },
    {
      id: 'x3-l2',
      title: 'Binary Search: Halving the Haystack',
      reading: `Imagine guessing a number I picked between 1 and 1000. If you guess one at a time — 1, 2, 3 — you might take a thousand tries. But if after each guess I tell you "higher" or "lower," you would never do that. You would guess 500, learn a direction, guess 250 or 750, and keep **halving the range**. From a thousand possibilities you reach the answer in about ten guesses. That is **binary search**, and it is one of the most important ideas in all of computing.

The magic ingredient is that "higher or lower" hint — and in an array, that hint only exists if the array is **sorted**. On unsorted data, knowing that the middle element is smaller than your target tells you nothing about which half the target lives in; it could be anywhere. Sortedness is precisely the structure that turns one comparison into information about half the array. This is the chapter's central lesson stated plainly: **an algorithm is only as good as the structure it can exploit, and sortedness is the most valuable structure there is.** The price of sorting up front buys you cheap lookups forever after.

Here is the standard implementation. Keep two bounds, \`lo\` and \`hi\`, marking the slice of the array still in play. Look at the middle. Adjust one bound to throw away the half that cannot contain the target. Repeat until the bounds cross.

\`\`\`
function binarySearch(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}
\`\`\`

Trace it on \`[1, 3, 5, 7, 9, 11]\` searching for \`7\`. First \`lo=0, hi=5\`, so \`mid=2\`, and \`arr[2]\` is \`5\`, which is less than 7 — the target must be to the right, so \`lo\` jumps to \`3\`. Now \`lo=3, hi=5\`, \`mid=4\`, \`arr[4]\` is \`9\`, too big — \`hi\` drops to \`3\`. Now \`lo=hi=3\`, \`mid=3\`, \`arr[3]\` is \`7\`. Found, in three comparisons instead of four. The gap looks small here, but it is the gap between \`n\` and \`log₂ n\`, and that gap is the whole point.

Three details are where binary search bugs breed, and interviewers know it. First, the loop condition is \`lo <= hi\`, not \`<\` — when \`lo\` equals \`hi\` there is still exactly one element left to check, and dropping that case means missing targets that sit alone at the end. Second, the bounds move to \`mid + 1\` and \`mid - 1\`, never plain \`mid\` — the middle was just tested and excluded, so leaving it in the range can loop forever. Third, \`Math.floor\` matters because array indices must be integers. Get any one of these wrong and you get an infinite loop or a silent miss; getting all three right from memory is a genuine rite of passage.

Now the payoff, the number every engineer should have burned into memory: binary search is **O(log n)**. Each step throws away half of what remains, so the question "how many halvings to get from n down to 1?" is answered by the base-2 logarithm. For a million elements that is about twenty steps. For a billion, about thirty. Linear search on that billion is a billion steps; binary search is thirty. This is not a modest optimization — it is the difference between "instant" and "your users left." The catch, always, is the precondition: **the array must be sorted**, and keeping it sorted has its own cost. Engineering is the art of deciding when that trade pays off, and for data you search far more often than you change, it nearly always does.`,
      task: `Write \`binarySearch(sorted, target)\` that assumes \`sorted\` is an array of numbers in ascending order. Return the index where \`target\` is found, or \`-1\` if it is absent. Use the two-bound (\`lo\`/\`hi\`) halving loop — do not just scan.`,
      starter: `// sorted is guaranteed ascending. Keep lo and hi as the live range.
// Look at the middle; move lo or hi to discard the half that can't contain target.
function binarySearch(sorted, target) {

}
`,
      tests: [
        { name: 'finds a value in the middle', code: `assert(binarySearch([1, 3, 5, 7, 9, 11], 7) === 3, 'binarySearch should return index 3 for value 7')` },
        { name: 'finds the first value', code: `assert(binarySearch([1, 3, 5, 7, 9, 11], 1) === 0, 'binarySearch should find the first element at index 0')` },
        { name: 'finds the last value', code: `assert(binarySearch([1, 3, 5, 7, 9, 11], 11) === 5, 'binarySearch should find the last element at index 5 — the lo <= hi condition matters here')` },
        { name: 'returns -1 for a missing value', code: `assert(binarySearch([1, 3, 5, 7, 9, 11], 8) === -1, 'binarySearch should return -1 for a value not in the array')` },
        { name: 'handles an empty array', code: `assert(binarySearch([], 5) === -1, 'binarySearch on an empty array should return -1')` },
      ],
      hints: [
        'Track a live range with two indices, lo and hi. Each pass, check the middle element and shrink the range to whichever half could still hold the target.',
        'Compute `mid = Math.floor((lo + hi) / 2)`. If arr[mid] equals target, return mid. If it is too small, move lo to mid + 1; otherwise move hi to mid - 1. Loop while lo <= hi.',
        'Full shape: `let lo = 0, hi = sorted.length - 1; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); if (sorted[mid] === target) return mid; if (sorted[mid] < target) lo = mid + 1; else hi = mid - 1; } return -1;`. The <= and the +1/-1 are the parts to get exactly right.',
      ],
      solution: `function binarySearch(sorted, target) {
  let lo = 0;
  let hi = sorted.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (sorted[mid] === target) {
      return mid;
    }
    if (sorted[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return -1;
}`,
      xp: 15,
    },
    {
      id: 'x3-l3',
      title: 'Selection Sort: Ordering By Hand',
      reading: `You have leaned on \`array.sort()\` for two chapters. Now you will implement a sort yourself, moving the elements with your own two hands, so that the machinery is never a mystery again. We use **selection sort** — not because it is fast (it is famously not), but because its logic is the easiest of all sorts to hold in your head, which makes it the perfect place to learn what "sorting" actually costs.

The idea is exactly how many people sort a hand of cards. Find the smallest card and put it at the far left. Then, ignoring that first card, find the smallest of what remains and put it second. Repeat: each pass **selects** the minimum of the unsorted region and locks it into place at the boundary. After one pass the smallest element is home; after two, the two smallest; after n passes, everything is in order. The name is literal — you select the minimum, over and over.

\`\`\`
function selectionSort(arr) {
  const a = [...arr];              // copy: never mutate the caller's array
  for (let i = 0; i < a.length; i++) {
    let minIndex = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIndex]) minIndex = j;
    }
    [a[i], a[minIndex]] = [a[minIndex], a[i]];   // swap the min into place
  }
  return a;
}
\`\`\`

Two things in that code deserve a moment. The first line copies the input with the spread operator before touching anything. This is a deliberate, professional choice: a function named \`selectionSort\` that quietly rearranged the array you handed it would be a nasty surprise — the same in-place-mutation trap you met with \`sort\`. Returning a fresh, sorted array leaves the caller's data pristine. The last line inside the loop is the **swap**, using array destructuring: \`[a[i], a[minIndex]] = [a[minIndex], a[i]]\` exchanges two elements in one line, no temporary variable needed. Before ES6 you needed a \`temp\` variable to do this; the destructuring form is now idiomatic and worth recognizing on sight.

Watch the structure: a loop inside a loop. The outer loop picks each position to fill; the inner loop scans the entire unsorted remainder to find the minimum for it. That nesting is the tell. For each of n positions, we scan up to n elements, so the work is proportional to n times n — **O(n²)**. Double the input and you quadruple the work. On a thousand items that is a million comparisons; on a million items, a *trillion*, which is why no serious library sorts this way. Recognizing the "nested loop over the same data" shape and immediately thinking "that's quadratic" is one of the most useful reflexes an engineer can build, and this lesson is where you build it.

So why learn a sort nobody ships? Because implementing one teaches what all the fast sorts are cleverly avoiding. Selection sort re-scans the whole remainder every single pass, throwing away everything it learned last time. The advanced sorts — merge sort, quicksort, the hybrid \`Timsort\` that JavaScript engines actually run — are all schemes for *not* redoing that work, for reaching **O(n log n)** by dividing the problem instead of grinding through it. You cannot appreciate that cleverness until you have felt the brute-force version in your fingers. And there is a genuine, humbling lesson in the cost: sorting is not free. Every time you casually call \`.sort()\` on a big array, real work happens. Knowing roughly how much is what separates guessing about performance from reasoning about it.`,
      task: `Write \`selectionSort(arr)\` that returns a **new** array with the numbers of \`arr\` in ascending order, without modifying \`arr\`. Implement the algorithm by hand (nested loops + swap) — do not call the built-in \`.sort()\`.`,
      starter: `// Copy arr first so you never mutate the caller's array.
// For each position i, find the index of the smallest element in a[i..end],
// then swap it into position i. Return the sorted copy.
function selectionSort(arr) {

}
`,
      tests: [
        { name: 'sorts an unordered array ascending', code: `assert(JSON.stringify(selectionSort([5, 2, 9, 1, 7])) === JSON.stringify([1, 2, 5, 7, 9]), 'selectionSort([5,2,9,1,7]) should return [1,2,5,7,9]')` },
        { name: 'does NOT mutate the input array', code: `const original = [3, 1, 2]; selectionSort(original); assert(JSON.stringify(original) === JSON.stringify([3, 1, 2]), 'the input array must be unchanged — copy it before sorting')` },
        { name: 'handles negatives and duplicates', code: `assert(JSON.stringify(selectionSort([4, -1, 4, 0, -1])) === JSON.stringify([-1, -1, 0, 4, 4]), 'selectionSort should handle negative numbers and duplicates: [-1,-1,0,4,4]')` },
        { name: 'handles empty and single-element arrays', code: `assert(JSON.stringify(selectionSort([])) === JSON.stringify([]) && JSON.stringify(selectionSort([42])) === JSON.stringify([42]), 'selectionSort([]) should be [] and selectionSort([42]) should be [42]')` },
      ],
      hints: [
        'The algorithm: for each slot from left to right, find the smallest value in the not-yet-sorted part and put it in that slot. Copy the array first so the original is left alone.',
        'Outer loop over i. Inside, start minIndex = i, then an inner loop over j from i+1 finds the true minimum index. After the inner loop, swap a[i] with a[minIndex].',
        'Shape: `const a = [...arr]; for (let i = 0; i < a.length; i++) { let minIndex = i; for (let j = i + 1; j < a.length; j++) { if (a[j] < a[minIndex]) minIndex = j; } [a[i], a[minIndex]] = [a[minIndex], a[i]]; } return a;`. The destructuring line swaps two elements without a temp variable.',
      ],
      solution: `function selectionSort(arr) {
  const a = [...arr];
  for (let i = 0; i < a.length; i++) {
    let minIndex = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[minIndex]) {
        minIndex = j;
      }
    }
    [a[i], a[minIndex]] = [a[minIndex], a[i]];
  }
  return a;
}`,
      xp: 15,
    },
    {
      id: 'x3-l4',
      title: 'Comparators: Sorting Real Data',
      reading: `Hand-rolling a sort was a teaching exercise; in production you use the engine's \`sort\`, which is a finely tuned O(n log n) hybrid you should not try to beat. But \`sort\` on its own is nearly useless for real data — you have to *tell it how to compare*, and doing that well is the actual day-to-day skill. This lesson is about the **comparator**, the small function that makes \`sort\` sort the way you mean.

Recall the trap from the higher-order chapter: with no argument, \`sort\` converts every element to a string and orders them alphabetically. \`[80, 9, 100].sort()\` returns \`[100, 80, 9]\`, because as text "100" precedes "80" precedes "9". This is not a bug you can wait out — it is baked into the language forever. The rule every JavaScript engineer internalizes: **never sort numbers, or anything non-string, without a comparator.** Forgetting it is a classic interview "gotcha" and an even more classic production incident.

A comparator is a two-argument callback with a three-way contract. \`sort\` repeatedly hands it a pair, \`a\` and \`b\`, and reads the sign of the returned number as a verdict: **negative means "a should come before b," positive means "b before a," zero means "leave their order alone."** For numbers, subtraction encodes this contract for free:

\`\`\`
const asc = [...nums].sort((a, b) => a - b);   // ascending
const desc = [...nums].sort((a, b) => b - a);  // descending
\`\`\`

Convince yourself with \`a - b\`: if \`a\` is smaller, \`a - b\` is negative, and negative means "a first" — so smaller values land first, which is ascending. You do not memorize which way the subtraction goes; you re-derive it from the contract in a few seconds, which is exactly what working engineers do at the keyboard. Swap to \`b - a\` and every comparison flips, giving descending.

Real data is rarely a bare array of numbers, though — it is objects, and you sort by one of their fields. The comparator just reaches into the field you care about:

\`\`\`
const byAge = [...people].sort((a, b) => a.age - b.age);
const byScoreDesc = [...people].sort((a, b) => b.score - a.score);
\`\`\`

This is the single most common sort you will ever write: pick the key, subtract in the direction you want. Sorting by a *string* field is different — subtraction is meaningless for text, so you use \`a.name.localeCompare(b.name)\`, which returns the same negative/positive/zero verdict for strings (and handles accents and locale correctly, unlike a naive \`<\` comparison). Knowing that \`localeCompare\` is the string counterpart of \`a - b\` rounds out your comparator toolkit.

One warning carries over and cannot be repeated too often: **\`sort\` mutates the array in place** and returns that same reordered array. Every example above spreads into a fresh array first — \`[...nums]\`, \`[...people]\` — so the caller's data keeps its original order. A bare \`.sort()\` on data some other part of the program is holding is the kind of "spooky action at a distance" bug that takes an afternoon to track down. Copy first, sort the copy; make it a reflex. Master the comparator and you can put *any* collection in *any* order — the skill scales from a list of prices to a table of database rows without changing shape.`,
      task: `Write two functions, each returning a new (non-mutating) sorted array. \`sortNumbers(nums)\` returns \`nums\` sorted ascending numerically. \`sortByKey(items, key)\` returns \`items\` (an array of objects) sorted ascending by the numeric property named \`key\`. Use \`sort\` with a comparator, on a copy of the input.`,
      starter: `// sortNumbers: ascending numeric order — remember the string-sort trap!
function sortNumbers(nums) {

}

// sortByKey: ascending by the numeric field named by the string \`key\`, e.g. sortByKey(people, 'age')
function sortByKey(items, key) {

}
`,
      tests: [
        { name: 'sortNumbers orders numbers correctly (not as strings)', code: `assert(JSON.stringify(sortNumbers([80, 9, 100, 20])) === JSON.stringify([9, 20, 80, 100]), 'sortNumbers([80,9,100,20]) should be [9,20,80,100] — a comparator is required or 100 sorts before 9')` },
        { name: 'sortNumbers does not mutate its input', code: `const src = [3, 1, 2]; sortNumbers(src); assert(JSON.stringify(src) === JSON.stringify([3, 1, 2]), 'sortNumbers must sort a copy — the original array should be untouched')` },
        { name: 'sortByKey sorts objects by a numeric key', code: `const people = [{ name: 'A', age: 30 }, { name: 'B', age: 19 }, { name: 'C', age: 25 }]; const out = sortByKey(people, 'age'); assert(out.map(p => p.name).join('') === 'BCA', "sortByKey(people, 'age') should order names B(19), C(25), A(30)")` },
        { name: 'sortByKey does not mutate its input', code: `const rows = [{ v: 2 }, { v: 1 }]; sortByKey(rows, 'v'); assert(rows[0].v === 2 && rows[1].v === 1, 'sortByKey must not reorder the caller\\'s array — sort a copy')` },
      ],
      hints: [
        'sort needs a comparator that returns a number: negative keeps the first argument first. For numbers ascending, that comparator is simply (a, b) => a - b.',
        'sortNumbers: `[...nums].sort((a, b) => a - b)`. sortByKey: reach into the field with a[key] and b[key]: `[...items].sort((a, b) => a[key] - b[key])`. Spreading first is what keeps the input unmutated.',
        'Full: `function sortNumbers(nums) { return [...nums].sort((a, b) => a - b); }` and `function sortByKey(items, key) { return [...items].sort((a, b) => a[key] - b[key]); }`. Note a[key] uses bracket access because key is a variable holding the property name.',
      ],
      solution: `function sortNumbers(nums) {
  return [...nums].sort((a, b) => a - b);
}

function sortByKey(items, key) {
  return [...items].sort((a, b) => a[key] - b[key]);
}`,
      xp: 15,
    },
    {
      id: 'x3-l5',
      title: 'Capstone: Merge Two Sorted Arrays',
      reading: `Here is the capstone, and it is a beautiful one — the operation at the very heart of how real sorting libraries work. You are given two arrays that are *each already sorted*, and you must combine them into one sorted array. This is the **merge** step of merge sort, and it showcases the **two-pointer technique**: a pattern that solves a whole family of array problems in a single, efficient pass.

The naive approach would be to concatenate the two arrays and sort the result — \`[...a, ...b].sort((x, y) => x - y)\`. That works, and for a quick script it is fine. But it *throws away* the most valuable thing you were given: the inputs are already ordered. Sorting from scratch is O(n log n) and ignores that gift. The two-pointer merge exploits the existing order to finish in O(n) — a single linear walk — which is exactly the kind of "notice the structure and exploit it" thinking this whole chapter has been drilling.

The technique: keep one **pointer** (an index) at the front of each array. Repeatedly compare the two elements the pointers are looking at, take the smaller one, push it onto the result, and advance *only that pointer*. Because both arrays are sorted, the smaller of the two front elements is guaranteed to be the smallest element not yet placed — so appending it keeps the result sorted. You march both pointers forward until one array is exhausted, then drain whatever remains of the other (it is already sorted, so it just gets appended in order).

\`\`\`
function merge(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      out.push(a[i]);
      i++;
    } else {
      out.push(b[j]);
      j++;
    }
  }
  while (i < a.length) { out.push(a[i]); i++; }
  while (j < b.length) { out.push(b[j]); j++; }
  return out;
}
\`\`\`

Trace \`merge([1, 4, 7], [2, 3, 8])\`. Compare \`1\` and \`2\`: take \`1\`, advance \`i\`. Compare \`4\` and \`2\`: take \`2\`, advance \`j\`. Compare \`4\` and \`3\`: take \`3\`. Compare \`4\` and \`8\`: take \`4\`. Compare \`7\` and \`8\`: take \`7\`. Now \`a\` is exhausted; the second drain loop appends the leftover \`8\`. Result: \`[1, 2, 3, 4, 7, 8]\`. Every element was looked at exactly once — that is what O(n) feels like from the inside.

Two details make it correct rather than almost-correct. The comparison is \`<=\`, not \`<\`: using "less than or equal" means that when the two front values are equal, we take from \`a\` first, which keeps equal elements in a predictable order — a property called **stability** that matters enormously when you are merging objects sorted by a key. And the two drain loops after the main loop are not optional cleanup — they are essential. The main \`while\` stops the instant *either* pointer runs off its array, which almost always leaves a tail of untaken (already-sorted) elements in the other. Forgetting the drains is the number-one bug in a hand-written merge, and interviewers watch for exactly that.

Step back and see what you have built. Merging two sorted lists in linear time is the engine of merge sort: to sort a big array, split it in half, sort each half (the same trick, recursively), and merge the two sorted halves with this very function. That divide-and-merge structure is what achieves O(n log n) and beats the O(n²) selection sort from earlier in the chapter by an enormous margin at scale. The two-pointer idea reaches far beyond merging, too — it solves "is this a palindrome?" (a pointer from each end walking inward), "find two values that sum to a target in a sorted array," and dozens of other problems, all with the same one-pass economy. Write the merge, and you have written the keystone.`,
      task: `Write \`merge(a, b)\` where \`a\` and \`b\` are each arrays of numbers already sorted ascending. Return a single new array containing all their elements in ascending order. Use the two-pointer walk (comparing fronts and advancing one index at a time) — do not concatenate and \`.sort()\`.`,
      starter: `// Two pointers i and j start at 0. While both are in range, push the smaller
// front element and advance that pointer. Then drain whatever array has elements left.
function merge(a, b) {

}
`,
      tests: [
        { name: 'merges two interleaving sorted arrays', code: `assert(JSON.stringify(merge([1, 4, 7], [2, 3, 8])) === JSON.stringify([1, 2, 3, 4, 7, 8]), 'merge([1,4,7],[2,3,8]) should be [1,2,3,4,7,8]')` },
        { name: 'handles one empty array (drain loop)', code: `assert(JSON.stringify(merge([], [1, 2, 3])) === JSON.stringify([1, 2, 3]) && JSON.stringify(merge([5, 6], [])) === JSON.stringify([5, 6]), 'merging with an empty array should just return the other array in order')` },
        { name: 'handles both empty', code: `assert(JSON.stringify(merge([], [])) === JSON.stringify([]), 'merge([], []) should be []')` },
        { name: 'handles duplicates and different lengths', code: `assert(JSON.stringify(merge([1, 1, 5], [1, 2])) === JSON.stringify([1, 1, 1, 2, 5]), 'merge([1,1,5],[1,2]) should be [1,1,1,2,5] — duplicates preserved, uneven lengths handled by the drain loops')` },
        { name: 'result length is the sum of inputs', code: `const r = merge([2, 4, 6, 8], [1, 3]); assert(r.length === 6 && JSON.stringify(r) === JSON.stringify([1, 2, 3, 4, 6, 8]), 'every element from both inputs must appear exactly once — check your drain loops')` },
      ],
      hints: [
        'Keep an index into each array. Compare the two front elements, push the smaller, and move only the pointer you took from. When one array is used up, the rest of the other is already sorted — just append it.',
        'Main loop runs `while (i < a.length && j < b.length)`, pushing the smaller of a[i] and b[j] and incrementing that index. After it, add two loops to drain any remaining a elements, then any remaining b elements.',
        'Shape: `const out = []; let i = 0, j = 0; while (i < a.length && j < b.length) { if (a[i] <= b[j]) out.push(a[i++]); else out.push(b[j++]); } while (i < a.length) out.push(a[i++]); while (j < b.length) out.push(b[j++]); return out;`. The two drain loops after the main loop are essential, not optional.',
      ],
      solution: `function merge(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] <= b[j]) {
      out.push(a[i]);
      i++;
    } else {
      out.push(b[j]);
      j++;
    }
  }
  while (i < a.length) {
    out.push(a[i]);
    i++;
  }
  while (j < b.length) {
    out.push(b[j]);
    j++;
  }
  return out;
}`,
      xp: 20,
    },
  ],
};
