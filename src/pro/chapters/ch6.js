// Chapter 6 — Working With Text & Data. See ../SCHEMA.md for the contract.
export default {
  id: 'ch6',
  title: 'Working With Text & Data',
  tagline: 'Logs, CSVs, JSON, user input — the world speaks text. Learn to listen.',
  badge: { name: 'Text Alchemist', emoji: '🔤' },
  intro: `Ask a working engineer what they actually manipulate all day and the honest answer is rarely "algorithms." It's **text**. Log files that need a timestamp pulled out. Spreadsheet exports that need parsing. API responses arriving as JSON. Usernames with trailing spaces that break your login check. Text is the universal interface between programs, between systems, and between software and humans — and fluency with it is one of the most bankable everyday skills in this profession.

This chapter is that fluency course. You'll learn the core string methods — the knife-block of tools like \`slice\`, \`split\`, \`trim\`, and \`includes\` — then how to *build* strings elegantly with template literals, instead of gluing fragments together with plus signs like it's 2009. From there we go bidirectional: tearing structured text apart into data you can compute with (parsing), and flattening data back into text (formatting and serializing), including JSON, the format that carries most of the internet's data traffic.

The chapter ends where real jobs begin: a data-cleaning capstone. Survey after survey of working data engineers says the same thing — the majority of the job isn't clever analysis, it's cleaning messy input into a trustworthy shape. Blank lines, stray whitespace, inconsistent capitalization: turning that sludge into clean records is unglamorous, essential, and after this chapter, yours.`,
  lessons: [
    {
      id: 'ch6-l1',
      title: 'The String Toolbelt',
      reading: `A string looks like a single value, but it behaves like something richer: an object bristling with built-in methods, each one a small text-processing tool. Type a dot after any string in a modern editor and dozens of them appear. This lesson covers the four you'll reach for most.

First, a fact that shapes everything else: **strings are immutable**. No string method ever changes the string it's called on — each one manufactures and returns a *new* string, leaving the original untouched. \`name.toUpperCase()\` does not shout-ify \`name\`; it hands you a shouting copy, and if you don't store the return value, it evaporates. The single most common string bug among beginners is calling a method and ignoring its return, then wondering why nothing changed. Contrast this with last chapter: \`push\` mutates its array, but no string method mutates its string. (Why immutable? It lets engines share and optimize strings aggressively, and it means no function can vandalize a string you handed it — the same reference-safety issue from Chapter 5, solved by construction.)

Now the tools. \`trim()\` removes whitespace from both ends — spaces, tabs, newlines — and touches nothing in the middle. It is the first thing sane systems do to user input, because humans copy-paste trailing spaces constantly, and \`'ada '\` does not equal \`'ada'\`. Real login systems trim (and usually lowercase) usernames before comparing; systems that forget generate support tickets titled "correct password not working."

\`toUpperCase()\` and its twin \`toLowerCase()\` do what they say. Their quiet superpower is **normalization**: to compare text case-insensitively, you don't write forty comparisons — you lowercase both sides once and compare. \`slice(start, end)\` extracts a substring: from index \`start\` up to *but not including* \`end\` — the same zero-indexed, exclusive-end convention as everywhere else, which conveniently means \`slice(0, 3)\` is "the first three characters." Finally \`includes(fragment)\` answers a yes/no question — does this string contain that one? — returning a boolean, ready to drop straight into an \`if\`.

\`\`\`
const raw = '   Ada Lovelace   ';
raw.trim();                    // 'Ada Lovelace'
raw.trim().toUpperCase();      // 'ADA LOVELACE'
raw.trim().slice(0, 3);        // 'Ada'
raw.trim().includes('Love');   // true
\`\`\`

Notice the second line: methods **chain**. Because each method returns a new string, you can call the next method directly on the result, reading left to right like a pipeline: trim it, then uppercase it. Chaining is idiomatic JavaScript — you'll see five-method chains in production code — and it works precisely *because* of immutability: every link in the chain gets a fresh value and harms nothing upstream.`,
      task: `The starter gives you \`raw\`. Create four variables: \`cleaned\` (raw with the whitespace trimmed), \`shout\` (cleaned in all caps), \`firstName\` (the first three characters of cleaned, via slice), and \`hasLove\` (a boolean: does cleaned contain 'Love'?).`,
      starter: `const raw = '   Ada Lovelace   ';\n\n// cleaned, shout, firstName, hasLove\n`,
      tests: [
        { name: 'cleaned is trimmed', code: `assert(cleaned === 'Ada Lovelace', "cleaned should be 'Ada Lovelace' with no leading/trailing spaces — got " + JSON.stringify(cleaned))` },
        { name: 'shout is cleaned in all caps', code: `assert(shout === 'ADA LOVELACE', "shout should be 'ADA LOVELACE' — got " + JSON.stringify(shout))` },
        { name: 'firstName is the first three characters', code: `assert(firstName === 'Ada', "firstName should be 'Ada' (cleaned.slice(0, 3)) — got " + JSON.stringify(firstName))` },
        { name: "hasLove is true (cleaned contains 'Love')", code: `assert(hasLove === true, "hasLove should be the boolean true — use includes, which returns a boolean. Got " + JSON.stringify(hasLove))` },
      ],
      hints: [
        'Each variable is one method call, and every method RETURNS a new string — store each result. Build cleaned first; the other three all start from cleaned.',
        "The four methods, in order: trim(), toUpperCase(), slice(0, 3), includes('Love'). All but the first are called on cleaned, not on raw.",
        "Four lines: `const cleaned = raw.trim();` then `const shout = cleaned.toUpperCase();` then `const firstName = cleaned.slice(0, 3);` then `const hasLove = cleaned.includes('Love');`.",
      ],
      solution: `const raw = '   Ada Lovelace   ';\nconst cleaned = raw.trim();\nconst shout = cleaned.toUpperCase();\nconst firstName = cleaned.slice(0, 3);\nconst hasLove = cleaned.includes('Love');`,
      xp: 10,
    },
    {
      id: 'ch6-l2',
      title: 'Split, Join, and Pad: Strings ↔ Arrays',
      reading: `Last chapter you learned to command arrays; this lesson connects that power to text. The bridge is a pair of inverse methods: \`split\` turns a string into an array, and \`join\` turns an array back into a string. Together they form one of the most-used round trips in all of programming.

\`str.split(separator)\` cuts the string at every occurrence of the separator and returns the pieces as an array — the separator itself is consumed by the cut. \`'usr/local/bin/node'.split('/')\` yields \`['usr', 'local', 'bin', 'node']\`. Suddenly text has structure: it has a \`.length\`, it can be indexed, looped over, filtered. The idiom \`parts[parts.length - 1]\` — "the last piece" — is how you grab a filename off a path, a TLD off a domain, an extension off a filename. You will type some variant of it hundreds of times in your career.

\`arr.join(separator)\` is the exact inverse: it concatenates the elements with the separator *between* each pair (never at the ends). Split on one delimiter, join on another, and you've built a translator: \`path.split('/').join(' > ')\` turns a file path into a breadcrumb trail. This split–transform–join pipeline is the backbone of a thousand small text utilities — and it's worth knowing that \`split\`/\`join\` exist in nearly identical form in Python, Ruby, and Java, so you're learning a cross-language idea, not a JavaScript quirk.

\`\`\`
const path = 'usr/local/bin/node';
const parts = path.split('/');    // ['usr', 'local', 'bin', 'node']
parts[parts.length - 1];          // 'node'
parts.join(' > ');                // 'usr > local > bin > node'
\`\`\`

The third tool is about *shape*: \`padStart(targetLength, padChar)\` prepends the pad character until the string reaches the target length — and does nothing if it's already long enough. Its classic job is fixed-width identifiers: invoice \`'42'\` becomes \`'00042'\`, so every ID is five characters and columns line up. One subtlety with teeth: \`padStart\` is a *string* method, so a number must be converted first — \`String(42).padStart(5, '0')\`. Calling it on a raw number throws. Getting comfortable with these explicit type hops — number to string here, string to number in two lessons — is part of the discipline this chapter builds.

Why does zero-padding matter beyond looks? Because text sorts *alphabetically*, and alphabetically \`'9'\` comes after \`'10'\` (compare first characters: 9 > 1). Padded to \`'09'\` and \`'10'\`, alphabetical order and numeric order agree again. Every time you've seen files named \`track01.mp3\`, \`track02.mp3\`, you've seen an engineer who knew this — and every time you've seen a file list ordered 1, 10, 11, 2, 3, you've seen one who didn't.`,
      task: `The starter gives you \`path\`. Create \`parts\` (the path split on '/'), \`last\` (the final element of parts), \`breadcrumb\` (parts joined with ' > '), and \`id\` (the number 42 as a string, zero-padded to 5 characters with padStart).`,
      starter: `const path = 'usr/local/bin/node';\n\n// parts, last, breadcrumb, and id (42 padded to '00042')\n`,
      tests: [
        { name: 'parts is the path split on /', code: `assert(JSON.stringify(parts) === '["usr","local","bin","node"]', 'parts should be ["usr","local","bin","node"] — got ' + JSON.stringify(parts))` },
        { name: 'last is the final segment', code: `assert(last === 'node', "last should be 'node' — grab parts[parts.length - 1]. Got " + JSON.stringify(last))` },
        { name: "breadcrumb joins with ' > '", code: `assert(breadcrumb === 'usr > local > bin > node', "breadcrumb should be 'usr > local > bin > node' — got " + JSON.stringify(breadcrumb))` },
        { name: "id is '00042'", code: `assert(id === '00042', "id should be the string '00042': convert 42 with String(42), then padStart(5, '0'). Got " + JSON.stringify(id))` },
      ],
      hints: [
        'split gives you an array, join takes you back to a string, and padStart only exists on strings — so 42 needs converting first.',
        "`path.split('/')` for parts; the last element is at index length - 1; `parts.join(' > ')` for the breadcrumb; `String(42).padStart(5, '0')` for the id.",
        "Four lines: `const parts = path.split('/');` `const last = parts[parts.length - 1];` `const breadcrumb = parts.join(' > ');` `const id = String(42).padStart(5, '0');`.",
      ],
      solution: `const path = 'usr/local/bin/node';\nconst parts = path.split('/');\nconst last = parts[parts.length - 1];\nconst breadcrumb = parts.join(' > ');\nconst id = String(42).padStart(5, '0');`,
      xp: 10,
    },
    {
      id: 'ch6-l3',
      title: 'Template Literals: Building Strings Like a Professional',
      reading: `So far you've torn strings apart; now let's build them. The old way — gluing fragments with \`+\` — technically works: \`'Welcome back, ' + name + '! You have ' + unread + ' unread messages.'\`. It also has everything wrong with it: quotes opening and closing like saloon doors, plus signs to miscount, spaces that vanish at the seams. Concatenation code is write-only — easy to produce, miserable to read back.

Modern JavaScript replaces it with **template literals**: strings delimited by backticks (\` \`\` \`) instead of quotes, with two superpowers. The first is **interpolation**: inside a template literal, \`\${expression}\` evaluates the expression and splices the result into the string, right where it appears. The string reads like its own output:

\`\`\`
function greet(user) {
  return \`Welcome back, \${user.name}! You have \${user.unread} unread messages.\`;
}
greet({ name: 'Ada', unread: 3 });
// 'Welcome back, Ada! You have 3 unread messages.'
\`\`\`

Note what goes inside the braces: any **expression** — not just variable names. Property access (\`\${user.name}\`), arithmetic (\`\${price * qty}\`), method calls (\`\${name.toUpperCase()}\`), even a ternary (\`\${count === 1 ? 'message' : 'messages'}\`) all work, because JavaScript simply evaluates whatever's there and converts the result to text. A rule of taste from real codebases: keep the embedded expressions *short*. The moment logic gets interesting, compute it into a well-named variable above the template and interpolate the variable — the template stays legible, the logic stays debuggable.

The second superpower is **multi-line strings**: a template literal can contain actual line breaks, and they're preserved verbatim. Building an email body, a report, or an error message used to mean chaining \`+ '\\n' +\` fragments; now you just... write the text, shaped the way it will print. Combined with interpolation, template literals are how modern JavaScript generates nearly all human-facing text.

An engineer's aside on where this shows up: every log line worth reading — the template-literal version of \`log('user ' + id + ' failed login from ' + ip)\` — most error messages, and — as you've maybe noticed — the failure messages in this course's own tests. Writing messages that interpolate the *actual values* involved ("expected 4, got 7") rather than vague complaints ("wrong value") is a small habit with outsized payoff: your future self, debugging at some unfortunate hour, gets the evidence right in the log line. One boundary to respect, though: when you're tempted to build HTML by interpolating user input into a template, stop — that path leads to injection attacks (XSS). Template literals build *text* safely; building *code or markup* from untrusted input is a different problem with different tools.`,
      task: `Write a function \`greet(user)\` that takes an object with \`name\` and \`unread\` properties and returns the string: Welcome back, NAME! You have N unread messages. — built with a template literal.`,
      starter: `// greet({ name: 'Ada', unread: 3 })\n//   -> 'Welcome back, Ada! You have 3 unread messages.'\n\n`,
      tests: [
        { name: 'greets Ada with 3 unread', code: `{ const g1 = greet({ name: 'Ada', unread: 3 }); assert(g1 === 'Welcome back, Ada! You have 3 unread messages.', "expected 'Welcome back, Ada! You have 3 unread messages.' but got " + JSON.stringify(g1)); }` },
        { name: 'works for a different user (no hard-coding)', code: `{ const g2 = greet({ name: 'Linus', unread: 0 }); assert(g2 === 'Welcome back, Linus! You have 0 unread messages.', 'greet must interpolate its argument, not hard-code Ada — got ' + JSON.stringify(g2)); }` },
        { name: 'returns a string', code: `assert(typeof greet({ name: 'X', unread: 1 }) === 'string', 'greet should RETURN a string (not console.log it)')` },
      ],
      hints: [
        "A template literal uses backticks, and ${...} drops an expression's value into the string. The user's fields are user.name and user.unread.",
        'The whole function body is one return statement: a backtick string containing ${user.name} and ${user.unread} at the right spots.',
        "`function greet(user) { return \\`Welcome back, \\${user.name}! You have \\${user.unread} unread messages.\\`; }` — check punctuation exactly: comma after back, exclamation after the name, period at the end.",
      ],
      solution: `function greet(user) {\n  return \`Welcome back, \${user.name}! You have \${user.unread} unread messages.\`;\n}`,
      xp: 10,
    },
    {
      id: 'ch6-l4',
      title: 'Parsing: Turning Lines Into Data',
      reading: `Here is a scenario so common it's practically the job description: someone hands you a file where each line is a record with fields separated by commas — \`'ada, mechanical engines, 1843'\` — and you need real data out of it. Name as a string, year as a *number*, whitespace gone. Converting structured text into structured data is called **parsing**, and this lesson builds your first real parser.

The pipeline has three stages, and it's worth naming them because you'll reuse the shape forever: **split, clean, convert**. Split the line on its delimiter to get raw fields. Clean each field — for CSV-ish data, that means \`trim\`, because humans and export tools scatter spaces around commas with total abandon. Convert fields that aren't really text into their true types — \`Number(text)\` for numerics. Then assemble the results into an object with named properties, because \`record.year\` is self-documenting and \`parts[2]\` is a trap for whoever reads the code next.

\`\`\`
function parseRecord(line) {
  const parts = line.split(',');
  return {
    name: parts[0].trim(),
    field: parts[1].trim(),
    year: Number(parts[2].trim()),
  };
}
\`\`\`

The conversion step deserves respect, because this is a genuine bug factory. \`split\` always yields strings, so without \`Number()\`, your \`year\` is \`'1843'\` — and JavaScript will cheerfully let you compute \`'1843' + 1\` and hand you \`'18431'\`, a string with a 1 stapled on, no error, no warning. This silent string-arithmetic failure is a rite of passage; an interviewer who shows you \`'2' + 2\` is testing exactly this. The defensive habit: the moment data crosses from text into your program, convert it to its real type, *at the boundary*, once — everything downstream can then trust the shape. (If the text isn't numeric, \`Number\` returns \`NaN\`, which you can detect with \`Number.isNaN\` — that's how real parsers reject garbage input rather than propagate it.)

A candid engineering note: real CSV is nastier than this — quoted fields containing commas, escaped quotes, headers, ragged rows — which is why production code uses a battle-tested CSV library instead of \`split(',')\`. But the *shape* you're learning (split, clean, convert, name the fields) is exactly what those libraries do inside, and for the simple delimited formats you'll constantly improvise around — log lines, config strings, \`key=value\` pairs — this hand-rolled pipeline is the genuinely correct tool. Knowing when \`split\` is enough and when it isn't: that, too, is engineering judgment.`,
      task: `Write a function \`parseRecord(line)\` that takes a comma-separated line with three fields — name, field, year — and returns an object \`{ name, field, year }\` with each field trimmed and \`year\` converted to a number.`,
      starter: `// parseRecord('ada, mechanical engines, 1843')\n//   -> { name: 'ada', field: 'mechanical engines', year: 1843 }\n\n`,
      tests: [
        { name: 'parses a clean line into a record', code: `{ const r1 = parseRecord('ada,mechanical engines,1843'); assert(JSON.stringify(r1) === '{"name":"ada","field":"mechanical engines","year":1843}', 'expected {name:"ada", field:"mechanical engines", year:1843} — got ' + JSON.stringify(r1)); }` },
        { name: 'trims whitespace around every field', code: `{ const r2 = parseRecord('  grace ,  compilers , 1952  '); assert(r2.name === 'grace' && r2.field === 'compilers', 'each field should be trimmed: name ' + JSON.stringify(r2.name) + ', field ' + JSON.stringify(r2.field)); assert(r2.year === 1952, 'year should be 1952 even with spaces around it, got ' + JSON.stringify(r2.year)); }` },
        { name: 'year is a number, not a string', code: `{ const r3 = parseRecord('alan,computability,1936'); assert(typeof r3.year === 'number', "year must be converted with Number() — typeof gave '" + typeof r3.year + "'. Without conversion, year + 1 would be '19361'!"); }` },
      ],
      hints: [
        "The pipeline is split, clean, convert: split the line on ',', trim each piece, and pass the year through Number() before putting it in the object.",
        "`const parts = line.split(',')` gives three strings at parts[0..2]. Trim each with .trim(); the year needs `Number(parts[2].trim())`.",
        'Return an object literal directly: `return { name: parts[0].trim(), field: parts[1].trim(), year: Number(parts[2].trim()) };` — the whole function is two statements.',
      ],
      solution: `function parseRecord(line) {\n  const parts = line.split(',');\n  return {\n    name: parts[0].trim(),\n    field: parts[1].trim(),\n    year: Number(parts[2].trim()),\n  };\n}`,
      xp: 15,
    },
    {
      id: 'ch6-l5',
      title: 'JSON: Data as Text',
      reading: `You now know that programs hold data as arrays and objects, and exchange it as text. So there must be a bridge — a standard way to write an object *down* as a string, and to resurrect it later. That bridge is **JSON** (JavaScript Object Notation), and it is not an exaggeration to call it the data format of the modern world. API responses, config files, \`package.json\`, the localStorage under this very app — JSON, all of it. Even non-JavaScript systems — Python services, Rust tools, your bank's backend — speak it, because it won the format wars through sheer simplicity.

JSON text looks almost exactly like the object literals you've been writing, with a stricter dress code: property names *must* be double-quoted, strings *must* use double quotes, and there are no comments, no trailing commas, no functions. \`'{"user":"ada","logins":42,"active":true}'\` is a complete JSON document. The stakes: it's a *string*. You cannot ask a string for \`.logins\`; you'd get \`undefined\`, because strings have characters, not properties.

The conversion pair lives on the built-in \`JSON\` object. \`JSON.parse(text)\` reads JSON text and constructs the real, living object it describes — this is **deserialization**. \`JSON.stringify(value)\` does the reverse, flattening an object or array into its text form — **serialization**. They are inverses, and the round trip \`JSON.parse(JSON.stringify(obj))\` reproduces the data (a trick sometimes abused for deep copying, before \`structuredClone\` existed).

\`\`\`
const payload = '{"user":"ada","logins":42,"active":true}';
const config = JSON.parse(payload);   // now a real object
config.logins;                        // 42 — a real number, math-ready
const saved = JSON.stringify({ user: config.user, logins: config.logins + 1 });
// '{"user":"ada","logins":43}'
\`\`\`

Study the shape of that example, because it is the life cycle of essentially all persisted data: text arrives, \`parse\` inflates it into objects, your program does its work in object-land, \`stringify\` flattens the result back to text for storage or transmission. Parse at the boundary, work with real data, stringify at the boundary — the same "convert at the edges" discipline as the last lesson, at ecosystem scale.

Two professional footnotes. First, \`JSON.parse\` on malformed text doesn't limp along — it *throws* an exception, which is genuinely good: better a loud failure at the boundary than corrupted data deep inside. Real code wraps parse calls in \`try/catch\` when the text comes from outside. Second, you've already been using \`stringify\` all chapter without ceremony: it's how these lessons' tests compare arrays and objects by *contents* — serialize both sides, compare the text — neatly sidestepping the reference-equality trap from Chapter 5. When a tool shows up in the machinery of the course teaching it, that's a hint about how often it shows up everywhere else.`,
      task: `The starter gives you \`payload\`, a JSON string. Parse it into a variable named \`config\`. Then create \`saved\`: a JSON string (via JSON.stringify) of a new object with the same \`user\` and a \`logins\` count one higher than the parsed one — and no other properties.`,
      starter: `const payload = '{"user":"ada","logins":42,"active":true}';\n\n// config = the parsed object; saved = stringified { user, logins: +1 }\n`,
      tests: [
        { name: 'config is the parsed object with real types', code: `assert(typeof config === 'object' && config !== null, 'config should be an object — JSON.parse(payload) builds it from the text'); assert(config.logins === 42, 'config.logins should be the NUMBER 42, got ' + JSON.stringify(config.logins)); assert(config.active === true, 'config.active should be the boolean true')` },
        { name: 'saved is the incremented record as a JSON string', code: `assert(saved === '{"user":"ada","logins":43}', 'saved should be the string {"user":"ada","logins":43} — a new object with user and logins+1 only, passed through JSON.stringify. Got ' + JSON.stringify(saved))` },
      ],
      hints: [
        'One method inflates text into an object, its inverse flattens an object into text. The new object for saving has exactly two properties.',
        '`const config = JSON.parse(payload);` — then build `{ user: config.user, logins: config.logins + 1 }` and pass it to JSON.stringify.',
        "Two statements: the parse above, then `const saved = JSON.stringify({ user: config.user, logins: config.logins + 1 });` — don't include active, and don't stringify config itself.",
      ],
      solution: `const payload = '{"user":"ada","logins":42,"active":true}';\nconst config = JSON.parse(payload);\nconst saved = JSON.stringify({ user: config.user, logins: config.logins + 1 });`,
      xp: 10,
    },
    {
      id: 'ch6-l6',
      title: 'Capstone: The Data Cleaner',
      reading: `Time for the chapter's final boss, and it's the most true-to-life exercise in this course so far. You've been handed exactly what real systems hand real engineers: a list of raw text lines, allegedly "name, score" records, actually a mess. Stray whitespace everywhere. Names in random capitalization. Blank lines where someone's export tool hiccuped. Your job is to turn that sludge into clean, typed records — and then into a presentable report. Practitioners joke that data work is 80% cleaning and 20% everything else; the joke survives because it's roughly true.

You'll write two functions, and the separation between them is itself the lesson. \`cleanRecords(lines)\` handles *understanding* the input: filter out the garbage, parse what remains, normalize it, return real data. \`formatReport(records)\` handles *presenting* the output: turn clean records into human-readable text. Parsing and presentation are different concerns, and welding them into one function is a classic beginner tell — the moment someone wants the same data as HTML instead of plain text, a welded version has to be torn apart. Two functions passing an array of objects between them: that's a **pipeline**, the architecture of virtually all data processing, from shell one-liners to Spark clusters.

Inside \`cleanRecords\`, for each line: skip it if it's blank *after trimming* (a line of pure spaces is just as empty as \`''\`), split on the comma, trim both fields, convert the score with \`Number\`, and normalize the name to **title case** — first letter of each word up, the rest down, so \`'grace hopper'\` and \`'GRACE HOPPER'\` both become \`'Grace Hopper'\`. Title-casing has no built-in, but you own every piece of it: split the name on spaces, and for each word take \`word[0].toUpperCase()\` plus \`word.slice(1).toLowerCase()\`, then join with spaces. Normalization is what makes data *trustworthy* — dedupe, search, and sorting all break when the same person exists under three spellings.

\`formatReport\` is the victory lap: one line per record, shaped \`'NAME scored SCORE'\`, joined with newline characters (\`'\\n'\`). Loop and push into an array, then \`join('\\n')\` — deliberately *not* string concatenation in a loop, because join handles the classic annoyance (no trailing newline after the last line) for free.

\`\`\`
cleanRecords(['  Ada Lovelace , 97 ', '', 'grace hopper,88'])
// -> [ { name: 'Ada Lovelace', score: 97 },
//      { name: 'Grace Hopper', score: 88 } ]
formatReport(cleanRecords(rawLines))
// -> 'Ada Lovelace scored 97\\nGrace Hopper scored 88'
\`\`\`

Take a second, before you write it, to notice how much of this course converges here: loops and accumulators (Ch 3, 5), functions with clean contracts (Ch 4), arrays of objects as the data shape (Ch 5), and this chapter's entire toolbelt — trim, split, slice, case methods, Number conversion, join. A capstone that needs six chapters of tools isn't an exam; it's evidence that the tools compose. That composition — small, boring pieces assembling into something that does a real job — is the actual craft. Build the pipeline.`,
      task: `Write \`cleanRecords(lines)\`: skip blank/whitespace-only lines, split each remaining line on ',', trim both fields, title-case the name, convert the score to a number, and return an array of \`{ name, score }\` objects. Then write \`formatReport(records)\` returning one 'NAME scored SCORE' line per record, joined with '\\n'.`,
      starter: `const rawLines = [\n  '  Ada Lovelace , 97 ',\n  'grace hopper,88',\n  '  ',\n  'LINUS TORVALDS ,  91  ',\n];\n\n// cleanRecords(lines) -> [{ name, score }, ...]   (blank lines skipped)\n// formatReport(records) -> 'Name scored N' lines joined with newlines\n`,
      tests: [
        { name: 'cleanRecords parses, trims, title-cases, and skips blanks', code: `{ const cr = cleanRecords(['  Ada Lovelace , 97 ', 'grace hopper,88', '  ', 'LINUS TORVALDS ,  91  ']); assert(JSON.stringify(cr) === '[{"name":"Ada Lovelace","score":97},{"name":"Grace Hopper","score":88},{"name":"Linus Torvalds","score":91}]', 'expected 3 clean records (blank line skipped, names Title Cased, scores numeric) — got ' + JSON.stringify(cr)); }` },
        { name: 'scores are numbers, not strings', code: `{ const cr2 = cleanRecords(['bob jones,50']); assert(typeof cr2[0].score === 'number', "score must go through Number() — typeof gave '" + typeof cr2[0].score + "'"); assert(cr2[0].name === 'Bob Jones', "title-casing should turn 'bob jones' into 'Bob Jones', got " + JSON.stringify(cr2[0].name)); }` },
        { name: 'formatReport builds newline-joined lines', code: `{ const rep = formatReport([{ name: 'Ada Lovelace', score: 97 }, { name: 'Grace Hopper', score: 88 }]); assert(rep === 'Ada Lovelace scored 97\\nGrace Hopper scored 88', 'expected two lines joined by a newline, no trailing newline — got ' + JSON.stringify(rep)); }` },
        { name: 'the full pipeline runs end to end', code: `{ const out = formatReport(cleanRecords(rawLines)); assert(out === 'Ada Lovelace scored 97\\nGrace Hopper scored 88\\nLinus Torvalds scored 91', 'formatReport(cleanRecords(rawLines)) should produce the 3-line report — got ' + JSON.stringify(out)); }` },
      ],
      hints: [
        "cleanRecords is a loop with a guard: `if (line.trim() === '') continue;` then the split/trim/Number pipeline from the parsing lesson, plus title-casing the name word by word. formatReport is loop-push-join.",
        "Title case a name with: `name.split(' ')`, then for each word `word[0].toUpperCase() + word.slice(1).toLowerCase()`, collected and joined with ' '. Remember to trim the name BEFORE splitting on spaces.",
        "cleanRecords per line: trim-check, `const parts = line.split(',')`, title-case `parts[0].trim()`, `Number(parts[1].trim())`, push `{ name, score }`. formatReport: push \\`\\${r.name} scored \\${r.score}\\` per record into an array, return it joined with '\\n'.",
      ],
      solution: `const rawLines = [\n  '  Ada Lovelace , 97 ',\n  'grace hopper,88',\n  '  ',\n  'LINUS TORVALDS ,  91  ',\n];\n\nfunction titleCase(text) {\n  const words = text.split(' ');\n  const fixed = [];\n  for (const word of words) {\n    fixed.push(word[0].toUpperCase() + word.slice(1).toLowerCase());\n  }\n  return fixed.join(' ');\n}\n\nfunction cleanRecords(lines) {\n  const records = [];\n  for (const line of lines) {\n    if (line.trim() === '') continue;\n    const parts = line.split(',');\n    records.push({\n      name: titleCase(parts[0].trim()),\n      score: Number(parts[1].trim()),\n    });\n  }\n  return records;\n}\n\nfunction formatReport(records) {\n  const lines = [];\n  for (const r of records) {\n    lines.push(\`\${r.name} scored \${r.score}\`);\n  }\n  return lines.join('\\n');\n}`,
      xp: 20,
    },
  ],
};
