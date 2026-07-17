// Chapter 2 — Making Decisions. See ../SCHEMA.md for the contract.

export default {
  id: 'ch2',
  title: 'Making Decisions',
  tagline: 'Comparisons, booleans, and branching — how code chooses one path over another.',
  badge: { name: 'Logic Gatekeeper', emoji: '🚦' },
  intro: `Chapter 1 gave you values and names. But a program that only computes values in a straight line is a calculator. What turns a calculator into *software* is decision-making: run this code if the user is logged in, that code if they aren't; charge tax if the address is in-state; retry if the request failed. Every interesting behavior a program has is, somewhere underneath, a branch.

The machinery of decisions is beautifully small. Comparisons ask questions and answer with one of exactly two values, \`true\` or \`false\`. Logical operators combine those answers into bigger questions. And \`if\`/\`else\` uses the final answer to choose which block of code runs. That's the whole system — the same three pieces, composed, are running inside the autopilot of a plane and the recommendation engine of a streaming service.

Because branching is where programs choose, it's also where programs go wrong. Most bugs are not crashes; they're programs confidently taking the wrong branch — a condition written with \`>\` where \`>=\` was meant, a sneaky type coercion turning "no" into "yes." So this chapter is also about defensive habits: strict equality, explicit conditions, and structuring your branches so the code's shape matches your intent. Interviewers dig here relentlessly, because a candidate's handling of edge cases in a simple \`if\` chain predicts how they'll handle edge cases in a distributed system.

By the end you'll write code that doesn't just compute — it decides. Read closely; the ideas here get reused in literally every chapter that follows.`,
  lessons: [
    {
      id: 'ch2-l1',
      title: 'Comparisons: Asking True/False Questions',
      reading: `Every decision a program makes starts with a question that has exactly two possible answers. The **comparison operators** are how you ask. Each one takes two values and produces a boolean — \`true\` or \`false\` — and nothing else. \`5 > 3\` evaluates to \`true\` the same way \`5 + 3\` evaluates to \`8\`: a comparison is just an expression whose result happens to be a boolean.

The ordering operators are familiar from math: \`>\` greater than, \`<\` less than, \`>=\` greater-or-equal, \`<=\` less-or-equal. The equality operators are where JavaScript demands your attention, because there are two of them and they do not behave the same way:

\`\`\`
5 === 5      // true   — strict equality
5 === '5'    // false  — different types, no debate
5 == '5'     // true   — loose equality... wait, what?
\`\`\`

Triple-equals \`===\` is **strict equality**: two values are equal only if they have the same type *and* the same value. A number is never strictly equal to a string, period. Double-equals \`==\` is **loose equality**: before comparing, it silently *coerces* the values toward a common type using a genuinely baroque set of rules. Under loose equality, \`5 == '5'\` is true, \`0 == ''\` is true, \`0 == '0'\` is true — and yet \`'' == '0'\` is false. Sit with that last trio for a second: loose equality isn't even consistent with itself in the way you'd expect equality to be.

The professional rule is absolute and worth stating in bold: **always use \`===\` and \`!==\`, never \`==\` and \`!=\`.** This isn't a style preference — it's one of the few rules the entire JavaScript community actually agrees on. Linters (the automated style-checkers running in every serious codebase) flag \`==\` on sight. The reasoning is the theme of this whole course: code should mean what it says. \`===\` asks a question with a knowable answer; \`==\` asks a question whose answer depends on coercion rules that even senior engineers have to look up. And yes, "explain the difference between == and ===" is a genuine JavaScript interview staple — often followed by "so when *would* you use ==?" The strong answer: essentially never; if types might differ, convert them explicitly first, so the conversion is visible in the code instead of hidden in the operator.

For "not equal," the same split exists: \`!==\` is the strict form (use it), \`!=\` is the loose form (don't). And note what comparisons give you back: an ordinary value. You can store it in a variable like any other:

\`\`\`
const isAdult = age >= 18;
\`\`\`

That line is a small superpower. The boolean now has a *name*, and the name reads like English. Later code can say \`if (isAdult)\` instead of re-deriving the logic. Naming your booleans well — \`isAdult\`, \`hasTicket\`, \`canRetry\` — is one of the cheapest readability wins in programming; the convention of an \`is\`/\`has\`/\`can\` prefix makes a variable's boolean nature obvious at a glance. In this exercise you'll capture comparison results into named constants, including one deliberate use of \`==\` — the only one in this course — purely so you can see the coercion trap with your own eyes before you swear it off.`,
      task: `Using the starter values, create \`strictEqual\` holding the result of a === b, \`looseEqual\` holding the result of a == b (the one permitted sighting), and \`isBigger\` holding whether 10 is greater than 3.`,
      starter: "const a = 5;\nconst b = '5';\n// 1) const strictEqual = a === b\n// 2) const looseEqual = a == b   (just this once — to see the trap)\n// 3) const isBigger = whether 10 > 3\n",
      tests: [
        { name: 'strictEqual captures a === b', code: "assert(strictEqual === false, 'strictEqual should be false — a is a number and b is a string, and === never calls different types equal')" },
        { name: 'looseEqual captures a == b', code: "assert(looseEqual === true, 'looseEqual should be true — == coerces the string to a number before comparing, which is exactly why we avoid it')" },
        { name: 'isBigger is a real boolean comparison', code: "assert(isBigger === true && typeof isBigger === 'boolean', 'isBigger should be the boolean result of the expression 10 > 3 — store the comparison itself, not the string or number')" },
      ],
      hints: [
        'A comparison is an expression like any other — it produces a boolean value you can put on the right side of an =. Each of the three lines stores one comparison result.',
        'Write the operators exactly: `const strictEqual = a === b;` (three equals signs), `const looseEqual = a == b;` (two), and for the last one use the > operator between 10 and 3.',
        "Three lines: `const strictEqual = a === b;` — `const looseEqual = a == b;` — `const isBigger = 10 > 3;`. If strictEqual came out true, count your equals signs; if isBigger fails the typeof check, make sure you wrote the comparison, not the value true in quotes.",
      ],
      solution: "const a = 5;\nconst b = '5';\nconst strictEqual = a === b;\nconst looseEqual = a == b;\nconst isBigger = 10 > 3;",
      xp: 10,
    },
    {
      id: 'ch2-l2',
      title: 'Truthiness: How JavaScript Bends the Truth',
      reading: `Booleans are simple: \`true\` and \`false\`, two values, end of story. But JavaScript has a habit you must understand before writing your first \`if\`: it will accept *any* value where a boolean is expected, and silently convert it. Put a string in a condition and the language doesn't complain — it decides for itself whether that string "counts as" true. This behavior is called **truthiness**, and it's both a genuine convenience and a reliable bug factory.

The conversion rules are mercifully short. Exactly these values convert to \`false\` — memorize the list, it's finite:

- \`false\` itself
- \`0\` (and \`-0\`)
- \`''\` — the empty string
- \`null\`
- \`undefined\`
- \`NaN\` — "not a number," the result of nonsense arithmetic like \`0 / 0\`

These are the **falsy** values. *Everything else in the language is truthy.* Every non-zero number (including negatives), every non-empty string, every object, every array. The list of falsy values is six items long and closed; you now know it in its entirety, which is more than a lot of working developers can claim.

You can see how any value converts by passing it to the \`Boolean(...)\` function, which performs the conversion explicitly and hands you the actual \`true\` or \`false\`:

\`\`\`
Boolean('')        // false — empty string is falsy
Boolean(0)         // false
Boolean('0')       // true  — NON-empty string, even though it looks like zero
Boolean('false')   // true  — also a non-empty string!
\`\`\`

Look hard at those last two, because they're where intuition betrays people. The *string* \`'0'\` is truthy — it's a piece of text one character long, and non-empty text is truthy regardless of what the text says. The string \`'false'\` is truthy for the same reason. Truthiness looks at the *shape* of the value (is there something here or nothing?), never at its *meaning*.

There's a notorious real-world bug pattern lurking in this lesson, and you should meet it now, in a reading, rather than later, in production. Suppose \`quantity\` holds how many items a user ordered, and you write \`if (quantity)\` to check "did they order anything… wait, did they even *fill in* the field?" The trap: if the user legitimately ordered **zero** items — a valid, meaningful number — \`0\` is falsy, and your check treats it exactly like "field missing." Data vanishes; someone gets paged. Whole classes of production incidents reduce to "we treated 0 (or empty string) as absent." The defensive habit: when zero or empty string is a *legitimate value* in your domain, don't lean on truthiness — compare explicitly, like \`quantity !== undefined\` or \`name !== null\`. Say what you mean.

So why does truthiness exist at all? Because in the common case it makes conditions pleasantly terse — \`if (errorMessage)\` reads naturally as "if there's an error message." Experienced engineers use truthiness deliberately when absence and emptiness genuinely mean the same thing, and switch to explicit comparison the moment they don't. The skill isn't avoiding truthiness; it's *knowing which check you're making*. This exercise has you interrogate values with \`Boolean(...)\` so the conversion table moves from the page into your fingers.`,
      task: `Using Boolean(...), create three constants: \`emptyStringTruth\` from the empty string '', \`zeroTruth\` from the number 0, and \`textZeroTruth\` from the string '0'.`,
      starter: "// Interrogate three values with Boolean(...):\n// 1) const emptyStringTruth = Boolean of ''\n// 2) const zeroTruth = Boolean of 0\n// 3) const textZeroTruth = Boolean of '0'\n",
      tests: [
        { name: 'empty string is falsy', code: "assert(emptyStringTruth === false, \"emptyStringTruth should be false — '' is one of the six falsy values\")" },
        { name: 'the number 0 is falsy', code: "assert(zeroTruth === false, 'zeroTruth should be false — the number 0 is falsy (the root of the classic quantity-zero bug)')" },
        { name: "the string '0' is truthy", code: "assert(textZeroTruth === true, \"textZeroTruth should be true — '0' is a NON-empty string, and truthiness checks shape, not meaning\")" },
      ],
      hints: [
        'Boolean(value) is an ordinary function call that returns the true/false conversion of whatever you pass it — store each result in a const.',
        "Three calls: Boolean(''), Boolean(0), Boolean('0'). Watch the quotes on the third one — you are passing a one-character string, not a number.",
        "Exactly: `const emptyStringTruth = Boolean('');` — `const zeroTruth = Boolean(0);` — `const textZeroTruth = Boolean('0');`. If the third test fails, you probably wrote Boolean(0) without quotes — the number is falsy, the string is truthy.",
      ],
      solution: "const emptyStringTruth = Boolean('');\nconst zeroTruth = Boolean(0);\nconst textZeroTruth = Boolean('0');",
      xp: 10,
    },
    {
      id: 'ch2-l3',
      title: 'if, else if, else: Forks in the Road',
      reading: `You can now produce booleans. Time to make them *do* something. The \`if\` statement is the fundamental branch: evaluate a condition, and run a block of code only when it's true.

\`\`\`
if (score >= 90) {
  console.log('Excellent work');
}
\`\`\`

Anatomy: the keyword \`if\`, a condition in parentheses, then a **block** — statements wrapped in curly braces. If the condition evaluates to something truthy, the block runs; otherwise the machine skips past the closing brace as if the block didn't exist. Add an \`else\` and you have a true fork: exactly one of the two blocks will run, never both, never neither.

The full form chains alternatives with \`else if\`, and this is the shape you'll write constantly:

\`\`\`
if (score >= 90) {
  grade = 'honors';
} else if (score >= 60) {
  grade = 'pass';
} else {
  grade = 'fail';
}
\`\`\`

Here's the mental model that matters: the machine walks this chain **top to bottom and stops at the first true condition**. Everything below the winner is skipped entirely. That's why the second branch can say just \`score >= 60\` rather than \`score >= 60 && score < 90\` — by the time execution *reaches* that check, the first condition has already failed, so you know for free that the score is below 90. Order is doing real logical work. This is elegant when you exploit it deliberately, and a bug generator when you order branches carelessly: put \`score >= 60\` *first* and a 95 gets a mere 'pass', because the chain stopped at the first match. When you review an \`if\`/\`else if\` chain — yours or anyone's — check the order as carefully as the conditions. Note the pattern in that example, too: declare \`let grade;\` before the chain, and let each branch assign it. Exactly one branch runs, so the variable ends up with exactly one value — this is the standard way branches produce a result.

The final bare \`else\` is the catch-all: it runs when nothing above matched. Include one whenever a value *must* end up set — a chain of \`if\`/\`else if\` with no \`else\` can fall all the way through and touch nothing, leaving your variable \`undefined\`. In code review, a chain that assigns a variable but has no \`else\` earns an immediate question: "what happens when none of these match?" Sometimes the answer is "can't happen" — but make that a decision, not an accident.

Two classic traps before you write your own. First, \`=\` versus \`===\`: the condition \`if (status = 'active')\` — one equals sign — doesn't compare, it *assigns*, and then evaluates the assigned value, which as a non-empty string is truthy. The branch always runs, and the bug reads almost exactly like correct code. Second, truthiness ambush: \`if (quantity)\` when zero is legitimate, straight from last lesson. Both traps produce code that runs without error and does the wrong thing — the most expensive kind of bug, because nothing crashes to get your attention.

In this exercise you'll grade three scores by writing the same chain three times, once per score. Yes — three times. You will *feel* the repetition, and you should: that itch is the single strongest motivation for **functions**, which arrive in Chapter 4 and let you write logic once and apply it to any input. Great abstractions are learned by first suffering, briefly and safely, without them.`,
      task: `Three scores are given. For each, write an if / else if / else chain that assigns the matching grade variable: 'honors' for 90 and above, 'pass' for 60 to 89, 'fail' below 60.`,
      starter: "const scoreA = 92;\nconst scoreB = 47;\nconst scoreC = 71;\nlet gradeA;\nlet gradeB;\nlet gradeC;\n// Chain for gradeA (from scoreA), then gradeB, then gradeC.\n// 90+ → 'honors'   60-89 → 'pass'   below 60 → 'fail'\n",
      tests: [
        { name: 'scoreA of 92 earns honors', code: "assert(gradeA === 'honors', \"gradeA should be 'honors' — 92 is at least 90, so the first branch should win. If you got 'pass', check your branch ORDER: the >= 60 test must come after the >= 90 test\")" },
        { name: 'scoreB of 47 fails', code: "assert(gradeB === 'fail', \"gradeB should be 'fail' — 47 matches neither condition, so the final else should catch it\")" },
        { name: 'scoreC of 71 passes', code: "assert(gradeC === 'pass', \"gradeC should be 'pass' — 71 fails the >= 90 check but passes >= 60, landing in the middle branch\")" },
      ],
      hints: [
        'Each grade needs one chain: if (highest tier) / else if (middle tier) / else. The branches assign to the already-declared let variable — no new declarations inside the blocks.',
        "The shape for the first one: if (scoreA >= 90) { gradeA = 'honors'; } else if (scoreA >= 60) { gradeA = 'pass'; } else { gradeA = 'fail'; } — then repeat the same shape for B and C, swapping the score and grade names.",
        "Write the chain from hint 2 three times, for (scoreA, gradeA), (scoreB, gradeB), (scoreC, gradeC). The two failure modes worth checking: branch order (>= 90 must be tested before >= 60), and accidentally assigning to gradeA in the B or C chain after copy-pasting.",
      ],
      solution: "const scoreA = 92;\nconst scoreB = 47;\nconst scoreC = 71;\nlet gradeA;\nlet gradeB;\nlet gradeC;\nif (scoreA >= 90) {\n  gradeA = 'honors';\n} else if (scoreA >= 60) {\n  gradeA = 'pass';\n} else {\n  gradeA = 'fail';\n}\nif (scoreB >= 90) {\n  gradeB = 'honors';\n} else if (scoreB >= 60) {\n  gradeB = 'pass';\n} else {\n  gradeB = 'fail';\n}\nif (scoreC >= 90) {\n  gradeC = 'honors';\n} else if (scoreC >= 60) {\n  gradeC = 'pass';\n} else {\n  gradeC = 'fail';\n}",
      xp: 10,
    },
    {
      id: 'ch2-l4',
      title: 'AND, OR, NOT: Composing Conditions',
      reading: `Real-world conditions are rarely single questions. "Can this user drive?" is really "are they old enough AND licensed AND not banned?" JavaScript gives you three **logical operators** to compose small questions into big ones, and together with comparisons they form a complete little algebra of decisions.

**\`&&\` (AND)** — true only when *both* sides are true. \`age >= 16 && hasLicense\` demands both conditions hold; one failure fails the whole thing. Chain as many as you like: \`a && b && c\` requires all three.

**\`||\` (OR)** — true when *at least one* side is true. \`isWeekend || isHoliday\` — either one earns the day off. Note this is *inclusive* or: both being true is also fine, which matches logic but not always English ("soup or salad" rarely means both).

**\`!\` (NOT)** — flips one boolean: \`!true\` is \`false\`, \`!isBanned\` reads as "not banned." It binds tightly to whatever's immediately right of it, so \`!isBanned && hasTicket\` means "(not banned) and has ticket," not "not (banned and has ticket)" — when in doubt, parenthesize your intent.

There's a performance-and-correctness subtlety hiding in \`&&\` and \`||\` that separates people who know JavaScript from people who've merely used it: **short-circuit evaluation**. The machine evaluates left to right and stops the instant the answer is decided. In \`a && b\`, if \`a\` is false, the overall result cannot possibly be true — so \`b\` is *never even evaluated*. In \`a || b\`, a true \`a\` skips \`b\` the same way. This isn't trivia; real code leans on it structurally. The idiom \`user !== null && user.name === 'admin'\` is *safe specifically because of short-circuiting*: when \`user\` is null, the right side — which would crash trying to read \`.name\` off null — never runs. The left condition is a guard standing in front of the right one. You'll see this pattern in essentially every JavaScript codebase on earth.

A note for your interview file: in JavaScript, \`&&\` and \`||\` don't technically return \`true\`/\`false\` — they return *one of their operands* (\`'hello' || 'default'\` evaluates to \`'hello'\`, not \`true\`). When the operands are already booleans, as in this lesson, the distinction is invisible and the result is a plain boolean. But that operand-returning behavior is why old code uses \`||\` for default values — \`const name = input || 'anonymous';\` — and why that idiom has the zero-is-falsy bug baked in: an \`input\` of \`0\` or \`''\` gets silently replaced by the default. Modern JavaScript added \`??\` (nullish coalescing) to fix exactly that — it falls back only on \`null\`/\`undefined\`, not on every falsy value. File it away; it'll matter when you're parsing user input in Chapter 6.

One last composition tool: complex negations. "NOT (young OR banned)" is logically identical to "old enough AND not banned" — that equivalence is one of **De Morgan's laws**, and it's worth knowing by name because refactoring \`!(a || b)\` into \`!a && !b\` (and back) is a daily move when untangling gnarly conditions into readable ones. Between naming your booleans, short-circuit guards, and De Morgan rewrites, you now hold the complete toolkit that professionals use to keep condition logic honest. Time to compose some.`,
      task: `Using the starter values, build \`canDrive\` (at least 16, has a license, and not banned), \`needsReview\` (under 18 or banned), and \`notBanned\` (the negation of isBanned).`,
      starter: "const age = 25;\nconst hasLicense = true;\nconst isBanned = false;\n// 1) const canDrive = age at least 16 AND hasLicense AND not banned\n// 2) const needsReview = age under 18 OR banned\n// 3) const notBanned = NOT isBanned\n",
      tests: [
        { name: 'canDrive requires all three conditions', code: "assert(canDrive === true, 'canDrive should be true — 25 >= 16, licensed, and not banned all hold, and && of three trues is true. Check you negated isBanned with !')" },
        { name: 'needsReview is an OR of two conditions', code: "assert(needsReview === false, 'needsReview should be false — age 25 is not under 18 and isBanned is false, so neither side of the || fires')" },
        { name: 'notBanned flips the flag', code: "assert(notBanned === true && typeof notBanned === 'boolean', 'notBanned should be the boolean !isBanned — apply the ! operator, don\\'t just retype true')" },
      ],
      hints: [
        'Each constant is one boolean expression built from comparisons joined by && or ||, with ! flipping the banned flag. Translate the English directly: "and" → &&, "or" → ||, "not" → !.',
        'canDrive joins three parts with &&: a >= comparison, the hasLicense flag as-is, and !isBanned. needsReview joins a < comparison and the isBanned flag with ||. notBanned is just ! in front of isBanned.',
        'Three lines: `const canDrive = age >= 16 && hasLicense && !isBanned;` — `const needsReview = age < 18 || isBanned;` — `const notBanned = !isBanned;`. If canDrive came out false, the usual slip is writing isBanned without the ! — you need "not banned" for driving to be allowed.',
      ],
      solution: 'const age = 25;\nconst hasLicense = true;\nconst isBanned = false;\nconst canDrive = age >= 16 && hasLicense && !isBanned;\nconst needsReview = age < 18 || isBanned;\nconst notBanned = !isBanned;',
      xp: 10,
    },
    {
      id: 'ch2-l5',
      title: 'Ternaries and the Guard-Clause Mindset',
      reading: `The \`if\` statement has one limitation you've maybe already bumped into: it's a *statement*, not an expression. It performs actions but produces no value, so you can't write \`const label = if (...) ...\` — the language simply doesn't parse it. When all you want is "this value or that value, depending on a condition," JavaScript offers a condensed, expression-shaped conditional: the **ternary operator**, so named because it's the language's only operator taking three operands.

\`\`\`
const label = stock > 0 ? 'in stock' : 'sold out';
\`\`\`

Read it as a question with two prepared answers: *condition* \`?\` *value-if-true* \`:\` *value-if-false*. The machine evaluates the condition, then evaluates **only** the chosen side — the loser isn't touched (short-circuiting again). Because the whole thing is an expression, it slots in anywhere a value goes: the right side of a \`const\`, inside a template literal's \`\${...}\`, as an argument to a function. That last habitat is where ternaries shine brightest — \`\${count === 1 ? 'item' : 'items'}\` fixing a plural inline is the canonical example, and you'll write that exact pattern more times than you can count.

Now the professional judgment call, because the ternary is a sharp tool with a real hazard: **ternaries are for choosing between two values, not for hiding control flow.** One condition, two simple outcomes — ideal. But ternaries nest, and nested ternaries — \`a ? b : c ? d : e\` — are notorious; most readers need three passes to decode one, and style guides at major companies restrict or ban them outright. The moment your ternary needs nesting, or its branches grow actual logic, that's the tool telling you it wants to be an \`if\` statement. Choosing the boring, readable form when the clever form technically works is — you may have noticed the running theme — most of what "senior" means.

The second idea in this lesson is bigger than any operator, and it's about the *shape* of decision-heavy code. Watch what happens when every validation nests inside the last:

\`\`\`
if (venueOpen) {
  if (hasTicket) {
    if (meetsAge) {
      // ...the actual work, buried three levels deep...
    }
  }
}
\`\`\`

Engineers call this the **arrow anti-pattern** — the code's silhouette forms an arrowhead of indentation, the happy path is entombed at maximum depth, and every closing brace at the bottom must be mentally matched to a condition way up top. The cure is the **guard clause**: flip each check into its failure form, handle the failure *immediately*, and bail out. What remains below each guard is code that can safely assume the check passed. The structure becomes: reject, reject, reject… then the happy path at zero indentation, breathing free. You'll write guard-first code with early \`return\` once functions arrive in Chapter 4 — it's the natural habitat of the pattern — but the *ordering discipline* works anywhere today: deal with the edge cases first, in a flat sequence, each one ending the discussion; keep the main logic unindented and last. Read any well-maintained open-source codebase and you'll see this shape everywhere: functions that open with a stack of two-line rejections, then get on with business.

Why do experienced engineers care so much about this? Because nesting is *cognitive load*. Every open \`if\` is a fact you must hold in your head while reading everything inside it; three levels deep, you're juggling three facts before you reach the line that matters. Guard clauses discharge each fact the moment it's raised. The code reads like a bouncer working a door: no ticket? Out. Underage? Out. Everyone still in line is welcome — and nobody inside the venue needs re-checking. Hold that bouncer image; the capstone next lesson is literally this.`,
      task: `Using the starter values, build \`label\` with a ternary: 'in stock' when stock is greater than 0, otherwise 'sold out'. Then build \`cartMessage\` with a ternary inside a template literal: exactly '1 item' when itemsInCart is 1, otherwise the count followed by ' items'.`,
      starter: "const stock = 0;\nconst itemsInCart = 3;\n// 1) const label = ternary: stock > 0 ? 'in stock' : 'sold out'\n// 2) const cartMessage = '1 item' if exactly 1, otherwise `<count> items`\n",
      tests: [
        { name: 'label reports sold out at zero stock', code: "assert(label === 'sold out', \"label should be 'sold out' — stock is 0, so the condition stock > 0 is false and the ternary should yield its second value\")" },
        { name: 'cartMessage pluralizes correctly', code: "assert(cartMessage === '3 items', \"cartMessage should be '3 items' — itemsInCart is 3, not 1, so the plural side wins. Build it as `${itemsInCart} items` so any count would work\")" },
        { name: 'cartMessage is a string, not a boolean', code: "assert(typeof cartMessage === 'string', 'cartMessage should be a string — make sure you stored the ternary result, not just the comparison itemsInCart === 1')" },
      ],
      hints: [
        'Both constants are single ternary expressions: condition, question mark, value-if-true, colon, value-if-false. The second one chooses between two strings, one of which embeds the count.',
        "label is `stock > 0 ? 'in stock' : 'sold out'`. For cartMessage, the condition is itemsInCart === 1, the true-side is the string '1 item', and the false-side is a template literal embedding itemsInCart before ' items'.",
        "Two lines: `const label = stock > 0 ? 'in stock' : 'sold out';` and `const cartMessage = itemsInCart === 1 ? '1 item' : `${itemsInCart} items`;`. If cartMessage fails, check the false-side: it must be a template literal with backticks, producing '3 items' with a space before 'items'.",
      ],
      solution: "const stock = 0;\nconst itemsInCart = 3;\nconst label = stock > 0 ? 'in stock' : 'sold out';\nconst cartMessage = itemsInCart === 1 ? '1 item' : `${itemsInCart} items`;",
      xp: 10,
    },
    {
      id: 'ch2-l6',
      title: 'Capstone: The Bouncer',
      reading: `Time to run the door. This capstone assembles everything in the chapter — comparisons, logical composition, an ordered \`if\`/\`else if\` chain, a ternary, and a formatted result — into one small access-control system. Access control is a flattering choice of exercise, because it's real: the logic you're about to write is, structurally, the same logic inside every login flow, permissions check, and API gateway you've ever used. Somewhere in every serious backend there is code deciding, in careful order, whether to let a request through — and the discipline of *which check runs first* is the difference between a secure system and an incident report.

Here's tonight's door policy. The venue admits a guest only if the venue is open, they hold a ticket, and they meet the age requirement — where "meets age" means they're 18 or older, *or* they're a VIP (VIPs skip the age rule; every real system has an override like this, and handling overrides cleanly is a skill). The decision comes out as one of four strings: 'closed', 'no ticket', 'too young', or 'welcome'.

Notice what the four outcomes force on you: *order matters, and the reasons must be specific.* If the venue is closed, that's the answer — it would be absurd (and, in real systems, an information leak) to tell someone their ticket is invalid when the doors aren't even open. So the chain must check venue first, ticket second, age third, and only then welcome the guest. This is the guard-clause ordering from last lesson wearing an \`if\`/\`else if\` costume: each branch handles one rejection and settles the matter; the final \`else\` is the happy path, reachable only by survivors of every guard. When you build the chain, express each guard in its *failure* form — \`!venueOpen\`, \`!hasTicket\`, \`!meetsAge\` — so each branch reads as "reject because X."

A design note on that age rule, because there's a subtle engineering decision in it. You could inline the whole thing into the chain: \`else if (!(userAge >= 18 || isVip))\` — and it would work. But look at it: a negation wrapping an OR, inside a branch, demanding a small De Morgan derivation from every future reader. The better move is one you learned in lesson 1: **compute the boolean first and name it.** \`const meetsAge = userAge >= 18 || isVip;\` puts the policy on its own line, where it reads like the sentence it came from, and the chain then says the almost-English \`!meetsAge\`. When requirements change — the drinking age moves, VIPs lose the exemption — the edit lands on one clearly-named line instead of inside a tangle. Extracting a named boolean is possibly the highest-value-per-keystroke refactor in all of programming; capstone or not, do it reflexively forever.

The last two pieces are familiar tools with a job to do: a ternary picks the guest's badge tier ('VIP' or 'GENERAL' — exactly the two-values-one-condition case ternaries are for), and a template literal formats the final log line, exact to the character, the way a real door system would write to its audit log. Tonight's guest, for the record: seventeen, ticketed, not a VIP, venue open. Trace the chain by hand before you write it — decide what the output *should* be — then build it and let the tests confirm your trace. Predicting first and verifying second, rather than writing code and hoping, is the entire scientific method of debugging, miniaturized. Run the door well.`,
      task: `Build \`meetsAge\` (18 or older, OR a VIP). Then an if / else if / else chain assigning \`decision\` (declared with let): 'closed' if the venue isn't open, else 'no ticket' if they lack a ticket, else 'too young' if they don't meet age, else 'welcome'. Then \`badge\` via ternary ('VIP' or 'GENERAL'), and \`summary\` as a template literal reading exactly: too young (GENERAL)`,
      starter: "const userAge = 17;\nconst hasTicket = true;\nconst isVip = false;\nconst venueOpen = true;\n// 1) const meetsAge = 18+ OR isVip\n// 2) let decision; then the guard chain: closed → no ticket → too young → welcome\n// 3) const badge = ternary on isVip: 'VIP' or 'GENERAL'\n// 4) const summary = template literal: <decision> (<badge>)\n",
      tests: [
        { name: 'meetsAge composes age and VIP override', code: "assert(meetsAge === false, 'meetsAge should be false — 17 is under 18 and this guest is not a VIP, so neither side of the || rescues them')" },
        { name: 'decision walks the guards in order', code: "assert(decision === 'too young', \"decision should be 'too young' — the venue is open and the ticket is real, so the first two guards pass and the age guard fires. If you got 'welcome', check that the age branch tests !meetsAge; if you got 'closed' or 'no ticket', check your ! placement on the earlier guards\")" },
        { name: 'badge picks the right tier', code: "assert(badge === 'GENERAL', \"badge should be 'GENERAL' — isVip is false, so the ternary should yield its second value. Check the strings are exact: all caps, no spaces\")" },
        { name: 'summary matches the audit-log format', code: "assert(summary === 'too young (GENERAL)', \"summary should be exactly 'too young (GENERAL)' — decision, a space, then the badge in parentheses. Build it from the variables with a template literal, not by retyping the words\")" },
      ],
      hints: [
        'Four steps in pipeline order: the named boolean, the guard chain into a let variable, the ternary, the formatted string. Each guard in the chain should test the failure of one requirement, most fundamental first: open, then ticket, then age.',
        "meetsAge is `userAge >= 18 || isVip`. The chain: `let decision; if (!venueOpen) { decision = 'closed'; } else if (!hasTicket) { decision = 'no ticket'; } else if (!meetsAge) { decision = 'too young'; } else { decision = 'welcome'; }`. Then a ternary on isVip, then a template literal with two slots.",
        "After the chain from hint 2: `const badge = isVip ? 'VIP' : 'GENERAL';` and `const summary = `${decision} (${badge})`;` — backticks, with literal parentheses around the badge slot. If summary is off by a character, it's almost always the space before the opening parenthesis.",
      ],
      solution: "const userAge = 17;\nconst hasTicket = true;\nconst isVip = false;\nconst venueOpen = true;\nconst meetsAge = userAge >= 18 || isVip;\nlet decision;\nif (!venueOpen) {\n  decision = 'closed';\n} else if (!hasTicket) {\n  decision = 'no ticket';\n} else if (!meetsAge) {\n  decision = 'too young';\n} else {\n  decision = 'welcome';\n}\nconst badge = isVip ? 'VIP' : 'GENERAL';\nconst summary = `${decision} (${badge})`;",
      xp: 20,
    },
  ],
};
