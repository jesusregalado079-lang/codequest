// Expert Chapter x2 — Data Structures. See ../SCHEMA.md for the shape.

export default {
  id: 'x2',
  title: 'Data Structures',
  tagline: 'The array is not the answer to every question. Choosing the right container is half of engineering.',
  badge: { name: 'Structure Selector', emoji: '🗃️' },
  intro: `Up to now you have had two containers — the array and the object — and you have used them for everything. That is fine while you are learning, the way a new cook uses one knife for every job. But there is a reason a professional kitchen has a drawer full of them. Different jobs have different shapes, and the right tool turns a clumsy task into a clean one. This chapter is about building that drawer: knowing which data structure to reach for, and *why*, so your code is both correct and fast.

Here is the mindset that separates people who "know JavaScript syntax" from people who "think like engineers": a data structure is a **contract about what is fast**. Every structure makes some operations cheap and others expensive, on purpose. An array makes "get the item at index 5" instant but "check whether this value is anywhere in here" slow. An object — used as a lookup map — makes "get the value for this key" instant but "give me everything in order" awkward. A Set makes "have I seen this before?" instant. There is no universally best structure; there is only the best structure *for the operations your problem does most*. Naming that trade-off out loud is exactly what interviewers listen for.

We are going to build up your judgment deliberately. First you will see the plain array wearing two different hats — as a **stack** (last in, first out) and as a **queue** (first in, first out) — and you will learn the performance footgun hiding in the queue: why \`shift\` is secretly slow. Then objects as **lookup maps**, the workhorse of fast key-based access, along with the sharp edges that make people reach for something better. Then the real thing: the **Map**, a purpose-built key-value structure whose keys can be anything and whose behavior is predictable. Then the **Set**, the specialist for uniqueness and membership. And finally a capstone where you build a small **LRU cache** — the kind of component that lives inside real databases and browsers — using a Map, because the Map's one quiet superpower is exactly what a cache needs.

By the end you will not just know these structures exist. You will feel the little pull toward the right one when a problem lands on your desk — "this is a lot of membership checks, that's a Set" — and that instinct is worth more than any single algorithm.`,
  lessons: [
    {
      id: 'x2-l1',
      title: 'Arrays as Stacks and Queues',
      reading: `An array is not just a list — it is a list you can restrict to get *behavior*. Two restrictions are so useful they have names: the **stack** and the **queue**. Both are just an array plus a rule about which end you add to and remove from, and that single rule changes what the structure is good for.

A **stack** is last-in-first-out (LIFO): you add and remove from the *same* end, so the most recently added item is the first one to leave. Think of a stack of plates — you put a plate on top, and the plate you take is the top one. In JavaScript you get this for free: \`push\` adds to the end, \`pop\` removes from the end. Stacks are the natural fit whenever the most recent thing is the most relevant thing: an undo history (undo the last action first), the browser's back button, matching brackets in a parser, and — as you saw last chapter — the call stack itself. When you find yourself thinking "I need to reverse something" or "I need to get back to where I most recently was," a stack is usually the shape.

A **queue** is first-in-first-out (FIFO): you add at one end and remove from the *other*, so items leave in the order they arrived, like a line at a coffee shop. In JavaScript, \`push\` adds to the end and \`shift\` removes from the *front*. Queues are the fit whenever fairness or arrival order matters: a print job queue, tasks waiting to be processed, breadth-first traversal of a tree. "Handle these in the order they came in" is the tell.

\`\`\`
const stack = [];
stack.push('a'); stack.push('b');
stack.pop();   // 'b' — the last one in, out first

const queue = [];
queue.push('a'); queue.push('b');
queue.shift(); // 'a' — the first one in, out first
\`\`\`

Now the part that separates a working engineer from someone who just memorized the methods, and it is a genuine interview favorite: **\`shift\` is slow.** \`push\` and \`pop\` operate on the *end* of the array, which is cheap — nothing else moves. But \`shift\` removes the item at index 0, and here is how the machine actually sees an array: as a numbered sequence of slots where every element's position *is* its index. Remove the front element and every remaining element has to slide down one slot — the item at index 1 becomes index 0, index 2 becomes index 1, and so on for the entire array. That is O(n) work for a single removal. Do it in a loop to drain a queue of n items and you have quietly written an O(n²) algorithm.

For small queues nobody cares. But when the array is large and you are shifting in a hot loop, this is a real performance bug that profilers catch and interviewers probe. The professional answers are worth knowing: for a serious queue you either use a real queue data structure, or keep a moving "front" index into the array instead of actually removing elements, or reach for a linked list where removing the front is O(1). The lesson is not "never use shift" — for a modest queue it is perfectly idiomatic and clear. The lesson is that you should *know* it is O(n), so that when performance matters you recognize the trap instead of stumbling into it. Knowing the cost of your operations is the whole game.`,
      task: `Write \`drainStack(items)\` that returns a new array of the items removed one at a time from a stack (last-in-first-out order) built from \`items\`. Then write \`drainQueue(items)\` that returns a new array of the items removed one at a time from a queue (first-in-first-out order). Neither function may modify the original \`items\` array.`,
      starter: `// drainStack: copy items, then repeatedly pop until empty, collecting each popped value.
function drainStack(items) {
  // your code here
}

// drainQueue: copy items, then repeatedly shift until empty, collecting each shifted value.
function drainQueue(items) {
  // your code here
}
`,
      tests: [
        { name: 'drainStack returns items in reverse (LIFO) order', code: `assert(JSON.stringify(drainStack([1, 2, 3])) === JSON.stringify([3, 2, 1]), 'drainStack([1,2,3]) should be [3,2,1] (last in, first out), got ' + JSON.stringify(drainStack([1, 2, 3])))` },
        { name: 'drainQueue returns items in arrival (FIFO) order', code: `assert(JSON.stringify(drainQueue([1, 2, 3])) === JSON.stringify([1, 2, 3]), 'drainQueue([1,2,3]) should be [1,2,3] (first in, first out), got ' + JSON.stringify(drainQueue([1, 2, 3])))` },
        { name: 'both handle the empty array', code: `assert(JSON.stringify(drainStack([])) === '[]' && JSON.stringify(drainQueue([])) === '[]', 'draining an empty array should give []')` },
        { name: 'the original array is never mutated', code: `const original = ['x', 'y', 'z']; drainStack(original); drainQueue(original); assert(JSON.stringify(original) === JSON.stringify(['x', 'y', 'z']), 'the input array must be left untouched — copy it before pop/shift')` },
        { name: 'works with strings too', code: `assert(JSON.stringify(drainStack(['a', 'b'])) === JSON.stringify(['b', 'a']) && JSON.stringify(drainQueue(['a', 'b'])) === JSON.stringify(['a', 'b']), "drainStack(['a','b']) should be ['b','a'] and drainQueue(['a','b']) should be ['a','b']")` },
      ],
      hints: [
        'A stack removes from the end (pop) so it comes out reversed; a queue removes from the front (shift) so it comes out in order. Copy the input first so you do not mutate it.',
        'Copy with `[...items]`. Then loop while the copy has length, pushing the popped (drainStack) or shifted (drainQueue) value into a result array.',
        'drainStack: `const s = [...items]; const out = []; while (s.length) out.push(s.pop()); return out;`. drainQueue: same but `out.push(s.shift())`. The spread copy protects the original; pop takes from the end (LIFO), shift takes from the front (FIFO).',
      ],
      solution: `function drainStack(items) {
  const s = [...items];
  const out = [];
  while (s.length) out.push(s.pop());
  return out;
}

function drainQueue(items) {
  const q = [...items];
  const out = [];
  while (q.length) out.push(q.shift());
  return out;
}`,
      xp: 10,
    },
    {
      id: 'x2-l2',
      title: 'Objects as Lookup Maps',
      reading: `The single most important performance idea in everyday programming is the **lookup map**: a structure where you hand it a key and it hands you back the associated value, instantly, without searching. In JavaScript the plain object has been the go-to lookup map since the beginning, and understanding why it is fast — and where it bites — is foundational.

Here is the problem it solves. Suppose you have a thousand users in an array and you need to find the one with id 852. With an array you have no choice but to walk it, checking each user until you find the match — O(n) work, a thousand comparisons in the worst case, every single time you look someone up. Now suppose instead you had an object keyed by id: \`{ 852: {...}, 401: {...}, ... }\`. Asking for \`users[852]\` gives you the answer in one step, no scanning, regardless of whether there are ten users or ten million. That is O(1) — constant time — and it is the difference between an app that feels instant and one that crawls. Whenever you catch yourself repeatedly searching an array for items by some field, the fix is almost always "build a lookup object keyed by that field first."

\`\`\`
const users = [{ id: 852, name: 'Ada' }, { id: 401, name: 'Grace' }];
const byId = {};
for (const u of users) byId[u.id] = u;   // build the index once
byId[852].name;                          // 'Ada' — instant lookup, no scan
\`\`\`

The mental model for *why* this is fast is the hash table. Under the hood, the runtime runs the key through a hash function to compute a slot number, and jumps straight to that slot. It does not compare your key against every stored key; it *computes where the answer lives*. You do not need to implement a hash table to use JavaScript, but knowing that a lookup object is a hash table underneath is what makes the O(1) claim believable rather than magical — and "how does a hash table give O(1) lookup?" is a rite-of-passage interview question.

Now the sharp edges, because plain objects as maps have several and a good engineer knows them. First, **all object keys are strings** (or Symbols). Write \`obj[852] = x\` and the key is silently coerced to the string \`"852"\`; \`obj[1]\` and \`obj["1"]\` are the same slot. Numbers-as-keys usually still work because the coercion is consistent, but you cannot use an object, an array, or a boolean as a *distinct* key — they all collapse to strings. Second, objects come with an **inherited prototype**, so keys like \`"toString"\` or \`"constructor"\` may appear to "exist" even when you never set them, which is why checking membership with \`key in obj\` can lie and people use \`Object.hasOwn(obj, key)\` instead. Third, there is **no clean size** — you cannot ask an object how many keys it has without \`Object.keys(obj).length\`, which builds a whole array to count.

None of these make objects unusable as maps — they are still the right, idiomatic choice for the common case of string keys and known-safe key names, and you will use them constantly. But each sharp edge is a reason the language eventually added a dedicated \`Map\` type, which you meet next lesson and which exists precisely to fix these. For now, internalize the core move: **turn a repeated search into a one-time index build, and your O(n)-per-lookup becomes O(1)-per-lookup.** That transformation, applied at the right moment, is one of the highest-leverage things you can do to make real code fast.`,
      task: `Write \`buildIndex(users)\` that takes an array of \`{ id, name }\` objects and returns a lookup object mapping each id to its name. Then write \`nameFor(index, id)\` that returns the name stored for \`id\`, or the string \`'unknown'\` if that id is not present in the index.`,
      starter: `// buildIndex: loop over users, set index[user.id] = user.name.
function buildIndex(users) {
  // your code here
}

// nameFor: return the stored name, or 'unknown' if the id is not a key.
function nameFor(index, id) {
  // your code here
}
`,
      tests: [
        { name: 'buildIndex maps ids to names', code: `const idx = buildIndex([{ id: 1, name: 'Ada' }, { id: 2, name: 'Grace' }]); assert(idx[1] === 'Ada' && idx[2] === 'Grace', 'buildIndex should map id 1 to Ada and id 2 to Grace')` },
        { name: 'buildIndex of empty array is an empty object', code: `assert(JSON.stringify(buildIndex([])) === '{}', 'buildIndex([]) should be {}, got ' + JSON.stringify(buildIndex([])))` },
        { name: 'nameFor finds a present id', code: `const idx = buildIndex([{ id: 7, name: 'Linus' }]); assert(nameFor(idx, 7) === 'Linus', "nameFor should return 'Linus' for id 7, got '" + nameFor(idx, 7) + "'")` },
        { name: 'nameFor returns unknown for a missing id', code: `const idx = buildIndex([{ id: 7, name: 'Linus' }]); assert(nameFor(idx, 999) === 'unknown', "nameFor for a missing id should return 'unknown', got '" + nameFor(idx, 999) + "'")` },
        { name: 'lookups are by key, not by scanning', code: `const idx = buildIndex([{ id: 10, name: 'Edsger' }, { id: 20, name: 'Barbara' }]); assert(nameFor(idx, 20) === 'Barbara' && nameFor(idx, 10) === 'Edsger', 'nameFor should return the right name for each id')` },
      ],
      hints: [
        'Build the index once by looping over users and assigning index[user.id] = user.name. Then a lookup is a single key access — no searching.',
        'For nameFor, check whether the id exists as a key. Object.hasOwn(index, id) (or index[id] !== undefined) tells you; if not present, return the string "unknown".',
        'buildIndex: `const index = {}; for (const u of users) index[u.id] = u.name; return index;`. nameFor: `return Object.hasOwn(index, id) ? index[id] : "unknown";`. Setting index[u.id] once up front is what turns per-lookup scanning into instant key access.',
      ],
      solution: `function buildIndex(users) {
  const index = {};
  for (const u of users) index[u.id] = u.name;
  return index;
}

function nameFor(index, id) {
  return Object.hasOwn(index, id) ? index[id] : 'unknown';
}`,
      xp: 10,
    },
    {
      id: 'x2-l3',
      title: 'The Map Object',
      reading: `Objects-as-maps get you a long way, but they were never *designed* to be maps — they are general-purpose objects pressed into the role, with the sharp edges you saw last lesson. JavaScript eventually shipped a purpose-built key-value structure: the **Map**. When your job is genuinely "associate keys with values," a Map is usually the cleaner, safer, more honest choice, and reaching for it fluently marks you as someone who knows the modern language.

A Map is created with \`new Map()\` and driven by a small, explicit API: \`map.set(key, value)\` stores a pair, \`map.get(key)\` retrieves a value, \`map.has(key)\` checks membership, \`map.delete(key)\` removes a pair, and \`map.size\` tells you how many pairs it holds — as a real property, no \`Object.keys\` gymnastics. That named-method API is more verbose than \`obj[key]\`, and that verbosity is the point: there is no ambiguity between "a key I stored" and "something inherited from the prototype," because a Map has no prototype keys. It starts truly empty and contains only what you put in it.

\`\`\`
const scores = new Map();
scores.set('Ada', 82);
scores.set('Grace', 97);
scores.get('Ada');     // 82
scores.has('Linus');   // false
scores.size;           // 2
\`\`\`

The Map's headline superpower is that **keys can be any type** — not just strings. A number key stays a number (\`map.set(1, 'a')\` and \`map.set('1', 'b')\` are two *different* entries, which an object could never do). You can key by an object reference, a boolean, even a function. This matters enormously when the natural key for your data is not a string: caching results by the exact object that produced them, associating metadata with DOM nodes, counting occurrences of numeric values without silent string coercion. An object throws all of that into one string bucket; a Map keeps the types distinct.

The second quiet superpower is **insertion order**. A Map remembers the order you inserted its keys and iterates them in exactly that order, every time, guaranteed by the specification. That makes Maps directly iterable in ways objects are not: \`for (const [key, value] of map)\` walks the pairs, and \`map.keys()\`, \`map.values()\`, and \`map.entries()\` give you ordered iterators. This ordering guarantee is not a minor convenience — it is the foundation the capstone's LRU cache is built on, because "which key was touched least recently" is answerable precisely *because* a Map tracks order.

So when should you pick a Map over an object? The working rule: reach for a **Map** when keys are dynamic, not known in advance, or not strings; when you add and remove entries frequently; when you need \`.size\` or clean iteration; or when the keys might collide with prototype names like \`"constructor"\`. Reach for a plain **object** when you have a fixed, known set of string keys — a config, a record, a small fixed shape — where object literal syntax is lighter and JSON serialization matters (objects stringify cleanly; Maps do not). Interviewers genuinely ask "Map or object, and why?" and the answer above — dynamic-and-any-typed keys favor Map, fixed string-keyed records favor objects — is exactly what they want to hear. Today you will build a frequency tally with a Map, the everyday task where its \`get\`/\`set\` rhythm shines.`,
      task: `Write \`tally(items)\` that returns a \`Map\` counting how many times each value appears in the \`items\` array. Keys should be the items themselves (of any type) and values their counts. An empty array returns an empty Map.`,
      starter: `// Create a new Map. For each item, set its count to the current count (or 0) plus 1.
function tally(items) {
  // your code here
}
`,
      tests: [
        { name: 'returns a Map', code: `assert(tally([]) instanceof Map, 'tally should return a Map instance')` },
        { name: 'empty array gives size 0', code: `assert(tally([]).size === 0, 'tally([]) should have size 0, got ' + tally([]).size)` },
        { name: 'counts string occurrences', code: `const t = tally(['a', 'b', 'a', 'c', 'a']); assert(t.get('a') === 3 && t.get('b') === 1 && t.get('c') === 1, "tally should count a:3, b:1, c:1")` },
        { name: 'size reflects distinct keys', code: `const t = tally(['x', 'x', 'y']); assert(t.size === 2, 'tally(["x","x","y"]) should have 2 distinct keys, got size ' + t.size)` },
        { name: 'number keys stay numbers (Map, not object coercion)', code: `const t = tally([1, 1, 2, 1]); assert(t.get(1) === 3 && t.get(2) === 1 && t.has(1) && !t.has('1'), 'tally([1,1,2,1]) should count numeric key 1 three times, and 1 (number) must be distinct from "1" (string)')` },
      ],
      hints: [
        'Create a Map with `new Map()`. For each item, read the current count with map.get(item) — which is undefined the first time — default it to 0, add 1, and store it back with map.set.',
        'Use `(map.get(item) || 0) + 1` to handle the first sighting of a value, then map.set(item, thatCount).',
        'Write `const counts = new Map(); for (const item of items) { counts.set(item, (counts.get(item) || 0) + 1); } return counts;`. Because it is a Map, the number 1 and the string "1" are different keys — an object would have merged them.',
      ],
      solution: `function tally(items) {
  const counts = new Map();
  for (const item of items) {
    counts.set(item, (counts.get(item) || 0) + 1);
  }
  return counts;
}`,
      xp: 15,
    },
    {
      id: 'x2-l4',
      title: 'The Set Object',
      reading: `Sometimes you do not care about associating keys with values — you only care about *membership*. Is this value in the collection or not? Have I seen this before? Are all of these unique? For those questions there is a specialist structure, and using anything else is doing extra work: the **Set**. A Set is a collection of values with two defining properties — every value is **unique** (adding a duplicate does nothing), and asking "is this value in here?" is **O(1)**, instant, no scanning.

You create one with \`new Set()\` and drive it with an API that mirrors the Map's: \`set.add(value)\` inserts, \`set.has(value)\` tests membership, \`set.delete(value)\` removes, and \`set.size\` counts. Notice there is no \`get\` — a Set stores values, not key-value pairs, so "getting" a value you already have to name makes no sense. The only question a Set answers is presence.

\`\`\`
const seen = new Set();
seen.add('a');
seen.add('a');       // no effect — already present
seen.has('a');       // true
seen.has('z');       // false
seen.size;           // 1
\`\`\`

The most common use is **deduplication**, and it is a one-liner that people find almost unfairly elegant. Because a Set rejects duplicates and is iterable, you can pour an array into a Set and spread it back out to get the unique values, in first-seen order: \`[...new Set(array)]\`. Compare that to the loop you would otherwise write — a result array, an inner check for whether each value is already included, a push — which, done naively with \`array.includes\`, is O(n²) because \`includes\` scans the whole result every time. The Set version is O(n) because every membership check is O(1). This is a real, measurable difference on large inputs, and "how would you remove duplicates efficiently?" is a classic interview warm-up whose expected answer is "use a Set."

That O(1) membership is the deeper reason Sets matter, beyond dedup. Any time your algorithm repeatedly asks "have I already processed this?" — detecting cycles, tracking visited nodes in a graph traversal, checking for seen values in a stream — a Set is the right tool, and swapping an \`array.includes\` check for a \`set.has\` check inside a loop can turn an O(n²) algorithm into O(n). This substitution is one of the most reliable performance upgrades in all of programming: *when you are checking membership inside a loop, the thing you are checking against should be a Set, not an array.* Burn that into your instincts.

Set operations round out the toolkit. **Intersection** (values in both of two collections) is elegant with a Set: put one collection in a Set, then filter the other by \`set.has\`. **Union** is \`new Set([...a, ...b])\`. **Difference** filters by \`!set.has\`. These mirror the mathematical set operations you may remember, and they show up constantly in real work — finding common tags, merging permission lists, computing what changed between two versions. Today you will write two of the everyday Set jobs: dedup while preserving order, and intersection using O(1) membership. Both are tiny with a Set and clumsy without one, which is precisely the point of knowing the structure exists.`,
      task: `Write \`unique(arr)\` that returns a new array of the distinct values in \`arr\`, in first-seen order, using a Set. Then write \`intersection(a, b)\` that returns a new array of the values present in both arrays \`a\` and \`b\` (using a Set for O(1) membership), with no duplicates, in the order they appear in \`a\`.`,
      starter: `// unique: a Set removes duplicates; spread it back into an array to preserve order.
function unique(arr) {
  // your code here
}

// intersection: put b in a Set, then keep the values of a that are in that set (deduped).
function intersection(a, b) {
  // your code here
}
`,
      tests: [
        { name: 'unique removes duplicates, keeps order', code: `assert(JSON.stringify(unique([3, 1, 3, 2, 1])) === JSON.stringify([3, 1, 2]), 'unique([3,1,3,2,1]) should be [3,1,2], got ' + JSON.stringify(unique([3, 1, 3, 2, 1])))` },
        { name: 'unique of empty is empty', code: `assert(JSON.stringify(unique([])) === '[]', 'unique([]) should be [], got ' + JSON.stringify(unique([])))` },
        { name: 'unique of all-distinct is unchanged', code: `assert(JSON.stringify(unique(['a', 'b', 'c'])) === JSON.stringify(['a', 'b', 'c']), "unique(['a','b','c']) should be unchanged")` },
        { name: 'intersection finds common values in a-order', code: `assert(JSON.stringify(intersection([1, 2, 3, 4], [2, 4, 6])) === JSON.stringify([2, 4]), 'intersection([1,2,3,4],[2,4,6]) should be [2,4], got ' + JSON.stringify(intersection([1, 2, 3, 4], [2, 4, 6])))` },
        { name: 'intersection has no duplicates and empties are handled', code: `assert(JSON.stringify(intersection([5, 5, 6, 6], [5, 6])) === JSON.stringify([5, 6]) && JSON.stringify(intersection([1, 2], [3, 4])) === '[]', 'intersection should dedupe results and return [] when nothing is common')` },
      ],
      hints: [
        'unique: pour the array into a Set (which drops duplicates) and spread it back into an array. intersection: build a Set from b so membership tests are O(1), then filter a by that set.',
        'unique: `[...new Set(arr)]`. For intersection, remember to also dedupe the result — filter a for values in the b-set, then run that through unique (or a second Set).',
        'unique: `return [...new Set(arr)];`. intersection: `const inB = new Set(b); return unique(a.filter(x => inB.has(x)));` — the Set makes each membership check O(1), and reusing unique removes any duplicates coming from a.',
      ],
      solution: `function unique(arr) {
  return [...new Set(arr)];
}

function intersection(a, b) {
  const inB = new Set(b);
  return unique(a.filter(x => inB.has(x)));
}`,
      xp: 15,
    },
    {
      id: 'x2-l5',
      title: 'Capstone: An LRU Cache',
      reading: `Now you build a real component — the kind that lives inside databases, browsers, and operating systems: an **LRU cache**. LRU stands for *least recently used*, and the idea is simple and everywhere. A cache is a small, fast store that remembers recent answers so you do not have to recompute or refetch them. But a cache cannot grow forever; it has a fixed capacity. When it is full and something new arrives, you must evict something — and the smartest thing to evict is the entry you have not touched in the longest time, on the bet that recently-used things are likely to be used again. That eviction policy is LRU, and implementing it well is a rite-of-passage interview question precisely because it forces you to pick the right data structure.

Your cache will be a function \`createCache(capacity)\` that returns an object with two methods: \`get(key)\` returns the stored value for a key (or \`undefined\` if absent) and marks that key as most recently used; \`put(key, value)\` stores a pair, marking it most recently used, and if that pushes the cache over capacity, evicts the least recently used entry. The whole challenge is answering "which entry is least recently used?" efficiently, and this is where the chapter's structures pay off: a **Map**, because a Map remembers insertion order and lets you find its oldest key instantly.

Here is the trick that makes it clean, and it is genuinely clever. Maintain the Map so that its iteration order *is* recency order: the front (first-inserted) key is the least recently used, the back is the most recently used. To mark a key as most recently used, you \`delete\` it and \`set\` it again — deleting removes it from its old position, and setting re-adds it at the *back*, because a Map always appends new keys. So every access moves the touched key to the back. Then eviction is trivial: the least-recently-used key is simply the first key the Map yields, which you grab with \`cache.keys().next().value\`.

\`\`\`
function createCache(capacity) {
  const store = new Map();
  return {
    get(key) {
      if (!store.has(key)) return undefined;
      const value = store.get(key);
      store.delete(key);        // pull it out of its old spot
      store.set(key, value);    // re-add at the back = most recent
      return value;
    },
    put(key, value) {
      if (store.has(key)) store.delete(key);  // refresh position if updating
      store.set(key, value);                  // most recent at the back
      if (store.size > capacity) {
        const oldest = store.keys().next().value;  // front = least recent
        store.delete(oldest);
      }
    },
  };
}
\`\`\`

Walk the eviction scenario to see it work. Make a cache of capacity 2. \`put('a', 1)\` and \`put('b', 2)\` — the Map is now \`a, b\` front-to-back. Call \`get('a')\`, which moves 'a' to the back: order is now \`b, a\`, so 'b' is the least recently used. Now \`put('c', 3)\` — that is a third entry, over capacity, so we evict the front, which is 'b'. The cache holds 'a' and 'c'; 'b' is gone, correctly, because it was the one we had not touched. That is LRU behaving exactly as designed, and it works because the Map's ordering did all the recency bookkeeping for you.

Step back and appreciate what just happened, because it is the whole chapter in one component. A naive LRU cache built on a plain object would need a separate array or timestamps to track usage order, and finding the oldest entry would mean scanning — extra state, extra bugs, worse performance. By choosing the structure whose built-in behavior (ordered keys, O(1) get/set/delete) matches the problem, the hard part evaporated. That is what "choosing the right data structure" buys you: not just speed, but *simplicity*. The code is short because the structure is right. Build it, run the eviction scenario in your head one more time, and you will have written something that real production systems run.`,
      task: `Write \`createCache(capacity)\` that returns an object with \`get(key)\` and \`put(key, value)\` methods implementing an LRU cache backed by a Map. \`get\` returns the value (or \`undefined\` if the key is absent) and marks the key most recently used. \`put\` stores the pair as most recently used and, if the cache exceeds \`capacity\`, evicts the least recently used entry.`,
      starter: `// Back the cache with a Map whose iteration order is recency order.
// Touching a key = delete then set (re-adds it at the most-recent end).
// Evict = delete the first key: cache.keys().next().value.
function createCache(capacity) {
  // return { get(key) { ... }, put(key, value) { ... } };
}
`,
      tests: [
        { name: 'get returns stored values, undefined when absent', code: `const c = createCache(2); c.put('a', 1); assert(c.get('a') === 1 && c.get('nope') === undefined, "get('a') should be 1 and get('nope') should be undefined")` },
        { name: 'put updates an existing key', code: `const c = createCache(2); c.put('a', 1); c.put('a', 99); assert(c.get('a') === 99, "putting 'a' again should update its value to 99")` },
        { name: 'evicts the least recently used when over capacity', code: `const c = createCache(2); c.put('a', 1); c.put('b', 2); c.put('c', 3); assert(c.get('a') === undefined && c.get('b') === 2 && c.get('c') === 3, "with capacity 2, adding c should evict a (the least recently used); b and c remain")` },
        { name: 'get counts as a use and protects a key from eviction', code: `const c = createCache(2); c.put('a', 1); c.put('b', 2); c.get('a'); c.put('c', 3); assert(c.get('a') === 1 && c.get('b') === undefined && c.get('c') === 3, "after get('a'), b is the least recently used, so adding c should evict b — not a")` },
        { name: 'capacity of 1 keeps only the newest', code: `const c = createCache(1); c.put('x', 10); c.put('y', 20); assert(c.get('x') === undefined && c.get('y') === 20, 'with capacity 1, putting y should evict x')` },
      ],
      hints: [
        'Back the cache with a Map and keep its iteration order equal to recency order: the first key is least recently used, the last is most recently used. Both get and put must move the touched key to the most-recent end.',
        'To mark a key most recently used, delete it from the Map and set it again — a Map appends new keys at the end. To evict, delete the first key the Map yields: `store.keys().next().value`.',
        'In get: if the key is absent return undefined; otherwise read the value, delete then re-set the key, and return the value. In put: if the key exists delete it first, then set it; if store.size > capacity, delete store.keys().next().value. That first key is always the least recently used because every touch re-adds keys at the back.',
      ],
      solution: `function createCache(capacity) {
  const store = new Map();
  return {
    get(key) {
      if (!store.has(key)) return undefined;
      const value = store.get(key);
      store.delete(key);
      store.set(key, value);
      return value;
    },
    put(key, value) {
      if (store.has(key)) store.delete(key);
      store.set(key, value);
      if (store.size > capacity) {
        const oldest = store.keys().next().value;
        store.delete(oldest);
      }
    },
  };
}`,
      xp: 20,
    },
  ],
};
