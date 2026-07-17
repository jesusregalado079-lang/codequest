// Chapter 1 — Values & Variables. See ../SCHEMA.md for the contract.

export default {
  id: 'ch1',
  title: 'Values & Variables',
  tagline: 'Everything a program does, it does to values. Learn what they are and how to hold them.',
  badge: { name: 'Variable Wrangler', emoji: '🧮' },
  intro: `Every program you will ever write — a game engine, a trading bot, the firmware in a pacemaker — reduces to the same two moves: it takes values and it transforms them into other values. That's it. The entire discipline of software engineering is learning to do those two moves with precision, at scale, without losing your mind.

This chapter is about the first move. You'll learn what a value actually *is* to the machine, the handful of types JavaScript sorts values into, and how to attach names to values so you can refer to them later. Names are more important than they look: a running program can juggle millions of values at once, and the only way humans stay oriented in that storm is by naming things well.

None of this is busywork before the "real" material. Interviewers probe these exact fundamentals because a shaky mental model here produces bugs everywhere else — a senior engineer who is fuzzy on \`const\` versus \`let\`, or on why \`typeof null\` lies to you, is a senior engineer who ships subtle breakage. Get the foundation load-bearing now and every later chapter gets easier.

Read each lesson fully before touching the editor. The readings are the course; the exercises just prove to both of us that the ideas landed.`,
  lessons: [
    {
      id: 'ch1-l1',
      title: 'Values: The Atoms of Computation',
      reading: `Strip away the frameworks, the syntax, the ceremony, and a computer does exactly one thing: it manipulates values. A value is a single, concrete piece of data — the number \`42\`, the text \`'Hello, world'\`, the answer \`true\`. When your banking app shows a balance, that balance is a value. When a game renders your position on screen, your x and y coordinates are values. Programs are value-processing machines, and everything else you will learn is machinery for producing, combining, and routing values.

Down at the metal, every value is a pattern of bits — voltages in silicon that we agree to read as ones and zeros. The number \`42\` is stored as a binary pattern; the string \`'Hello'\` is a sequence of numbers, one per character, that the display layer knows how to draw as glyphs. You don't need to think in binary to write JavaScript, but knowing that *everything bottoms out in bits* demystifies a lot: types, which we cover next lesson, are really just agreements about how to interpret a bit pattern.

When you write a value directly into your code — \`42\`, \`'Hello, world'\`, \`true\` — that's called a **literal**. You're literally spelling the value out. Most values in a real program aren't literals, though; they're computed, fetched, or received from a user. Literals are the seeds; computation grows everything else from them.

A value on its own is useless if you can't refer to it again. That's what a **variable** is: a name bound to a value. In JavaScript you create one with the \`const\` keyword:

\`\`\`
const answer = 42;
\`\`\`

Read that line the way the machine does, right to left: evaluate the thing on the right of \`=\` (here, just the literal \`42\`), then bind the name \`answer\` to it. From that line onward, writing \`answer\` anywhere in your program means \`42\`. The \`=\` sign is *not* the mathematical "equals" — it's an action, an assignment. Mathematicians state facts; programmers issue instructions.

One more tool, and it's the one you'll use constantly: \`console.log(...)\` prints a value so you can see it. Professional engineers — all of them, at every level — use logging every single day to inspect what their program is actually doing, as opposed to what they *believe* it's doing. Those two things disagree more often than anyone likes to admit, and \`console.log\` is the cheapest lie detector ever built:

\`\`\`
const answer = 42;
console.log(answer);   // prints 42
\`\`\`

An engineer-mindset note before you write your first line: the gap between "I think this code does X" and "I verified this code does X" is where every bug lives. Starting today, cultivate the habit of checking. Log the value. Look at it. Trust output, not intention.`,
      task: `Create a constant named \`answer\` holding the number 42, and a constant named \`greeting\` holding the string 'Hello, world'. Then log \`greeting\` to the console.`,
      starter: '// Your first values.\n// 1) const answer = the number 42\n// 2) const greeting = the string \'Hello, world\'\n// 3) log greeting\n',
      tests: [
        { name: 'answer is the number 42', code: "assert(typeof answer === 'number' && answer === 42, 'answer should be a const bound to the number 42 (no quotes — quotes would make it a string)')" },
        { name: 'greeting is the right string', code: "assert(typeof greeting === 'string' && greeting === 'Hello, world', \"greeting should be exactly the string 'Hello, world' — check spelling, the comma, and capitalization\")" },
      ],
      hints: [
        'You need two bindings: one name attached to a number value, one attached to a string value. Numbers are written bare; strings go inside quotes.',
        "Use the const keyword twice: `const answer = 42;` is the first. For the second, the value is text, so wrap it in quotes: 'Hello, world'. Then call console.log with the greeting name.",
        "Three lines total. Line 1: `const answer = 42;`. Line 2: `const greeting = 'Hello, world';`. Line 3: `console.log(greeting);` — pass the name, not a new string.",
      ],
      solution: "const answer = 42;\nconst greeting = 'Hello, world';\nconsole.log(greeting);",
      xp: 10,
    },
    {
      id: 'ch1-l2',
      title: 'The Type of a Thing',
      reading: `Not all values are alike. \`42\` and \`'42'\` look like cousins, but to the machine they're different species: one is a number you can do arithmetic with, the other is a two-character piece of text. The category a value belongs to is its **type**, and the type determines what operations make sense. You can divide a number by 2; dividing the text \`'hello'\` by 2 is nonsense, and the type system is how the language knows the difference.

JavaScript's core primitive types are a short list, and you should know it cold:

- \`number\` — all numbers: \`42\`, \`-3\`, \`7.5\`. Unusually, JavaScript has just *one* number type; there's no separate integer type like many languages have. Every number is a 64-bit floating-point value under the hood.
- \`string\` — text of any length, from \`''\` (empty) to an entire novel, written in quotes.
- \`boolean\` — exactly two values exist: \`true\` and \`false\`. The entire next chapter is built on these.
- \`undefined\` — the value of a name that was declared but never given anything. It means "nothing here, and nobody ever set it."
- \`null\` — also "nothing," but *deliberate*. A programmer writes \`null\` on purpose to say "this is intentionally empty."

The undefined/null split trips people up, so here's the mental model: \`undefined\` is the empty lot nobody has touched; \`null\` is a lot where someone deliberately posted a sign saying "nothing goes here." The language produces \`undefined\` on its own; \`null\` only appears because a human put it there. Real codebases use \`null\` to mean things like "this user has no middle name — we checked."

You can ask any value its type with the \`typeof\` operator:

\`\`\`
typeof 42          // 'number'
typeof 'hello'     // 'string'
typeof true        // 'boolean'
typeof undefined   // 'undefined'
typeof null        // 'object'  ← wait, what?
\`\`\`

That last line is not a typo. \`typeof null\` returns \`'object'\` because of a bug in the very first JavaScript engine in 1995 — and it can never be fixed, because millions of existing websites now depend on the broken behavior. This is your first taste of a deep engineering truth: **backwards compatibility outweighs correctness**. Once enough of the world depends on a mistake, the mistake becomes the specification. Interviewers love asking about \`typeof null\`; now you know both the answer and the story behind it.

JavaScript is a **dynamically typed** language: types belong to *values*, not to variable names, and the checking happens while the program runs rather than before. A name that holds a number now could hold a string later. That flexibility is why JavaScript is fast to write — and why professional teams overwhelmingly adopt TypeScript, which adds compile-time type checking on top. You'll appreciate why once you've been bitten by a string sneaking into a slot where you assumed a number lived. For now, the discipline to build: *always know the type of every value you're working with.* Engineers who track types in their heads write dramatically fewer bugs than engineers who hope for the best.`,
      task: `Declare four constants: \`mass\` holding the number 7.5, \`unit\` holding the string 'kg', \`verified\` holding the boolean true, and \`middleName\` deliberately set to null.`,
      starter: '// One value of each type: number, string, boolean, and a deliberate null.\n',
      tests: [
        { name: 'mass is a number', code: "assert(typeof mass === 'number' && mass === 7.5, 'mass should be the number 7.5 — written bare, with no quotes')" },
        { name: 'unit is a string', code: "assert(typeof unit === 'string' && unit === 'kg', \"unit should be the string 'kg' — text needs quotes\")" },
        { name: 'verified is a boolean', code: "assert(verified === true && typeof verified === 'boolean', \"verified should be the boolean true — the bare keyword, not the string 'true'\")" },
        { name: 'middleName is deliberately null', code: "assert(middleName === null, 'middleName should be null — the keyword null, meaning intentionally empty')" },
      ],
      hints: [
        'Four const declarations, one per line. The reading lists exactly which kind of literal each type uses: bare digits, quotes, the true/false keywords, or the null keyword.',
        "Numbers and booleans are written without quotes: `const mass = 7.5;` and `const verified = true;`. Strings need them: `const unit = 'kg';`. For null, write the keyword itself.",
        "The full shape: `const mass = 7.5;` then `const unit = 'kg';` then `const verified = true;` then `const middleName = null;`. The classic mistake is quoting true or null — 'true' is a string, true is a boolean.",
      ],
      solution: "const mass = 7.5;\nconst unit = 'kg';\nconst verified = true;\nconst middleName = null;",
      xp: 10,
    },
    {
      id: 'ch1-l3',
      title: 'const, let, and the Ghost of var',
      reading: `You've been writing \`const\`, which creates a binding that cannot be re-assigned. Try to point \`answer\` at a different value later and the program throws an error and stops. That sounds restrictive. It is — deliberately, and the restriction is a gift.

Here's why. When you read someone else's code (and professional programming is mostly *reading* code — estimates run around ten lines read for every line written), every \`const\` is a promise: *this name means the same thing for its entire life.* You can see its value once and trust it everywhere. A re-assignable variable offers no such promise; to know its current value you have to trace every line that might have touched it. Multiply that across a 50,000-line codebase and you understand why modern JavaScript style says: **default to \`const\`, reach for \`let\` only when you genuinely need re-assignment.**

And sometimes you genuinely do. A counter that climbs, a running total, a status that changes as work progresses — these are values whose whole point is to change. For them, use \`let\`:

\`\`\`
let attemptCount = 0;
attemptCount = 1;      // fine — let permits re-assignment
attemptCount = 2;      // still fine
\`\`\`

Notice the re-assignment lines have no keyword. \`let\` appears once, at *declaration* — the moment the name comes into existence. After that, a bare \`name = value\` re-assigns it. Declaring the same name twice is an error; the name already exists.

Now the ghost story. Older code is full of a third keyword, \`var\`. It was the *only* way to declare variables for JavaScript's first twenty years, and it has two behaviors that generated countless bugs: \`var\` declarations are "hoisted" (silently teleported to the top of their function, so you can reference a variable before the line that creates it and get \`undefined\` instead of an honest error), and \`var\` ignores block boundaries like the inside of an \`if\` or a loop, leaking names into places they shouldn't exist. \`let\` and \`const\` were introduced in 2015 specifically to fix both problems. The rule for you is one line long: **never write \`var\`.** You must still *recognize* it — you'll meet it in old tutorials, Stack Overflow answers, and legacy codebases, and "what's the difference between var, let, and const?" is one of the most common JavaScript interview questions in existence — but in your own code it's \`const\` first, \`let\` when needed, \`var\` never.

While we're on declarations, let's talk about the names themselves, because naming is famously one of the two hard problems in computer science (the joke goes: cache invalidation, naming things, and off-by-one errors). JavaScript convention is **camelCase**: first word lowercase, each following word capitalized — \`maxRetries\`, \`attemptCount\`, \`userEmailAddress\`. Names can't start with a digit and can't contain spaces or hyphens.

The convention is the easy part. The hard part is choosing names that carry meaning. \`maxRetries\` tells a reader everything; \`mr\` or \`x\` tells them nothing and forces them to reverse-engineer your intent from surrounding code. A useful test: could a teammate who has never seen this file guess what the variable holds from its name alone? In real code review, vague names get flagged as readily as actual bugs, because a misleading name *causes* future bugs. You're not naming for the computer — the computer would be happy with \`x\` — you're naming for the next human, and the next human is usually you, six months from now, at 2am, hunting something broken.`,
      task: `Declare a constant \`maxRetries\` set to 3. Then declare a variable \`attemptCount\` with \`let\`, starting at 0, and on a following line re-assign it to 1.`,
      starter: '// A fixed limit (never changes) and a counter (changes).\n// Declare maxRetries with const, attemptCount with let starting at 0,\n// then re-assign attemptCount to 1 on its own line.\n',
      tests: [
        { name: 'maxRetries is 3', code: "assert(maxRetries === 3, 'maxRetries should be a const holding the number 3')" },
        { name: 'attemptCount ends up at 1', code: "assert(attemptCount === 1, 'attemptCount should start at 0 and then be re-assigned to 1 — after your code runs it should hold 1')" },
      ],
      hints: [
        'Two different keywords for two different jobs: the value that never changes gets const, the value that changes gets let. The change itself is a third line with no keyword at all.',
        'Line 1: declare maxRetries with const. Line 2: `let attemptCount = 0;`. Line 3: re-assign with just the name — `attemptCount = 1;` — no let, because the name already exists.',
        'Exactly: `const maxRetries = 3;` then `let attemptCount = 0;` then `attemptCount = 1;`. If you wrote let twice you’ll get a "already declared" error; if you used const for attemptCount, the re-assignment will throw.',
      ],
      solution: 'const maxRetries = 3;\nlet attemptCount = 0;\nattemptCount = 1;',
      xp: 10,
    },
    {
      id: 'ch1-l4',
      title: 'Expressions vs Statements',
      reading: `Here's a distinction that sounds academic and turns out to organize everything: JavaScript code is made of **expressions** and **statements**, and they are not the same thing.

An **expression** is any piece of code that *evaluates to a value*. \`42\` is an expression (it evaluates to itself). \`price * quantity\` is an expression. \`'Hello, ' + name\` is an expression. The test is simple: if you could put it on the right side of an \`=\` sign, or hand it to \`console.log\`, it's an expression. Expressions are the *nouns* of your program — they name values, possibly values that need computing first.

A **statement** is an instruction that *does something*: declare this variable, run this block, stop this loop. \`const total = price * quantity;\` is a statement — the whole line performs the action of creating a binding. Statements are the *verbs*. Notice how the two nest: that statement has the expression \`price * quantity\` embedded inside it. Programs are statements strung together, with expressions embedded in them doing the actual value-work.

Watch how the machine evaluates a compound expression — it reduces, step by step, inner pieces first, until one value remains:

\`\`\`
subtotal * (1 + taxRate)
subtotal * (1 + 0.08)     // taxRate looked up
subtotal * 1.08           // parentheses resolved
59.97 * 1.08              // subtotal looked up
64.77                     // one value. done.
\`\`\`

Every expression, no matter how sprawling, reduces to exactly one value. Internalize that reduction dance and you can read any expression ever written — you just replay the machine's steps in your head. Debugging is largely this: re-running the reduction manually to find where your expectation and reality diverge.

The arithmetic operators are the ones you know — \`+\`, \`-\`, \`*\`, \`/\` — plus one that's new to most people and shows up everywhere in real code: \`%\`, the **remainder operator** (often called modulo). \`17 % 5\` asks "divide 17 by 5; what's left over?" — answer \`2\`. It looks niche, but it's the standard tool for "is this number even?" (\`n % 2 === 0\`), for wrapping values around a range (cycling through days of the week, positions in a circular buffer), and for a dozen other patterns you'll meet. Operator precedence follows math class — \`*\` and \`/\` bind before \`+\` and \`-\` — but the professional habit is to add parentheses whenever there's *any* room for a reader to hesitate. Parentheses are free; a misread formula in a pricing calculation is not.

One honest caveat about JavaScript numbers, since you'll notice it soon anyway: because every number is binary floating-point, some decimal values can't be represented exactly, which is why \`0.1 + 0.2\` famously prints \`0.30000000000000004\`. It's not a JavaScript bug — it's the same trade-off nearly every language makes, and it's why financial systems count in integer cents rather than fractional dollars. File that away; it will show up in an interview someday, and the phrase "floating-point representation" will make you sound like you've been doing this for years.`,
      task: `Using the starter values, compute \`subtotal\` (price times quantity), declare \`taxRate\` as 0.08, compute \`total\` (subtotal times 1 plus the tax rate), and compute \`remainder\` as 17 % 5.`,
      starter: 'const price = 19.99;\nconst quantity = 3;\n// 1) const subtotal = price times quantity\n// 2) const taxRate = 0.08\n// 3) const total = subtotal times (1 + taxRate)\n// 4) const remainder = 17 % 5\n',
      tests: [
        { name: 'subtotal is price × quantity', code: "assert(typeof subtotal === 'number' && Math.abs(subtotal - 59.97) < 1e-9, 'subtotal should be price * quantity (about 59.97) — use the variable names, not retyped numbers')" },
        { name: 'total applies the tax rate', code: "assert(typeof total === 'number' && Math.abs(total - 64.7676) < 1e-9, 'total should be subtotal * (1 + taxRate) — about 64.7676. Check your parentheses: 1 + taxRate must happen before the multiply')" },
        { name: 'remainder uses the % operator', code: "assert(remainder === 2, 'remainder should be 17 % 5, which is 2 — the leftover after dividing 17 by 5')" },
      ],
      hints: [
        'Each line is a const declaration whose right-hand side is an expression the machine will reduce to one value. Build on earlier names: total is computed from subtotal, not from raw numbers.',
        'Multiplication is *, and you need parentheses in the total so the addition happens first: subtotal * (1 + taxRate). For the last one, % gives the remainder of a division.',
        'Four lines: `const subtotal = price * quantity;` then `const taxRate = 0.08;` then `const total = subtotal * (1 + taxRate);` then `const remainder = 17 % 5;`. If total comes out wrong, you likely dropped the parentheses — without them, subtotal * 1 happens first.',
      ],
      solution: 'const price = 19.99;\nconst quantity = 3;\nconst subtotal = price * quantity;\nconst taxRate = 0.08;\nconst total = subtotal * (1 + taxRate);\nconst remainder = 17 % 5;',
      xp: 10,
    },
    {
      id: 'ch1-l5',
      title: 'Strings and Template Literals',
      reading: `Text is the most human-facing type a program handles — every label, error message, username, and URL is a string — so JavaScript gives strings serious machinery. Time to learn it properly.

A **string** is an ordered sequence of characters. Under the hood each character is a number (a Unicode code point), which is why the machine can compare, sort, and measure text: it's doing arithmetic on the numbers underneath. You can write string literals with single quotes \`'like this'\` or double quotes \`"like this"\` — they're identical in meaning; pick one and be consistent (this course uses single). If your text *contains* a quote character, either use the other kind of quote around it, or escape it with a backslash: \`'it\\'s fine'\`.

Strings come with built-in capabilities. The one you'll use immediately is \`.length\`, which tells you how many characters a string holds:

\`\`\`
const name = 'Ada';
console.log(name.length);   // 3
\`\`\`

That dot syntax — value, dot, capability — is called **property access**, and it's one of the most common motions in all of JavaScript. Chapter 6 tours the deep catalog of string methods (searching, slicing, changing case); for now, \`.length\` is your first taste of asking a value about itself.

Strings are also **immutable**: once created, a string never changes. Every operation that seems to modify one actually manufactures a brand-new string and leaves the original untouched. This surprises people, but it's a feature — immutable values can be shared freely across a program with zero risk that some distant code mutates your text out from under you. You'll find that experienced engineers *prefer* immutable data generally, for exactly this reason: things that can't change can't change *unexpectedly*.

The workhorse operation is combining strings with other values. The old way uses \`+\`:

\`\`\`
const first = 'Ada';
const last = 'Lovelace';
const intro = 'My name is ' + first + ' ' + last + '.';
\`\`\`

It works, but look at it: quote, plus, quote, plus — every seam is a spot to forget a space or drop a period, and with five or six pieces it becomes genuinely hard to see what the output will look like. Modern JavaScript has a far better tool: the **template literal**. Use backticks (the backtick key, just above Tab) instead of quotes, and embed any expression directly inside the string with \`\${...}\`:

\`\`\`
const intro = \`My name is \${first} \${last}.\`;
\`\`\`

Read that and you can *see* the final sentence — the structure of the output is right there in the source, with live values dropped into slots. And the slots take any expression, not just names: \`\${price * quantity}\` computes inline. Template literals also allow real line breaks inside the backticks, which ordinary quotes forbid. In modern professional codebases, template literals are the default for any string with moving parts; you'll essentially never see production code gluing more than two pieces together with \`+\`. This isn't just fashion — it's the readability principle again. The version of a string that looks like its own output is the version whose bugs you can spot by eye.`,
      task: `Using the starter names, build \`fullName\` with a template literal combining first and last with a space between, build \`intro\` as the exact sentence "My name is Ada Lovelace." using a template literal, and set \`nameLength\` to the length of fullName.`,
      starter: "const first = 'Ada';\nconst last = 'Lovelace';\n// 1) const fullName = template literal: first, a space, last\n// 2) const intro = template literal: My name is <fullName>.\n// 3) const nameLength = fullName's length\n",
      tests: [
        { name: 'fullName combines both names', code: "assert(fullName === 'Ada Lovelace', \"fullName should be 'Ada Lovelace' — first name, one space, last name. Check for a missing or doubled space\")" },
        { name: 'intro is the exact sentence', code: "assert(intro === 'My name is Ada Lovelace.', \"intro should be exactly 'My name is Ada Lovelace.' — including the final period. Embed fullName rather than retyping the names\")" },
        { name: 'nameLength counts the characters', code: "assert(nameLength === 12, \"nameLength should be fullName.length — 'Ada Lovelace' has 12 characters (the space counts)\")" },
      ],
      hints: [
        'Template literals use backticks, not quotes, and drop values into the text with ${name}. The length of a string comes from asking the string itself, with dot syntax.',
        'fullName is `${first} ${last}` inside backticks — note the literal space between the two slots. intro embeds ${fullName} inside the sentence. nameLength is fullName.length (no parentheses — length is a property, not a call).',
        'Three lines: const fullName = `${first} ${last}`; then const intro = `My name is ${fullName}.`; then const nameLength = fullName.length;. If intro fails, compare character by character — the usual culprits are the trailing period and the spaces.',
      ],
      solution: "const first = 'Ada';\nconst last = 'Lovelace';\nconst fullName = `${first} ${last}`;\nconst intro = `My name is ${fullName}.`;\nconst nameLength = fullName.length;",
      xp: 10,
    },
    {
      id: 'ch1-l6',
      title: 'Capstone: The Status Report',
      reading: `Time to put the whole chapter under one roof. Capstones in this course simulate the texture of real work: several small requirements, each easy alone, that you must compose into one coherent piece of code. That composition step — holding multiple bindings in your head, feeding one computed value into the next — is the actual skill of programming. Syntax is trivia; composition is craft.

The scenario: you operate a small fleet of servers, and you need a one-line status report for a dashboard. This is a deeply realistic exercise — an enormous fraction of professional code is exactly this shape. Take raw operational numbers, derive the metrics humans actually care about, and format them into something readable. Monitoring dashboards, log lines, alert messages, admin panels: derive, then format, over and over.

You're given three raw facts as constants: a server's name, its uptime in hours, and how many requests it has handled. From these you'll derive two metrics — uptime in days, and requests per hour — then record a status, then assemble the report string.

Two engineering notes as you work. First, notice the choice you'll make between \`const\` and \`let\`. The derived metrics are pure calculations from fixed inputs — once computed, they have no reason to change, so they're \`const\`. The status, though, is the kind of value that a real monitoring system would update as conditions change — healthy now, degraded later — so we'll declare it with \`let\` even though this small program never re-assigns it. Choosing a declaration keyword based on the *meaning* of the value, not just what this particular script happens to do, is exactly the kind of intent-signaling that separates code that reads well from code that merely runs.

Second, note the build order: raw inputs at the top, derived values in the middle, formatted output at the end. Data flows downward, each line consuming names defined above it. This top-to-bottom dataflow shape is how you want most code to read — a pipeline, not a tangle. When code instead jumps around, defining things far from where they're used, readers suffer. You're forming the good habit on line four of your career; some engineers never form it at all.

The report must come out *exactly* as specified — \`atlas-01 is healthy: 42000 requests in 168.5 hours\` — and that exactness is also realistic. Formatted output feeds into other systems: log parsers, alerting rules, tests like the ones grading you now. In real work, an extra space in a log line can break a downstream regex three teams away. Precision in formatting is not pedantry; it's a contract. Template literals are how you'll honor it — build the sentence so the source visibly mirrors the output, and the bugs have nowhere to hide.`,
      task: `Derive \`uptimeDays\` (uptimeHours ÷ 24) and \`requestsPerHour\` (requestsHandled ÷ uptimeHours) as constants. Declare \`status\` with let, set to 'healthy'. Then build \`report\` with a template literal so it reads exactly: atlas-01 is healthy: 42000 requests in 168.5 hours`,
      starter: "const serverName = 'atlas-01';\nconst uptimeHours = 168.5;\nconst requestsHandled = 42000;\n// 1) const uptimeDays — hours divided by 24\n// 2) const requestsPerHour — requests divided by hours\n// 3) let status = 'healthy'\n// 4) const report — template literal: <serverName> is <status>: <requestsHandled> requests in <uptimeHours> hours\n",
      tests: [
        { name: 'uptimeDays is derived from uptimeHours', code: "assert(typeof uptimeDays === 'number' && Math.abs(uptimeDays - 168.5 / 24) < 1e-9, 'uptimeDays should be uptimeHours / 24 — about 7.02. Divide the variable, don\\'t retype the number')" },
        { name: 'requestsPerHour is derived correctly', code: "assert(typeof requestsPerHour === 'number' && Math.abs(requestsPerHour - 42000 / 168.5) < 1e-9, 'requestsPerHour should be requestsHandled / uptimeHours — about 249.26')" },
        { name: 'status is the string healthy', code: "assert(status === 'healthy', \"status should be the string 'healthy' (declared with let — it represents a value that would change in a real system)\")" },
        { name: 'report matches the exact format', code: "assert(report === 'atlas-01 is healthy: 42000 requests in 168.5 hours', 'report should be exactly: atlas-01 is healthy: 42000 requests in 168.5 hours — build it with a template literal embedding serverName, status, requestsHandled, and uptimeHours; check spaces and the colon')" },
      ],
      hints: [
        'Follow the pipeline shape from the reading: derive the two metrics with division first, then the status, then assemble the report from the names — the report line should contain no retyped data at all.',
        'uptimeDays is uptimeHours / 24; requestsPerHour is requestsHandled / uptimeHours; status uses let. The report is one template literal with four ${} slots: `${serverName} is ${status}: ${requestsHandled} requests in ${uptimeHours} hours`.',
        "Four lines: `const uptimeDays = uptimeHours / 24;` — `const requestsPerHour = requestsHandled / uptimeHours;` — `let status = 'healthy';` — then build report as one template literal with the four ${} slots in order: serverName, status, requestsHandled, uptimeHours. If the report test fails, compare your string to the target character by character: the colon after status and the single spaces are the usual failures.",
      ],
      solution: "const serverName = 'atlas-01';\nconst uptimeHours = 168.5;\nconst requestsHandled = 42000;\nconst uptimeDays = uptimeHours / 24;\nconst requestsPerHour = requestsHandled / uptimeHours;\nlet status = 'healthy';\nconst report = `${serverName} is ${status}: ${requestsHandled} requests in ${uptimeHours} hours`;",
      xp: 20,
    },
  ],
};
