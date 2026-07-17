// Chapter 5 — Arrays & Objects. See ../SCHEMA.md for the contract.
export default {
  id: 'ch5',
  title: 'Arrays & Objects',
  tagline: 'Single values are toys. Collections are where real programs live.',
  badge: { name: 'Data Wrangler', emoji: '🗃️' },
  intro: `Everything you have written so far has juggled a handful of individual values — a number here, a string there, each with its own variable name. That works until it doesn't. A real program doesn't track one user; it tracks ten thousand. It doesn't remember one temperature reading; it remembers every reading since midnight. The moment you need to say "all of them," individual variables collapse, and you need **data structures**.

JavaScript gives you two foundational shapes, and nearly everything else in the language — and in every API you will ever call — is built by combining them. An **array** is an ordered list: things in a sequence, addressed by position. An **object** is a labeled record: named facts about one thing, addressed by key. A spreadsheet row is an object; the spreadsheet is an array of them. Learn these two shapes and how they nest, and you can read the response of any web API on Earth, because that is literally all JSON is.

This chapter also crosses the most important conceptual bridge in beginner JavaScript: the difference between a **value** and a **reference**. Numbers and strings are copied when you hand them around. Arrays and objects are not — you hand around *directions to* the data, not the data itself. More production bugs trace back to a misunderstanding of that one sentence than to almost anything else. By the end of this chapter, it will be part of how you think.`,
  lessons: [
    {
      id: 'ch5-l1',
      title: 'Arrays: Ordered Boxes in Memory',
      reading: `An array is an ordered collection of values under a single name. Instead of \`score1\`, \`score2\`, \`score3\` — a pattern that should now make you wince — you write \`const scores = [88, 92, 75]\` and get one variable that holds all of them, in order, forever willing to accept more.

You reach into an array with square brackets and a position: \`scores[0]\` is the first element, \`scores[1]\` the second. Yes — the first element is index **zero**, and this is not an arbitrary cruelty. Under the hood, an array is a starting address in memory, and the index is an *offset* from that address: "start here, move forward N slots." The first element is zero slots forward. Once you see indices as distances rather than ranks, zero-indexing stops feeling weird and starts feeling inevitable. This is genuinely how C, the language beneath nearly everything, treats arrays, and JavaScript inherited the convention.

Every array knows its own size: \`scores.length\`. Note the relationship that trips up every beginner at least once — if \`length\` is 4, the valid indices are 0 through 3. The last element is always \`scores[scores.length - 1]\`. Interviewers love off-by-one territory, and so do bug trackers; internalize this now and you will sidestep an entire genus of errors.

Arrays in JavaScript are dynamic — they grow and shrink at runtime. The two most fundamental moves operate on the *end* of the array: \`scores.push(100)\` appends an element (and returns the new length), while \`scores.pop()\` removes the last element (and returns it to you). Push and pop together give you a **stack** — last in, first out, like a stack of plates. Stacks are everywhere in computing: your browser's back button, your editor's undo history, and the "call stack" that tracks which function called which. When you eventually read a stack trace in a crash log, you are literally reading this data structure.

\`\`\`
const scores = [88, 92, 75];
scores.push(100);        // [88, 92, 75, 100]
scores.length;           // 4
scores[0];               // 88
scores[scores.length-1]; // 100
scores.pop();            // returns 100; array is [88, 92, 75] again
\`\`\`

One engineering note: \`push\` and \`pop\` *modify the array in place*. The array after a push is the same array, changed — not a new one. Hold that thought; it becomes very important two lessons from now.`,
      task: `Create an array named \`scores\` containing 88, 92, and 75 (in that order). Push 100 onto the end of it. Then store the array's length in a variable named \`count\`, and its first element in a variable named \`first\`.`,
      starter: `// Build the scores array, push 100, then read length and first element.\n`,
      tests: [
        { name: 'scores contains 88, 92, 75, 100 after the push', code: `assert(Array.isArray(scores), 'scores should be an array'); assert(JSON.stringify(scores) === '[88,92,75,100]', 'scores should be [88, 92, 75, 100] after pushing 100 — got ' + JSON.stringify(scores))` },
        { name: 'count holds the length (4)', code: `assert(count === 4, 'count should be 4 (the array length after the push), got ' + count)` },
        { name: 'first holds the first element (88)', code: `assert(first === 88, 'first should be scores[0], which is 88 — got ' + first)` },
      ],
      hints: [
        'An array literal is square brackets with comma-separated values. Adding to the end and reading a position are the two moves this lesson taught.',
        'Use `scores.push(100)` to append, `scores.length` for the size, and `scores[0]` for the first element (indices start at zero).',
        'Three statements after the array literal: `scores.push(100);` then `const count = scores.length;` then `const first = scores[0];`. Declare scores with `const scores = [88, 92, 75];` first.',
      ],
      solution: `const scores = [88, 92, 75];\nscores.push(100);\nconst count = scores.length;\nconst first = scores[0];`,
      xp: 10,
    },
    {
      id: 'ch5-l2',
      title: 'Walking the Array: The Accumulator Pattern',
      reading: `An array you can't traverse is just a box you can't open. The whole point of putting values in a sequence is to *do something to all of them*, and the tool for that is the loop you already own from Chapter 3.

The classic index-based walk pairs a counter with the array's length: \`for (let i = 0; i < temps.length; i++)\` and inside, \`temps[i]\` is the current element. Notice the condition is \`<\`, strictly less than — because valid indices stop at \`length - 1\`. When you don't need the index itself, JavaScript offers the cleaner \`for...of\` loop: \`for (const t of temps)\` hands you each element directly, no bookkeeping, no off-by-one surface area. Prefer it when position doesn't matter; reach for the indexed form when it does.

Now the pattern that turns loops into answers: the **accumulator**. You declare a variable *before* the loop to hold a running result, update it *inside* the loop on every element, and read the final answer *after*. Summing is the canonical example — start \`total\` at 0, add each element as you pass it. This before/during/after shape is not a summing trick; it is the universal template for reducing many values to one, and you will meet its formalized version (\`reduce\`) in Chapter 7.

\`\`\`
let total = 0;
for (const t of temps) {
  total = total + t;   // or: total += t
}
// after the loop, total holds the sum
\`\`\`

Finding the maximum uses the same skeleton with one subtle decision: what do you *seed* the accumulator with? Seeding \`hottest = 0\` looks fine until someone hands you an array of sub-zero winter temperatures and your "maximum" is a zero that never appeared in the data. The robust choices are to seed with the array's own first element, or with \`-Infinity\`, the value every real number beats. Inside the loop: \`if (t > hottest) hottest = t;\`. This seed-value question — "what's the identity element for my operation?" — is exactly the kind of edge-case thinking interviewers probe for, and the kind that separates code that works on the demo data from code that works.

One more habit worth building now: loops that *read* an array shouldn't *change* it. Compute your sum and your max into fresh variables and leave \`temps\` exactly as you found it. Functions and loops that quietly mutate their inputs are a leading source of "it worked yesterday" bugs in shared codebases.`,
      task: `The starter gives you a \`temps\` array. Using a loop (any kind), compute the sum of all elements into a variable named \`total\` and the largest element into a variable named \`hottest\`. Do not modify \`temps\`.`,
      starter: `const temps = [18, 21, 25, 19, 30, 22];\n\n// Walk the array: total = sum of all temps, hottest = the maximum.\n`,
      tests: [
        { name: 'total is the sum of all temps (135)', code: `assert(total === 135, 'total should be 135 (18+21+25+19+30+22), got ' + total)` },
        { name: 'hottest is the maximum temp (30)', code: `assert(hottest === 30, 'hottest should be 30, the largest value in temps — got ' + hottest)` },
        { name: 'temps was not modified', code: `assert(JSON.stringify(temps) === '[18,21,25,19,30,22]', 'temps should be left unchanged by your loop — got ' + JSON.stringify(temps))` },
      ],
      hints: [
        'This is the accumulator pattern twice: declare a result variable before the loop, update it on every element, read it after.',
        'Use `let total = 0` and add each element with `total += t`. For the max, seed `let hottest = temps[0]` (or -Infinity) and inside the loop: `if (t > hottest) hottest = t`.',
        'One loop handles both: `let total = 0; let hottest = temps[0]; for (const t of temps) { total += t; if (t > hottest) hottest = t; }` — declare both with let, since they change.',
      ],
      solution: `const temps = [18, 21, 25, 19, 30, 22];\nlet total = 0;\nlet hottest = temps[0];\nfor (const t of temps) {\n  total += t;\n  if (t > hottest) hottest = t;\n}`,
      xp: 10,
    },
    {
      id: 'ch5-l3',
      title: 'Objects: Records With Named Fields',
      reading: `Arrays answer "which one?" — objects answer "what about it?" An **object** is a collection of key–value pairs: named facts describing a single thing. Where an array is a numbered shelf, an object is a labeled filing cabinet.

\`\`\`
const book = {
  title: 'Dune',
  pages: 412,
  available: true,
};
\`\`\`

Each \`key: value\` pair is a **property**. Keys are strings (even when you don't quote them); values can be anything — numbers, strings, booleans, arrays, other objects. This shape has a proper computer-science name: a *record*. When a database hands you a row, when an API hands you a user, when a config file describes your server — you are looking at a record, and in JavaScript, records are objects.

There are two ways to read a property, and knowing when each is *required* matters. **Dot notation** — \`book.pages\` — is the everyday form: terse, readable, what you'll write 95% of the time. **Bracket notation** — \`book['pages']\` — takes a string expression, and that flexibility is its whole point. When the key lives in a variable, dots physically cannot express it: \`book.key\` looks up a property literally named "key". \`book[key]\` evaluates the variable and looks up *that*. Brackets are also mandatory for keys that aren't valid identifiers, like \`data['content-type']\` — a dot would choke on the hyphen.

\`\`\`
const key = 'pages';
book.pages;    // 412 — the literal property "pages"
book[key];     // 412 — whatever string key holds, looked up dynamically
book.key;      // undefined — there is no property literally named "key"
\`\`\`

That last line deserves a beat: reading a property that doesn't exist is not an error in JavaScript. It quietly returns \`undefined\`, and the crash comes *later*, when you try to use that undefined as if it were real. Half the "Cannot read properties of undefined" errors clogging production logs worldwide start exactly here. Cultivate mild paranoia about whether a property actually exists.

Writing is symmetric with reading: \`book.pages = 500\` updates a property, and assigning to a key that doesn't exist *creates* it. Under the hood, JavaScript engines like V8 optimize objects with stable, predictable shapes ("hidden classes"), which is one reason experienced developers create objects with all their properties up front rather than bolting them on one by one. You don't need to act on that yet — but it's a nice early glimpse of how your source code and the machine's view of it are two different things.`,
      task: `Create an object named \`book\` with three properties: \`title\` set to 'Dune', \`pages\` set to 412, and \`available\` set to true. Then, using **bracket notation with the provided \`key\` variable**, read the pages property into a variable named \`pageCount\`.`,
      starter: `const key = 'pages';\n\n// Create the book object, then use book[key] to read pageCount.\n`,
      tests: [
        { name: 'book has the right title, pages, and available', code: `assert(typeof book === 'object' && book !== null, 'book should be an object'); assert(book.title === 'Dune', "book.title should be 'Dune', got " + JSON.stringify(book.title)); assert(book.pages === 412, 'book.pages should be the number 412, got ' + book.pages); assert(book.available === true, 'book.available should be the boolean true')` },
        { name: 'pageCount was read via the key variable (412)', code: `assert(pageCount === 412, 'pageCount should be 412, read with book[key] — got ' + pageCount)` },
      ],
      hints: [
        'An object literal is curly braces with key: value pairs separated by commas. Reading with a variable key is what bracket notation exists for.',
        "Build it as `const book = { title: 'Dune', pages: 412, available: true };`. Then read with brackets: the key variable already holds the string 'pages'.",
        "Two statements: the object literal above, then `const pageCount = book[key];` — note it's `book[key]` (the variable), not `book['key']` (a string) and not `book.key`.",
      ],
      solution: `const key = 'pages';\nconst book = {\n  title: 'Dune',\n  pages: 412,\n  available: true,\n};\nconst pageCount = book[key];`,
      xp: 10,
    },
    {
      id: 'ch5-l4',
      title: 'References: The Arrow in Memory',
      reading: `This is the lesson that separates people who *use* JavaScript from people who *understand* it. It answers a question that sounds philosophical but is brutally practical: when you assign a variable to another variable, what actually moves?

For **primitives** — numbers, strings, booleans — the answer is: the value itself is copied. \`let a = 5; let b = a; b = 10;\` leaves \`a\` untouched at 5. Two variables, two independent values. No surprises.

For **arrays and objects**, the answer changes completely. The variable does not hold the array — it holds a **reference**: an arrow pointing at where the array lives in memory. \`const alias = original\` copies *the arrow*, not the data. Now two variables point at one array, and a \`push\` through either one is visible through both, because there was only ever one array. This is not a quirk; it's a deliberate design shared by Java, Python, and most modern languages, because copying a million-element array every time you pass it to a function would be ruinously slow. Passing an arrow is free.

\`\`\`
const original = [1, 2, 3];
const alias = original;   // copies the arrow — same array
alias.push(4);
original;                 // [1, 2, 3, 4]  (!)
alias === original;       // true — identical arrows
\`\`\`

This also finally explains a Chapter 1 mystery: how can you \`push\` onto a \`const\` array? Because \`const\` freezes the *variable*, not the *value*. It promises the arrow will never be redirected to a different array — it promises nothing about the contents at the arrow's tip. **Mutation** (changing the data in place: \`push\`, \`pop\`, \`obj.x = 5\`) and **reassignment** (pointing the variable somewhere new: \`arr = [9, 9]\`) are different operations, and \`const\` only forbids the second.

When you genuinely want an independent copy, you must ask for one explicitly. \`original.slice()\` with no arguments returns a fresh array with the same elements, and the spread syntax \`[...original]\` does the same. Now mutations to the copy leave the original alone — and \`copy === original\` is \`false\`, because \`===\` on arrays and objects compares *arrows*, never contents. Two identical-looking arrays are still two arrays. (That is exactly why these lessons compare with \`JSON.stringify\` — to compare contents, you compare their text.)

One caveat to file away: \`slice\` and spread make a **shallow** copy — one level deep. If the array contains objects, the copy contains the same arrows to the same objects. Deep copying is its own topic (\`structuredClone\` exists for it). In real codebases, the accidental-shared-reference bug is a rite of passage: two features mysteriously corrupting each other's data because someone copied an arrow thinking they copied an array. Interviewers ask about this constantly — "what does this print?" with an aliased mutation — because it cleanly reveals whether your mental model matches the machine's.`,
      task: `The starter gives you \`original\`. Create \`alias\` referring to the **same** array, and \`copy\` as an **independent** copy of it. Then push 4 onto \`alias\` — which should change \`original\` too, but leave \`copy\` untouched.`,
      starter: `const original = [1, 2, 3];\n\n// alias: same array. copy: independent duplicate. Then push 4 onto alias.\n`,
      tests: [
        { name: 'pushing through alias changed original (shared reference)', code: `assert(JSON.stringify(original) === '[1,2,3,4]', 'original should be [1,2,3,4] — pushing onto alias must affect it, because they are the same array. Got ' + JSON.stringify(original))` },
        { name: 'alias and original are the same array', code: `assert(alias === original, 'alias === original should be true: assignment copies the reference, so both variables must point at the one array')` },
        { name: 'copy is independent and still [1,2,3]', code: `assert(JSON.stringify(copy) === '[1,2,3]', 'copy should still be [1,2,3] — a real copy is unaffected by the push. Got ' + JSON.stringify(copy)); assert(copy !== original, 'copy !== original should be true: slice() or [...original] creates a genuinely new array')` },
      ],
      hints: [
        'One of the two new variables should copy the arrow (plain assignment); the other should build a brand-new array with the same contents.',
        'The alias is just `const alias = original;`. The copy needs `original.slice()` or `[...original]`. Make the copy BEFORE pushing, or it will contain the 4.',
        'Order matters: `const alias = original;` then `const copy = original.slice();` then `alias.push(4);`. If you push first, your copy inherits the 4 and the third test fails.',
      ],
      solution: `const original = [1, 2, 3];\nconst alias = original;\nconst copy = original.slice();\nalias.push(4);`,
      xp: 15,
    },
    {
      id: 'ch5-l5',
      title: 'Nesting & Destructuring: The Shape of Real Data',
      reading: `Here is a professional secret hiding in plain sight: almost every piece of data your career will hand you arrives in one shape — **an array of objects**. A list of things, where each thing is a record. Users from a database. Products in a cart. Commits in a repository. Rows from a CSV. When a web API responds, its JSON payload is overwhelmingly some variation of \`[ { ... }, { ... }, { ... } ]\`. Master this one shape and you can read the internet.

\`\`\`
const users = [
  { name: 'Ada',   role: 'admin'  },
  { name: 'Linus', role: 'member' },
];
\`\`\`

Access chains left to right, one hop per bracket or dot: \`users[0]\` is the first record, \`users[0].name\` is \`'Ada'\`. Read chains like a file path — each step drills one level deeper. When a chain blows up with "Cannot read properties of undefined", debug it the same way: walk the chain hop by hop and find the first link that came back \`undefined\`. The error is never where it *crashed*; it's where the chain first broke.

Pulling several properties out of a record is so common that the language grew dedicated syntax for it: **destructuring**. Instead of two assignment lines, you write a pattern shaped like the object, and JavaScript unpacks it: \`const { name, role } = users[0];\` creates two variables in one statement. When you want your variables named differently than the properties — and you often will, to avoid collisions or improve clarity — add a rename with a colon: \`const { name: firstName, role: firstRole } = users[0];\`. Read \`name: firstName\` as "take the property \`name\`, put it in a variable called \`firstName\`."

\`\`\`
const { name: firstName, role: firstRole } = users[0];
firstName;  // 'Ada'
firstRole;  // 'admin'
\`\`\`

Destructuring is not decoration; in modern codebases it's the *default* idiom. You will see it at the top of nearly every React component (\`const { user, onSave } = props\`), in function parameters (\`function greet({ name })\`), and in imports. Arrays destructure too, by position: \`const [first, second] = list;\`. Writing it fluently is part of reading modern JavaScript fluently.

The second essential skill with arrays-of-objects is **deriving new arrays** from them: walking the records and collecting one field from each. A \`roles\` list extracted from \`users\` is a projection — database people would literally call it that, as in \`SELECT role FROM users\`. For now, build it with the loop-and-push pattern: start with an empty array, push \`user.role\` for each user. In Chapter 7, \`map\` will collapse that whole loop into one line — and it will feel earned, because you'll know exactly what it's doing underneath.`,
      task: `Using destructuring with renaming on \`users[0]\`, create \`firstName\` and \`firstRole\` from its \`name\` and \`role\` properties. Then build an array named \`roles\` containing every user's role, in order.`,
      starter: `const users = [\n  { name: 'Ada',   role: 'admin'  },\n  { name: 'Linus', role: 'member' },\n];\n\n// Destructure users[0] into firstName / firstRole, then collect all roles.\n`,
      tests: [
        { name: "firstName is 'Ada'", code: `assert(firstName === 'Ada', "firstName should be 'Ada' (the name of users[0], renamed via destructuring) — got " + JSON.stringify(firstName))` },
        { name: "firstRole is 'admin'", code: `assert(firstRole === 'admin', "firstRole should be 'admin' — got " + JSON.stringify(firstRole))` },
        { name: 'roles collects every role in order', code: `assert(JSON.stringify(roles) === '["admin","member"]', 'roles should be ["admin","member"] — one role per user, in order. Got ' + JSON.stringify(roles))` },
      ],
      hints: [
        'The destructuring pattern mirrors the object shape, and a colon inside it renames. The roles array is the accumulator pattern with push.',
        'Renaming looks like `const { name: firstName, role: firstRole } = users[0];`. For roles: start with `const roles = [];` and loop over users pushing each `.role`.',
        'Full walkthrough: destructure as in hint 2, then `const roles = []; for (const u of users) { roles.push(u.role); }` — note roles can be const because push mutates, it never reassigns.',
      ],
      solution: `const users = [\n  { name: 'Ada',   role: 'admin'  },\n  { name: 'Linus', role: 'member' },\n];\nconst { name: firstName, role: firstRole } = users[0];\nconst roles = [];\nfor (const u of users) {\n  roles.push(u.role);\n}`,
      xp: 15,
    },
    {
      id: 'ch5-l6',
      title: 'Capstone: The Inventory Ledger',
      reading: `Time to assemble the whole chapter into something that looks like work you'd get paid for. You're building the core of an inventory system: an array of item records and three functions that operate on it. This is the exact anatomy of countless real modules — a data shape plus a small API of functions that know how to read and update it. Strip the styling off any point-of-sale system, warehouse tracker, or game inventory and this skeleton is what remains.

Each item is a record: \`{ name: 'keyboard', price: 45, qty: 2 }\`. Your three functions:

- \`totalValue(items)\` — the worth of everything on the shelves: the sum of \`price * qty\` across all items. Pure accumulator pattern, with a multiplication inside the loop.
- \`findItem(items, name)\` — walk the array and return the **first item object** whose \`name\` matches. If nothing matches, return \`null\`. This is linear search, the most fundamental algorithm there is, and note the contract detail: you return the *object itself* (an arrow to it!), not a copy and not its name.
- \`restock(items, name, amount)\` — find the matching item and **mutate** it, adding \`amount\` to its \`qty\`. Return the \`items\` array.

Two design points deserve engineer-level attention. First, the \`null\` return. A function that "finds" things must decide what to do about *not* finding them, and returning \`null\` is the classic contract: it forces callers to consider the empty case. (Tony Hoare, who invented null references, called them his "billion-dollar mistake" — not because null returns are wrong, but because forgetting to check them crashes programs. Be the person who checks.) Inside \`restock\`, that means guarding: only mutate if the find succeeded.

Second, notice that \`restock\` is deliberately a **mutator** — it reaches through the reference and changes the shared data, exactly the behavior you studied in the references lesson, now used *on purpose*. And here's the payoff of that lesson: \`restock\` doesn't need its own search loop. It can call \`findItem\`, and because \`findItem\` returns a reference to the live object, incrementing \`found.qty\` updates the array itself. Functions building on functions, references doing the plumbing — that's the whole game.

A note on order of operations as you build: write \`totalValue\` first and convince yourself it works, then \`findItem\`, then let \`restock\` stand on \`findItem\`'s shoulders. Building and verifying one small piece at a time is not beginner training wheels; it is precisely how experienced engineers stay fast. The alternative — writing all three, running once, and staring at a wall of failures — has a name in the trade: debugging everything at once, also known as debugging nothing.`,
      task: `Write three functions: \`totalValue(items)\` returning the sum of \`price * qty\` over all items; \`findItem(items, name)\` returning the first item object whose name matches, or \`null\` if none does; and \`restock(items, name, amount)\` which adds \`amount\` to the matching item's \`qty\` and returns the items array.`,
      starter: `const inventory = [\n  { name: 'keyboard', price: 45,  qty: 2  },\n  { name: 'monitor',  price: 220, qty: 1  },\n  { name: 'cable',    price: 8,   qty: 10 },\n];\n\n// totalValue(items), findItem(items, name), restock(items, name, amount)\n`,
      tests: [
        { name: 'totalValue sums price × qty across all items', code: `{ const tv_items = [ { name: 'keyboard', price: 45, qty: 2 }, { name: 'monitor', price: 220, qty: 1 }, { name: 'cable', price: 8, qty: 10 } ]; const tv = totalValue(tv_items); assert(tv === 390, 'totalValue should be 390 (45*2 + 220*1 + 8*10), got ' + tv); }` },
        { name: 'findItem returns the matching item object', code: `{ const fi_items = [ { name: 'keyboard', price: 45, qty: 2 }, { name: 'monitor', price: 220, qty: 1 } ]; const found = findItem(fi_items, 'monitor'); assert(found !== null && found !== undefined, 'findItem should find monitor'); assert(found.price === 220, 'findItem should return the item OBJECT (found.price should be 220), not just its name'); assert(found === fi_items[1], 'findItem should return a reference to the item in the array, not a copy'); }` },
        { name: 'findItem returns null when nothing matches', code: `{ const nf_items = [ { name: 'keyboard', price: 45, qty: 2 } ]; assert(findItem(nf_items, 'ghost') === null, "findItem should return null (not undefined) for a name that isn't in the list"); }` },
        { name: 'restock mutates the matching item and returns the array', code: `{ const rs_items = [ { name: 'cable', price: 8, qty: 10 } ]; const result = restock(rs_items, 'cable', 5); assert(rs_items[0].qty === 15, 'restock should add the amount in place: qty should go 10 -> 15, got ' + rs_items[0].qty); assert(result === rs_items, 'restock should return the same items array it was given'); }` },
      ],
      hints: [
        'Three separate small functions. totalValue is the accumulator pattern; findItem is a loop with an early return; restock can reuse findItem and mutate through the returned reference.',
        'findItem: `for (const item of items) { if (item.name === name) return item; } return null;` — the return null AFTER the loop is what handles the not-found case.',
        'restock in three lines: `const found = findItem(items, name); if (found) found.qty += amount; return items;`. totalValue: seed `let sum = 0`, add `item.price * item.qty` each pass, return sum.',
      ],
      solution: `const inventory = [\n  { name: 'keyboard', price: 45,  qty: 2  },\n  { name: 'monitor',  price: 220, qty: 1  },\n  { name: 'cable',    price: 8,   qty: 10 },\n];\n\nfunction totalValue(items) {\n  let sum = 0;\n  for (const item of items) {\n    sum += item.price * item.qty;\n  }\n  return sum;\n}\n\nfunction findItem(items, name) {\n  for (const item of items) {\n    if (item.name === name) return item;\n  }\n  return null;\n}\n\nfunction restock(items, name, amount) {\n  const found = findItem(items, name);\n  if (found) found.qty += amount;\n  return items;\n}`,
      xp: 20,
    },
  ],
};
