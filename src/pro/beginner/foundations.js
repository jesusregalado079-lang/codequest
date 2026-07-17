// Beginner tier — "Foundations". Definitions first, plain English, no typing.
// Each lesson: a short reading (markdown-lite, same renderer as the rest of the
// app) + one or more multiple-choice checks. `answer` is the index into
// `choices`; `why` is shown after answering, right or wrong.
//
// Shape mirrors an intermediate chapter enough to reuse chapterProgress/
// badgeEarned/completeLesson: { id, title, tagline, badge, lessons[] } where
// each lesson has an { id, xp } and a `questions` array instead of code/tests.

const foundations = {
  id: 'found',
  tier: 'beginner',
  title: 'Foundations',
  tagline: 'The words before the code. Start here — no typing, just ideas.',
  badge: { name: 'Ground Floor', emoji: '🧱' },
  lessons: [
    {
      id: 'found-l1',
      title: 'What Is a Program?',
      reading: `A **program** is a list of instructions a computer follows, one at a time, in order.

That's the whole idea. The computer is fast and literal — it does *exactly* what the instructions say, in the *exact* order you write them, and nothing more. It never guesses what you meant.

A recipe is a good picture of it: "crack the eggs, then whisk, then pour." Do those in the wrong order and you get a mess. Code is the same — order is everything.

The skill you're building isn't memorizing words. It's learning to break a task into small, exact steps a machine can follow.`,
      questions: [
        {
          q: 'What is the best description of a program?',
          choices: [
            'A clever machine that figures out what you want',
            'A list of exact instructions the computer follows in order',
            'A picture of an app on your phone',
          ],
          answer: 1,
          why: 'A program is just ordered instructions. The computer does exactly what you say — it never infers your intent.',
        },
        {
          q: 'You get the order of two steps wrong. What happens?',
          choices: [
            'The computer fixes it for you',
            'It still works, order never matters',
            'It does them in the wrong order — order matters',
          ],
          answer: 2,
          why: 'The machine runs steps in the exact order written. Wrong order, wrong result.',
        },
      ],
      xp: 5,
    },
    {
      id: 'found-l2',
      title: 'What Is a Value?',
      reading: `A **value** is a single piece of information the program works with.

The number \`30\`. The word \`"hello"\`. The idea of \`true\` or \`false\`. Each of those is one value.

Almost everything a program does is take some values, do something with them, and produce new values. A shopping cart adds up price values. A login checks a password value. Values are the *stuff*; the program is the *doing*.

For now, just notice them: whenever you see a number, a piece of text, or a yes/no in code, that's a value.`,
      questions: [
        {
          q: 'Which of these is a value?',
          choices: ['The number 30', 'The order of steps', 'The speed of the computer'],
          answer: 0,
          why: 'A value is a single piece of data — a number like 30, text, or true/false.',
        },
      ],
      xp: 5,
    },
    {
      id: 'found-l3',
      title: 'Types: Numbers, Text, and Yes/No',
      reading: `Values come in **types** — kinds of data the computer treats differently.

The three you'll meet first:

- **Number** — \`30\`, \`-4\`, \`3.5\`. Math works on these.
- **String** — text, always in quotes: \`"hello"\`, \`"Jesse"\`. The word "string" just means "a string of characters."
- **Boolean** — only two possible values: \`true\` or \`false\`. Named after George Boole. This is how a program answers yes/no questions.

Type matters because it decides what you can do. You can multiply two numbers. You can't really multiply two words. The computer needs to know which kind of value it's holding.`,
      questions: [
        {
          q: 'What type is the value `"hello"`?',
          choices: ['A number', 'A string (text)', 'A boolean'],
          answer: 1,
          why: 'Text wrapped in quotes is a string. The quotes are how you (and the computer) tell it is text.',
        },
        {
          q: 'A boolean can be...',
          choices: ['Any number', 'Only true or false', 'Any word'],
          answer: 1,
          why: 'A boolean has exactly two values: true or false. It answers yes/no questions.',
        },
      ],
      xp: 5,
    },
    {
      id: 'found-l4',
      title: 'What Is a Variable?',
      reading: `A **variable** is a name attached to a value, so you can use the value again later.

Think of a labeled box. You put a value in it and write a name on the front. From then on, saying the name means "the value inside."

\`\`\`
const age = 30;
\`\`\`

Read that as: make a box named \`age\`, put the value \`30\` in it. Now anywhere you write \`age\`, the program reads \`30\`.

The \`=\` here is **not** "equals" like in math. It's an action: *"put this value into this name."* Mathematicians state facts; programmers give orders.

Variables are why programs are useful — you compute something once, name it, and reuse it everywhere.`,
      questions: [
        {
          q: 'What does a variable do?',
          choices: [
            'Gives a value a name so you can reuse it',
            'Deletes a value',
            'Turns text into a number',
          ],
          answer: 0,
          why: 'A variable is a name bound to a value — a labeled box you can refer to again.',
        },
        {
          q: 'In `const age = 30;`, what does the `=` mean?',
          choices: [
            'age is mathematically equal to 30',
            'Put the value 30 into the name age',
            'Ask whether age is 30',
          ],
          answer: 1,
          why: 'In code, = is assignment: put the right-hand value into the name on the left. It is an action, not a math fact.',
        },
      ],
      xp: 10,
    },
    {
      id: 'found-l5',
      title: 'What Is an Expression?',
      reading: `An **expression** is any piece of code that produces a value.

\`2 + 2\` is an expression — it produces \`4\`. \`age\` is an expression — it produces whatever is in the box. \`"hi" + " there"\` is an expression — it produces \`"hi there"\`.

The test is simple: *could you put it on the right side of an \`=\`?* If yes, it's an expression, because it boils down to a value.

This matters because programs are built by nesting expressions — the result of one feeds into the next. \`price * quantity\` produces a number, which you might then store in a variable, which you might then compare to a budget. Small value-producing pieces, stacked.`,
      questions: [
        {
          q: 'What makes something an expression?',
          choices: [
            'It produces a value',
            'It has a semicolon',
            'It is written in quotes',
          ],
          answer: 0,
          why: 'An expression is any code that boils down to a value — that is why it can sit on the right of an =.',
        },
      ],
      xp: 10,
    },
    {
      id: 'found-l6',
      title: 'What Is a Function?',
      reading: `A **function** is a named machine: you give it some input, it does a job, and it hands back a result.

You already use them everywhere. A coffee machine takes beans and water (input) and gives back coffee (output). You don't rebuild the machine each morning — you *call* it.

In code, a function lets you name a job once and reuse it. \`add(2, 3)\` might give back \`5\`. \`greet("Jesse")\` might give back \`"Hello, Jesse"\`. The words in the parentheses are the input you hand in.

Why it matters: without functions you'd copy the same steps over and over. With them, you write a job once, give it a name, and call it whenever you need it. Naming and reusing is most of what programming *is*.`,
      questions: [
        {
          q: 'A function is best described as...',
          choices: [
            'A named machine: input goes in, a result comes out',
            'A kind of number',
            'A box that holds one value',
          ],
          answer: 0,
          why: 'A function takes input, does a job, and returns a result — and you can call it again and again.',
        },
        {
          q: 'In `greet("Jesse")`, what is `"Jesse"`?',
          choices: ['The name of the function', 'The input handed to the function', 'The result'],
          answer: 1,
          why: 'The value in the parentheses is the input you pass in. The function uses it to do its job.',
        },
      ],
      xp: 10,
    },
    {
      id: 'found-l7',
      title: 'What Is a Condition?',
      reading: `A **condition** is a yes/no question the program asks to decide what to do next.

"Is the user logged in?" "Is the cart empty?" "Is age at least 18?" Each is a question with a **boolean** answer — \`true\` or \`false\` — and the program takes a different path depending on which.

This is how software makes decisions. *If* the answer is true, do one thing; otherwise, do another. A program without conditions can only ever do the exact same thing every time.

You don't need the syntax yet. Just hold the shape in your head: **ask a true/false question, then branch.** Everything from a login screen to a video game boss is built out of that one idea, repeated.`,
      questions: [
        {
          q: 'What kind of answer does a condition produce?',
          choices: ['A number', 'A true or false (boolean)', 'A piece of text'],
          answer: 1,
          why: 'A condition is a yes/no question — its answer is a boolean, true or false, and the program branches on it.',
        },
        {
          q: 'Why does a program need conditions?',
          choices: [
            'To make decisions and take different paths',
            'To store values',
            'To run faster',
          ],
          answer: 0,
          why: 'Conditions let a program choose. Without them it would do the identical thing every single time.',
        },
      ],
      xp: 10,
    },
    {
      id: 'found-l8',
      title: 'What Is a Loop?',
      reading: `A **loop** repeats a set of steps, so you don't have to write them out over and over.

Say you want to greet 100 people. You could write \`greet\` 100 times — or you could write it once inside a loop that says "do this 100 times." Same result, far less code, and it works for 100 or 100,000.

Every loop has two parts to watch: the **steps** it repeats, and the **stopping point**. A loop with no stopping point runs forever — that's the famous "infinite loop," and it's one of the first bugs everyone writes.

The mental model: *repeat these steps until it's time to stop.* Counting, going through a list, retrying until something works — all loops.`,
      questions: [
        {
          q: 'What is a loop for?',
          choices: [
            'Repeating steps without copying them out by hand',
            'Naming a value',
            'Asking a yes/no question',
          ],
          answer: 0,
          why: 'A loop repeats steps for you — write them once, run them many times.',
        },
        {
          q: 'What happens if a loop has no stopping point?',
          choices: ['It runs once', 'It runs forever (infinite loop)', 'It refuses to start'],
          answer: 1,
          why: 'Without a stopping point a loop repeats forever — the classic infinite loop. Every loop needs a way to end.',
        },
      ],
      xp: 10,
    },
    {
      id: 'found-l9',
      title: 'What Is a Bug?',
      reading: `A **bug** is when a program does something you didn't intend.

Here's the key mindset, and it takes a while to accept: the computer is almost never "wrong." It did *exactly* what the code said. The bug is the gap between what you *said* and what you *meant*.

So debugging isn't magic or luck. It's detective work: figure out what the program actually did, compare it to what you wanted, and find the one instruction where they split apart. Good engineers aren't people who don't write bugs — everyone writes bugs. They're people who are calm and systematic about finding them.

The single most useful habit: don't guess. Look. Make the program show you what it's actually doing, then trust what you see over what you assumed.`,
      questions: [
        {
          q: 'When a program has a bug, usually...',
          choices: [
            'The computer made a random mistake',
            'The code did exactly what it said, which was not what you meant',
            'The computer is broken',
          ],
          answer: 1,
          why: 'The machine follows the code literally. A bug is the gap between what you said and what you meant.',
        },
        {
          q: 'What is the most useful debugging habit?',
          choices: [
            "Guess what's wrong and change things fast",
            'Make the program show you what it actually does, then look',
            'Rewrite everything from scratch',
          ],
          answer: 1,
          why: 'Do not guess — observe. Get evidence of what the program really did, and trust it over your assumptions.',
        },
      ],
      xp: 10,
    },
    {
      id: 'found-l10',
      title: 'Ready to Write Code',
      reading: `You now have the whole vocabulary. Let's put it in one place:

- **Program** — ordered instructions a computer follows exactly.
- **Value** — one piece of data.
- **Type** — number, string (text), or boolean (true/false).
- **Variable** — a name for a value, so you can reuse it.
- **Expression** — code that produces a value.
- **Function** — a named machine: input in, result out.
- **Condition** — a true/false question the program branches on.
- **Loop** — repeat steps until it's time to stop.
- **Bug** — the gap between what you said and what you meant.

That's it. Everything in the **Intermediate** tier is these nine ideas, combined and typed out as real JavaScript. You won't be memorizing new magic — you'll be spelling out ideas you already understand.

When you're ready, head to **Intermediate** and write your first real line of code. You've earned it.`,
      questions: [
        {
          q: 'What comes next after Foundations?',
          choices: [
            'The Intermediate tier — writing these same ideas as real code',
            'Nothing, this is the end',
            'Starting over',
          ],
          answer: 0,
          why: 'Intermediate takes these nine ideas and has you type them as real JavaScript. Same ideas, now hands-on.',
        },
      ],
      xp: 15,
    },
  ],
};

export default [foundations];
