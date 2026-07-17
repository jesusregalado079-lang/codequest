// Expert Chapter x1 — Recursion & Decomposition. See ../SCHEMA.md for the shape.

export default {
  id: 'x1',
  title: 'Recursion & Decomposition',
  tagline: 'A function that calls itself is not a party trick. It is how you tame anything shaped like a tree.',
  badge: { name: 'Base Case Believer', emoji: '🌀' },
  intro: `You already trust loops. A \`for\` loop is a workhorse: it marches an index from here to there and does the same thing at every stop. But some problems are not shaped like a straight march. They are shaped like a tree — a folder full of folders full of folders, a comment with replies that have replies, an expression built out of smaller expressions. For those, loops fight you. **Recursion** fits like a key in a lock.

Recursion is a function that calls itself. That one sentence makes most people flinch, because it sounds circular — how can a thing be defined in terms of itself without spinning forever? The answer is the whole art of this chapter, and it comes down to two parts that every recursive function must have: a **base case** that stops the spinning, and a **recursive case** that makes the problem smaller on the way toward that base case. Get those two right and recursion is not mysterious at all. It is just a loop that the machine bookkeeps for you, using a hidden stack instead of a visible counter.

Here is the mindset shift, and it is a real one. A loop asks "what do I do at each step?" Recursion asks a different, more powerful question: "if someone already solved the slightly smaller version of this problem, how would I finish the job?" You assume the smaller answer exists — you take it on faith — and you only write the one step that combines it with the current piece. This is called the **leap of faith**, and once you can make it, whole categories of problems that felt impossible become four lines of code.

We will build this carefully. First the anatomy — base case and recursive case — on the friendliest possible example. Then the call stack, so you can see exactly what the machine is doing and why recursion can run out of memory. Then recursion over real nested data, which is where it stops being a classroom exercise and starts being the tool you reach for. Then the honest comparison with iteration, because a good engineer knows that recursion is sometimes the wrong choice. And finally a capstone where you flatten arbitrarily nested arrays and walk a tree-shaped object — the two shapes you will meet again and again in real systems, from JSON payloads to the DOM to a compiler's syntax tree.`,
  lessons: [
    {
      id: 'x1-l1',
      title: 'Base Case, Recursive Case',
      reading: `Every recursive function is built from exactly two parts, and if either one is missing or wrong, the function is broken. The first part is the **base case**: the smallest, simplest input where you already know the answer without doing any more work. The second is the **recursive case**: every other input, where you do a little bit of work and then hand the rest of the problem to *yourself*, on a smaller input. The base case is the floor. The recursive case is the staircase that walks down to it. No floor, and you fall forever — that is the infinite recursion that crashes your program.

The classic first example is **factorial**. The factorial of n, written n!, is the product of every whole number from 1 up to n. So 4! is 4 times 3 times 2 times 1, which is 24. You could write this with a loop, and later you should. But look at it through the recursive lens instead. Notice that 4! is just 4 times 3!. And 3! is 3 times 2!. There is a smaller version of the same problem hiding inside the big one, which is the tell-tale sign that recursion will fit.

So the recursive case writes itself: \`factorial(n)\` returns \`n * factorial(n - 1)\`. That is the leap of faith in action — we assume \`factorial(n - 1)\` already gives the right answer for the smaller number, and we just multiply by n to finish. But this alone would spin forever, calling factorial(3), factorial(2), factorial(1), factorial(0), factorial(-1), and off into oblivion. We need the floor. By definition, 0! is 1. That is our base case: when n is 0, return 1 immediately, no further recursion.

\`\`\`
function factorial(n) {
  if (n === 0) return 1;      // base case: the floor
  return n * factorial(n - 1); // recursive case: one step down
}
\`\`\`

Trace \`factorial(3)\` in your head. It cannot finish until it knows \`factorial(2)\`, which cannot finish until \`factorial(1)\`, which cannot finish until \`factorial(0)\` — and *that* one returns 1 on the spot, no recursion. Now the answers flow back up: factorial(1) is 1 times 1, factorial(2) is 2 times that, factorial(3) is 3 times that, giving 6. The base case is what lets the whole chain finally resolve. This is why experienced engineers write the base case *first*, before the recursive case: it is the thing that guarantees your function terminates, and forgetting it is the single most common recursion bug there is.

One judgment note for interviews and real code alike: always ask "does my recursive call actually move toward the base case?" \`factorial(n - 1)\` shrinks n toward 0, so it does. If you accidentally wrote \`factorial(n)\` or \`factorial(n + 1)\`, the input never reaches the floor and you get infinite recursion — the same category of bug as a \`while\` loop whose condition never goes false. Base case, and *progress toward it*. Those are the two things to verify every single time.`,
      task: `Write a function \`factorial(n)\` that returns n! (the product of 1 through n) using recursion. It must return 1 for an input of 0. Do not use a loop.`,
      starter: `// Base case first: when n is 0, return 1.
// Recursive case: return n * factorial(n - 1).
function factorial(n) {
  // your code here
}
`,
      tests: [
        { name: 'base case: factorial(0) is 1', code: `assert(factorial(0) === 1, 'factorial(0) should be 1 (the base case), got ' + factorial(0))` },
        { name: 'factorial(1) is 1', code: `assert(factorial(1) === 1, 'factorial(1) should be 1, got ' + factorial(1))` },
        { name: 'factorial(5) is 120', code: `assert(factorial(5) === 120, 'factorial(5) should be 120 (5*4*3*2*1), got ' + factorial(5))` },
        { name: 'factorial(10) is 3628800', code: `assert(factorial(10) === 3628800, 'factorial(10) should be 3628800, got ' + factorial(10))` },
        { name: 'it actually recurses (no obvious loop keyword required, but the definition must be self-referential)', code: `assert(factorial(6) === 720 && factorial(3) === 6, 'factorial(6) should be 720 and factorial(3) should be 6')` },
      ],
      hints: [
        'A recursive function needs a base case (the input where you know the answer outright) and a recursive case (where you call the same function on a smaller input). For factorial, the base case is n === 0.',
        'When n is 0, return 1. Otherwise return n multiplied by the factorial of n - 1 — trust that the smaller call gives the right answer.',
        'Write `if (n === 0) return 1;` then `return n * factorial(n - 1);`. The subtraction is what marches n down toward 0 so the recursion terminates.',
      ],
      solution: `function factorial(n) {
  if (n === 0) return 1;
  return n * factorial(n - 1);
}`,
      xp: 10,
    },
    {
      id: 'x1-l2',
      title: 'The Call Stack',
      reading: `To use recursion with confidence you need to see the machinery it runs on. That machinery is the **call stack**, and it is not exotic — it is the same thing that manages every function call your programs have ever made. Recursion just makes the stack visible by piling many copies of one function onto it at once.

Every time any function is called, the runtime allocates a small block of memory called a **stack frame**. The frame holds that call's local variables, its arguments, and a bookmark for where to resume when the call finishes. Frames are stacked like a pile of plates: the most recent call sits on top. When a function returns, its plate is lifted off and the call underneath resumes exactly where it left off, using the value that just came back. "Stack" is literal — last on, first off.

Now watch what happens with \`sumTo(3)\`, a function that adds up 1 through n recursively. \`sumTo(3)\` needs \`sumTo(2)\` before it can finish, so a frame for sumTo(3) sits on the stack, paused, while sumTo(2) runs on top of it. sumTo(2) needs sumTo(1), so it pauses too. sumTo(1) needs sumTo(0). At the deepest point there are four frames stacked up, all paused, waiting. Then \`sumTo(0)\` hits the base case and returns 0 without recursing — and the pile *unwinds*: each paused frame wakes up, adds its number, and returns to the one below it. The answers assemble on the way back down the stack, which is why a recursive call's real work often happens *after* the recursive call returns, not before.

\`\`\`
function sumTo(n) {
  if (n === 0) return 0;        // base case
  return n + sumTo(n - 1);      // pauses here until the inner call returns
}
\`\`\`

This mental picture explains two things that otherwise seem like magic. First, why local variables in different recursive calls do not clobber each other: every frame has its *own* copy of \`n\`, so the n inside sumTo(3) is a different slot of memory from the n inside sumTo(2). Recursion looks like one function reusing one variable, but the machine sees many independent frames. Second, it explains the dreaded **stack overflow**. The stack is a fixed, finite region of memory. Each pending frame consumes a little of it. Recurse too deep — say, \`sumTo(100000)\` — and you exhaust the space before hitting the base case, and the runtime aborts with "Maximum call stack size exceeded." An infinite recursion, with no reachable base case, is just the fastest way to overflow.

This is the concrete cost that iteration does not pay: a \`for\` loop reuses one frame and one counter no matter how many times it spins, while deep recursion piles up frames until the memory runs out. It is exactly the kind of trade-off an interviewer is probing when they ask "what's the space complexity of your recursive solution?" The honest answer is O(depth) — the maximum number of frames stacked at once — and for a recursion that goes n deep, that is O(n) memory that the loop version does not spend. You will use that vocabulary in the recursion-versus-iteration lesson coming up.`,
      task: `Write two recursive functions. \`sumTo(n)\` returns the sum of the whole numbers from 1 to n (and 0 when n is 0). \`reverseString(s)\` returns the string \`s\` with its characters reversed, using recursion (and returns '' for the empty string). Do not use a loop or the built-in Array \`.reverse()\`.`,
      starter: `// sumTo: base case n === 0 returns 0; else n + sumTo(n - 1).
function sumTo(n) {
  // your code here
}

// reverseString: base case '' returns ''; else recurse on the rest and append the first char.
function reverseString(s) {
  // your code here
}
`,
      tests: [
        { name: 'sumTo base case', code: `assert(sumTo(0) === 0, 'sumTo(0) should be 0, got ' + sumTo(0))` },
        { name: 'sumTo(5) is 15', code: `assert(sumTo(5) === 15, 'sumTo(5) should be 15 (1+2+3+4+5), got ' + sumTo(5))` },
        { name: 'sumTo(100) is 5050', code: `assert(sumTo(100) === 5050, 'sumTo(100) should be 5050, got ' + sumTo(100))` },
        { name: 'reverseString of empty is empty', code: `assert(reverseString('') === '', "reverseString('') should be '', got '" + reverseString('') + "'")` },
        { name: 'reverseString reverses', code: `assert(reverseString('recursion') === 'noisrucer' && reverseString('a') === 'a', "reverseString('recursion') should be 'noisrucer' and reverseString('a') should be 'a'")` },
      ],
      hints: [
        'Each recursive call gets its own stack frame with its own copy of the argument. Both functions need a base case (the smallest input) and a recursive case that shrinks the input.',
        'sumTo: return 0 when n is 0, otherwise n + sumTo(n - 1). reverseString: return the empty string when s is empty, otherwise reverse the rest of the string and put the first character at the end.',
        'sumTo: `if (n === 0) return 0; return n + sumTo(n - 1);`. reverseString: `if (s === "") return ""; return reverseString(s.slice(1)) + s[0];` — the slice drops the first char (progress toward the base case) and s[0] gets appended after the reversed remainder.',
      ],
      solution: `function sumTo(n) {
  if (n === 0) return 0;
  return n + sumTo(n - 1);
}

function reverseString(s) {
  if (s === '') return '';
  return reverseString(s.slice(1)) + s[0];
}`,
      xp: 10,
    },
    {
      id: 'x1-l3',
      title: 'Recursing Over Nested Data',
      reading: `Numbers were the training wheels. Recursion earns its keep on **nested data** — data shaped like a tree, where a thing can contain more things of the same kind, to any depth. An array can hold arrays that hold arrays. A comment can have replies that have replies. A file system is folders inside folders. None of these have a fixed depth you can hardcode, and *that* is exactly why loops struggle and recursion sings: a recursive function does not care whether the nesting is two deep or two hundred, because it handles each level by calling itself on the next level down.

The key realization is that the structure of your code should mirror the structure of your data. When the data is "a value, OR a container of more values," your function is "handle a value, OR recurse into the container." Consider a deeply nested array of numbers, and the job of summing every number no matter how buried:

\`\`\`
function deepSum(arr) {
  let total = 0;
  for (const item of arr) {
    if (Array.isArray(item)) {
      total += deepSum(item);   // item is a sub-array: recurse into it
    } else {
      total += item;            // item is a number: add it directly
    }
  }
  return total;
}
\`\`\`

Read that loop and notice it is doing two different jobs depending on what it finds. For a plain number, it just adds — that is the base-case behavior, the simple thing you can do without recursing. For a nested array, it calls \`deepSum\` on that array and trusts the result — the leap of faith again, one level down. There is no base case written as an early \`return\` this time; instead the base case is *implicit*, hiding in the branch that handles a plain number without recursing. An empty array also terminates naturally, because the loop simply does not run. Recursion over data structures often looks like this: the "floor" is the branch where an element is a leaf, not a container.

This same shape handles objects. Real JSON from an API is a tangle of objects containing objects containing arrays. Suppose you want to collect every string value anywhere in such a structure. You inspect each value: if it is a string, keep it (leaf); if it is an object or array, recurse into its entries (container). The pattern — *inspect the node, act on leaves, recurse into containers* — is the single most useful recursive template you will ever learn, because so much of what software does is walk trees. Rendering the DOM, evaluating a math expression, serializing state, searching a directory: all of it is this.

A word on why the loop-plus-recursion combination here is not a contradiction of "recursion replaces loops." It does not. At each *single level*, you still loop across the siblings — the items sitting next to each other in one array. Recursion handles the *depth*; the loop handles the *breadth*. Nested data has both, so mature recursive code usually has both. Anyone who tells you real recursion never contains a loop has only ever recursed over integers.

The engineering payoff is enormous and worth internalizing. Without recursion, walking arbitrarily nested data means maintaining your own explicit stack of "places I still need to visit" and looping until it is empty — which works, and is sometimes necessary to avoid stack overflow, but is fiddly and error-prone. Recursion lets you borrow the *language's* call stack to do that bookkeeping for free. You describe what to do at one node and how to reach its children, and the runtime handles the traversal. That is decomposition: a gnarly whole-tree problem dissolved into "what do I do at one node?"`,
      task: `Write a recursive function \`deepSum(arr)\` that returns the sum of every number in a nested array, no matter how deeply the numbers are nested inside sub-arrays. An empty array sums to 0. You may use a loop over each array's direct items, but you must recurse to handle the nesting.`,
      starter: `// For each item: if it is an array, recurse into it; otherwise add the number.
// Array.isArray(item) tells you whether item is a sub-array.
function deepSum(arr) {
  // your code here
}
`,
      tests: [
        { name: 'empty array sums to 0', code: `assert(deepSum([]) === 0, 'deepSum([]) should be 0, got ' + deepSum([]))` },
        { name: 'flat array', code: `assert(deepSum([1, 2, 3, 4]) === 10, 'deepSum([1,2,3,4]) should be 10, got ' + deepSum([1, 2, 3, 4]))` },
        { name: 'one level of nesting', code: `assert(deepSum([1, [2, 3], 4]) === 10, 'deepSum([1,[2,3],4]) should be 10, got ' + deepSum([1, [2, 3], 4]))` },
        { name: 'deeply and unevenly nested', code: `assert(deepSum([1, [2, [3, [4, [5]]]], 6]) === 21, 'deepSum([1,[2,[3,[4,[5]]]],6]) should be 21, got ' + deepSum([1, [2, [3, [4, [5]]]], 6]))` },
        { name: 'nested empties contribute nothing', code: `assert(deepSum([[], [[], []], [7, []]]) === 7, 'deepSum([[],[[],[]],[7,[]]]) should be 7, got ' + deepSum([[], [[], []], [7, []]]))` },
      ],
      hints: [
        'Loop over the array. Each item is either a number (add it) or a sub-array (a smaller version of the same problem — recurse). Use Array.isArray(item) to tell them apart.',
        'Keep a running total. For each item, if Array.isArray(item) add deepSum(item) to the total, otherwise add item itself. Return the total at the end.',
        'Write `let total = 0; for (const item of arr) { if (Array.isArray(item)) total += deepSum(item); else total += item; } return total;`. The empty-array case needs no special handling — the loop just never runs and total stays 0.',
      ],
      solution: `function deepSum(arr) {
  let total = 0;
  for (const item of arr) {
    if (Array.isArray(item)) {
      total += deepSum(item);
    } else {
      total += item;
    }
  }
  return total;
}`,
      xp: 15,
    },
    {
      id: 'x1-l4',
      title: 'Recursion vs Iteration',
      reading: `Now the honest conversation. Recursion is beautiful, but a senior engineer does not reach for the beautiful tool — they reach for the *right* tool, and half the time that is a plain loop. Knowing which is which is a real skill, and it is exactly the kind of judgment an interviewer is testing when they ask you to "solve it another way" after you write a recursive solution.

Anything you can do with recursion you can also do with iteration, and vice versa — they are equivalent in power. The difference is *fit* and *cost*. Recursion fits when the problem or the data is naturally self-similar: trees, nested structures, divide-and-conquer algorithms like merge sort, backtracking searches. For those, the recursive code is dramatically shorter and reads almost like the definition of the problem. Iteration fits when the work is a flat, linear march: summing an array, scanning a string, counting to a million. For those, a loop is clearer and, crucially, cheaper.

The cost is the call stack, which you met two lessons ago. Every pending recursive call holds a stack frame, so a recursion that goes n deep uses O(n) memory that a loop does not. Worse, that memory is bounded and small — deep recursion (tens of thousands of calls) can blow the stack entirely, crashing with "Maximum call stack size exceeded," while the equivalent loop would run fine. This is not hypothetical: summing 1 to 100,000 recursively overflows the stack in most JavaScript engines, while the loop version does not even notice. When the depth is proportional to the size of a large input, prefer the loop.

Here are the two forms side by side so the trade is concrete. Euclid's algorithm for the greatest common divisor is a case where recursion is genuinely the clearer expression — the math *is* recursive: gcd(a, b) equals gcd(b, a mod b), bottoming out when b is 0.

\`\`\`
function gcd(a, b) {
  if (b === 0) return a;        // base case
  return gcd(b, a % b);         // and the remainder shrinks fast
}
\`\`\`

That recursion is safe because it converges in very few steps — the remainder shrinks fast, so the depth is tiny no matter how big the numbers. Contrast a flat linear sum, where recursion buys you nothing but risk. The loop is the right call:

\`\`\`
function sumArray(arr) {
  let total = 0;
  for (const n of arr) total += n;
  return total;
}
\`\`\`

The rule of thumb that working engineers actually use: **recurse when the shape of the problem is recursive and the depth is bounded or logarithmic; iterate when the work is linear or the depth could grow large with the input.** A tree that is a few dozen levels deep? Recurse — clean and safe. A linked list of a million nodes? Iterate, or you will overflow. And when you genuinely need recursion's structure but fear the depth, the professional escape hatch is to convert it to iteration with your *own* explicit stack (an array you push and pop), which moves the frames off the limited call stack and onto the heap. That technique is worth knowing exists; you will not need it today, but "I'd rewrite it iteratively with an explicit stack to avoid overflow" is a genuinely impressive thing to say in an interview.`,
      task: `Write \`gcd(a, b)\` using recursion (Euclid's algorithm: when b is 0 return a, otherwise return gcd(b, a % b)). Then write \`sumArray(arr)\` using a plain loop (no recursion) that returns the sum of the numbers in a flat array, returning 0 for an empty array.`,
      starter: `// gcd: recursive. Base case b === 0 returns a; else gcd(b, a % b).
function gcd(a, b) {
  // your code here
}

// sumArray: iterative. Loop and accumulate; no recursion.
function sumArray(arr) {
  // your code here
}
`,
      tests: [
        { name: 'gcd base case', code: `assert(gcd(7, 0) === 7, 'gcd(7, 0) should be 7 (base case), got ' + gcd(7, 0))` },
        { name: 'gcd of 48 and 36 is 12', code: `assert(gcd(48, 36) === 12, 'gcd(48, 36) should be 12, got ' + gcd(48, 36))` },
        { name: 'gcd of coprime numbers is 1', code: `assert(gcd(17, 5) === 1, 'gcd(17, 5) should be 1, got ' + gcd(17, 5))` },
        { name: 'sumArray of empty is 0', code: `assert(sumArray([]) === 0, 'sumArray([]) should be 0, got ' + sumArray([]))` },
        { name: 'sumArray sums a flat array', code: `assert(sumArray([10, 20, 30]) === 60 && sumArray([5]) === 5, 'sumArray([10,20,30]) should be 60 and sumArray([5]) should be 5')` },
      ],
      hints: [
        'gcd is naturally recursive: gcd(a, b) is a when b is 0, otherwise gcd(b, a % b). sumArray is a flat linear job — use a for loop and a running total, no recursion needed.',
        'gcd: `if (b === 0) return a; return gcd(b, a % b);`. sumArray: start total at 0, loop over the array adding each number, return total.',
        'gcd: `if (b === 0) return a; return gcd(b, a % b);`. sumArray: `let total = 0; for (const n of arr) total += n; return total;`. The modulo shrinks the numbers fast so gcd stays shallow; the loop avoids any stack growth for the linear sum.',
      ],
      solution: `function gcd(a, b) {
  if (b === 0) return a;
  return gcd(b, a % b);
}

function sumArray(arr) {
  let total = 0;
  for (const n of arr) total += n;
  return total;
}`,
      xp: 15,
    },
    {
      id: 'x1-l5',
      title: 'Capstone: Flatten & Walk a Tree',
      reading: `Time to put recursion under real load with the two tree shapes you will actually meet in production: an **arbitrarily nested array** and a **tree-shaped object**. Both are everywhere. Nested arrays fall out of grouping operations, matrix math, and messy API responses. Node-and-children objects are the literal shape of the DOM, of file systems, of comment threads, of the abstract syntax trees that compilers walk. If you can write clean recursion over both, you can walk essentially any hierarchical data a job will throw at you.

**Part one: flatten.** You will write \`flatten(arr)\`, which takes an array nested to any depth and returns a single flat array with every value in order, all nesting removed. \`flatten([1, [2, [3, [4]]]])\` becomes \`[1, 2, 3, 4]\`. The shape is the same node/leaf template from the nested-data lesson, but now instead of *summing* the leaves you are *collecting* them. Walk each item: if it is an array, flatten it (recurse) and splice those results into your output; if it is a leaf, push it directly. The elegant move is to concatenate the recursive results:

\`\`\`
function flatten(arr) {
  let result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result = result.concat(flatten(item)); // merge the flattened sub-array
    } else {
      result.push(item);                      // a leaf: keep it
    }
  }
  return result;
}
\`\`\`

Notice that \`flatten(item)\` always returns a flat array by the leap of faith, so \`concat\` just glues two flat arrays together and the whole thing stays flat at every level. This is the recursive contract made explicit: assume the smaller call already produced flat output, and your job is only to combine.

**Part two: walk a tree object.** Real trees usually are not arrays — they are objects with a value and a list of children: \`{ value: 1, children: [ {value: 2, children: []}, ... ] }\`. You will write \`treeSum(node)\` that adds up the \`value\` of a node and, recursively, every value in its \`children\`. The base case is subtle and worth savoring: a leaf node is not special-cased at all. A leaf is simply a node whose \`children\` array is empty, so the loop over its children runs zero times and the recursion stops naturally — the empty container *is* the floor. This is the same implicit-base-case elegance from before, and recognizing it is a mark of someone who genuinely understands recursion rather than pattern-matching on \`if\` statements.

\`\`\`
function treeSum(node) {
  let total = node.value;
  for (const child of node.children) {
    total += treeSum(child);  // each child is itself a full tree
  }
  return total;
}
\`\`\`

Sit with how little code this is for how much it does. \`treeSum\` correctly sums a tree that is three levels deep or thirty, balanced or lopsided, because it never reasons about the tree as a whole — it only knows how to handle *one node* and how to reach that node's children. That is decomposition in its final form: you solved an unbounded, arbitrarily-shaped problem by answering one small local question and trusting recursion to carry the answer across the entire structure. Master these two functions and you have the core skill that every DOM walker, JSON transformer, and file-tree scanner is built on. Write them both.`,
      task: `Write \`flatten(arr)\` that returns a single flat array containing every value from an arbitrarily nested array, in order. Then write \`treeSum(node)\` that returns the sum of \`node.value\` plus every value in its \`children\` (each child is itself a node with \`value\` and \`children\`). A node whose children array is empty is a leaf.`,
      starter: `// flatten: for each item, recurse into arrays and concat; push leaves.
function flatten(arr) {
  // your code here
}

// treeSum: start with node.value, then add treeSum(child) for each child.
function treeSum(node) {
  // your code here
}
`,
      tests: [
        { name: 'flatten a flat array is unchanged', code: `assert(JSON.stringify(flatten([1, 2, 3])) === JSON.stringify([1, 2, 3]), 'flatten([1,2,3]) should be [1,2,3], got ' + JSON.stringify(flatten([1, 2, 3])))` },
        { name: 'flatten deep nesting preserves order', code: `assert(JSON.stringify(flatten([1, [2, [3, [4]]], 5])) === JSON.stringify([1, 2, 3, 4, 5]), 'flatten([1,[2,[3,[4]]],5]) should be [1,2,3,4,5], got ' + JSON.stringify(flatten([1, [2, [3, [4]]], 5])))` },
        { name: 'flatten handles empties and works with strings', code: `assert(JSON.stringify(flatten([[], ['a', ['b']], [], 'c'])) === JSON.stringify(['a', 'b', 'c']), "flatten([[],['a',['b']],[],'c']) should be ['a','b','c'], got " + JSON.stringify(flatten([[], ['a', ['b']], [], 'c'])))` },
        { name: 'treeSum of a single leaf is its value', code: `assert(treeSum({ value: 42, children: [] }) === 42, 'treeSum of a lone leaf should be its value 42, got ' + treeSum({ value: 42, children: [] }))` },
        { name: 'treeSum sums a multi-level tree', code: `const tree = { value: 1, children: [ { value: 2, children: [ { value: 4, children: [] }, { value: 5, children: [] } ] }, { value: 3, children: [ { value: 6, children: [] } ] } ] }; assert(treeSum(tree) === 21, 'treeSum of the tree (1+2+3+4+5+6) should be 21, got ' + treeSum(tree))` },
      ],
      hints: [
        'Both problems are node-vs-container. flatten: an item is either a leaf (push it) or a sub-array (flatten it and merge the results in). treeSum: a node contributes its own value plus the sum of each child tree.',
        'flatten: build a result array; for each item, if Array.isArray(item) concat flatten(item), else push item. treeSum: start total at node.value, loop over node.children adding treeSum(child).',
        'flatten: `let result = []; for (const item of arr) { if (Array.isArray(item)) result = result.concat(flatten(item)); else result.push(item); } return result;`. treeSum: `let total = node.value; for (const child of node.children) total += treeSum(child); return total;`. A leaf has an empty children array, so its loop simply does not run — that is the base case.',
      ],
      solution: `function flatten(arr) {
  let result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result = result.concat(flatten(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

function treeSum(node) {
  let total = node.value;
  for (const child of node.children) {
    total += treeSum(child);
  }
  return total;
}`,
      xp: 20,
    },
  ],
};
