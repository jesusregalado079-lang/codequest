// Week 19: source wording, independent arithmetic, schedule, rendering, and grading.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { renderSheetArticle, weekVerse } = await import('../src/daily/sheet-view.js');
const { gradeSuggestion } = await import('../src/daily/parent-view.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const SUBJECTS = [['math', 'word-problems', 'bible-reading'], ['math', 'codequest'], ['codequest', 'bible-reading'], ['math', 'word-problems'], ['math', 'word-problems', 'bible-reading']];
const COUNTS = { standard: [[11,6,3],[11,3],[3,1],[9,7],[9,8,3]], guided: [[8,7,3],[8,3],[3,1],[8,7],[8,7,3]] };
const WORDS = ['gods','idols','name','Sabbath','mother','murder','faithful','steal','lie','covet'];
const VERSE = "1. Have no other ___.\n2. Do not make ___.\n3. Do not misuse God's ___.\n4. Keep the ___ day holy.\n5. Honor your father and ___.\n6. Do not ___ another person.\n7. Be ___ in marriage.\n8. Do not ___ anything.\n9. Do not ___ about others.\n10. Do not ___ what belongs to others.";
const BIBLE = {"monday": [["q1", "God told Jonah to go to the big city of Nineveh. What did Jonah do?", "He obeyed and left for Nineveh right away", "He ran the other way, on a ship to Tarshish", "He stayed home and waited for God to change His mind", "B", "Jonah 1:1-3. God told Jonah to go to Nineveh and speak against it. Jonah ran the other way and boarded a ship to Tarshish."], ["q2", "A huge storm hit the ship. What did Jonah tell the sailors to do?", "Sail faster to the next town", "Tie him to the mast", "Throw him into the sea", "C", "Jonah 1:11-12. Jonah told the sailors to pick him up and throw him into the sea, because the storm was his fault."], ["q3", "After the sailors threw Jonah into the sea, what happened?", "The storm stopped, and God sent a huge fish to swallow Jonah", "The storm got worse, and the ship sank with everyone on it", "The sailors pulled Jonah back onto the ship and sailed home", "A", "Jonah 1:15-17. The sea stopped raging, and God provided a huge fish that swallowed Jonah. Jonah was inside it three days and three nights."]], "friday": [["q1", "How did Jonah feel when God did not destroy Nineveh?", "Very happy", "Scared", "Very angry", "C", "Jonah 4:1. Jonah was very upset and angry that God spared Nineveh."], ["q2", "Jonah said he ran away at the start because he knew something about God. What was it?", "That God is kind and slow to anger, and would forgive Nineveh", "That God was too weak to protect him from the storm at sea", "That God had forgotten about all the people of Nineveh", "A", "Jonah 4:2. Jonah said he knew God is gracious and compassionate, slow to anger and full of love, and that is why he ran away to Tarshish."], ["q3", "At the end, God asked Jonah a question about Nineveh. What was it?", "Why did you not warn the great city of Nineveh sooner, Jonah?", "Should I not care about the great city of Nineveh, with all its people?", "Will you build a high wall around the great city of Nineveh?", "B", "Jonah 4:11. God asked whether He should not care about the great city, which had more than 120,000 people and also many animals. The book ends with God's question and no answer from Jonah, on purpose. In 4:3 and 4:8 Jonah says it would be better for him to die. If a boy asks, you could say Jonah was so upset that he said things he should not have said, and God did not agree with him. God's reply in 4:4 and 4:9 is a question: is it right for you to be angry?"]]};
const BIBLE_NOTE = "A good answer says the fish spit Jonah out onto dry land (Jonah 2:10), and the people of Nineveh believed God, went without food, put on rough clothing called sackcloth, and turned from their evil ways (Jonah 3:5-10). God saw this and did not destroy them. One thing about the fish and one thing Nineveh did is enough. If the boys ask: Jonah went to Nineveh the second time after God spoke to him again (3:1-3), and the king of Nineveh did it too (3:6).";
const bibleHowto = (ref, choice) => `Open your own Bible to ${ref} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then ${choice ? 'answer the three questions below by picking the best answer for each one. If you are not sure, go back to your Bible and look again.' : 'answer the question below in your own words. Using your own words shows that you understood it, so you do not need to copy the verses.'}`;
const forbidden = /\b(?:easy|hard|guided|standard|Jesse|Dad|UNSURE|INTENTIONAL REPEAT)\b/i;
const cents = (v) => { const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(v)); assert.ok(m, 'money: '+v); return BigInt(m[1])*100n+BigInt((m[2]||'').padEnd(2,'0')); };
const checkCents = (item, value, label) => { assert.equal(item.kind,'numeric',label); assert.equal(cents(item.answer),value,label); };
const caseKey = (id) => /^(\d+)/.exec(id)[1];
const groups = (sheet) => { const result = {}; for (const item of sheet.items) (result[caseKey(item.id)] ||= []).push(item); return result; };
const scenario = (items) => items.find((i) => /\$\d/.test(i.prompt) && /\d+%/.test(i.prompt))?.prompt;
const amountRate = (prompt) => { const a=/\$(\d+(?:\.\d{1,2})?)/.exec(prompt), p=/(\d+)%/.exec(prompt); assert.ok(a&&p,prompt); return [cents(a[1]),BigInt(p[1])]; };
const questionTarget = (prompt, source) => {
  if (/How much (?:is the tax|is the tip|do you save)/i.test(prompt)) return 'part';
  if (/What is the final cost/i.test(prompt)) return 'final';
  if (/What is 1\./.test(prompt) || /What is the total|total with the tip/i.test(prompt)) return 'up';
  if (/What is 0\./.test(prompt) || /How much do you pay|sale price/i.test(prompt)) return 'down';
  assert.fail('unknown target: '+prompt+' / '+source);
};
const expectedOption = (target, source) => {
  if (target==='final') return /final cost after/.test(source);
  if (target==='part') return /(?:the tax|the tip|how much you save)/.test(source);
  if (target==='up') return /(?:the total price|the total with the tip)/.test(source);
  return /(?:how much you pay|the sale price only)/.test(source);
};
const checkOlder = (sheet) => {
  for (const [key, items] of Object.entries(groups(sheet))) {
    if (!items.some((i)=>i.kind==='numeric')) continue;
    const source = scenario(items);
    assert.ok(source, sheet.title+'/'+key+' scenario');
    const [price, rate] = amountRate(source);
    const down = /\b(?:off|sale|discount|coupon)\b/i.test(source);
    const numerics = items.filter((i)=>i.kind==='numeric');
    for (const item of numerics) {
      let expected;
      const target=questionTarget(item.prompt,source);
      if (target==='final') {
        const tax=/(\d+)%/.exec(item.prompt); assert.ok(tax,item.prompt);
        const sale=price*(100n-rate)/100n; expected=sale*(100n+BigInt(tax[1]))/100n;
      } else expected=target==='part' ? price*rate/100n : price*(down ? 100n-rate : 100n+rate)/100n;
      checkCents(item,expected,sheet.title+'/'+key+'/'+item.id);
    }
    if (numerics.some((i)=>/Route 2/.test(i.prompt))) assert.equal(cents(numerics[numerics.length-1].answer),cents(numerics[numerics.length-2].answer),key+' route agreement');
    for (const item of items.filter((i)=>i.kind==='fill-blank')) {
      assert.equal(item.prompt.includes('___'),false); assert.deepEqual(item.wordBank,['up','down']);
      assert.deepEqual(item.answer,[down?'down':'up']);
    }
    const choice=items.find((i)=>i.kind==='multiple-choice');
    if (choice) {
      // The problem is shown first, then the question about it (the plan listed the asking line before the story).
      const lines=choice.prompt.split('\n');
      assert.equal(lines.length,2,key+' ask prompt is story + ask'); assert.equal(lines[1],'What is the question asking for?'); assert.equal(choice.choices.length,3);
      const firstCalc=numerics[0].prompt;
      assert.ok(lines[0].includes(firstCalc.match(/\$\d+/)[0])&&lines[0].includes(firstCalc.match(/\d+%/)[0])&&lines[0].endsWith('?'),key+' problem shown before the ask');
      if (!numerics.some((i)=>/^Route |^Then /.test(i.prompt))) assert.equal(lines[0],firstCalc,key+' plain problem repeated exactly');
      const target=questionTarget(numerics[numerics.length-1].prompt,source);
      assert.equal(expectedOption(target,choice.choices[choice.answer.charCodeAt(0)-65].toLowerCase()),true,sheet.title+'/'+key+' choice points to '+target);
    }
  }
};
const operation = (story) => /\b(?:gives?|spends?)\b/i.test(story) ? 'B' : /\b(?:gets?|wins?)\b.*\bmore\b/i.test(story) ? 'A' : 'C';
const checkYounger = (sheet) => {
  if (sheet.subject==='math') {
    for (const item of sheet.items.filter((i)=>i.kind==='numeric')) {
      const m=/(\d+) × (\d+) =/.exec(item.prompt); assert.ok(m,item.prompt);
      const a=BigInt(m[1]),b=BigInt(m[2]); assert.equal(BigInt(item.answer),a*b,item.id);
      const terms=[...item.prompt.matchAll(/\((\d+) × (\d+)\)/g)].map((x)=>BigInt(x[1])*BigInt(x[2]));
      if (terms.length) assert.equal(terms.reduce((x,y)=>x+y,0n),a*b,item.id+' split');
      const partial=/(\d+) × (\d+) = (\d+) \+ ___ \+ (\d+)/.exec(item.prompt);
      if (partial) assert.equal(BigInt(partial[3])+a*BigInt(String(b).slice(1,2))*10n+BigInt(partial[4]),a*b,item.id+' middle');
    }
    assert.ok(sheet.intro.startsWith('Strategy card. 4s: double the 2s, or 5 groups minus 1 group. 6s: 5 groups plus 1 group. 7s: 5 groups plus 2 groups. 8s: double the 4s. 9s: 10 groups minus 1 group.\n\n'));
    if (sheet.items.some((i)=>i.kind==='scale')) { const scale=sheet.items[sheet.items.length-1]; assert.equal(scale.kind,'scale'); assert.equal(scale.scaleMax,5); }
  } else {
    for (const [key, items] of Object.entries(groups(sheet))) {
      const story=items.find((i)=>/\d/.test(i.prompt) && /\b(?:has|makes)\b/.test(i.prompt))?.prompt || items[0].prompt;
      const nums=[...story.matchAll(/\b\d+\b/g)].map((m)=>BigInt(m[0])); assert.equal(nums.length,2,story);
      const op=operation(story);
      const value=op==='A'?nums[0]+nums[1]:op==='B'?nums[0]-nums[1]:nums[0]*nums[1];
      for (const item of items.filter((i)=>i.kind==='numeric')) assert.equal(BigInt(item.answer),value,item.id);
      const choice=items.find((i)=>i.kind==='multiple-choice'); if (choice) { assert.deepEqual(choice.choices,['Add','Take away','Multiply']); assert.ok(choice.prompt.endsWith('What do you need to do?')); assert.equal(choice.answer,op); }
    }
  }
};
for (const track of ['standard','guided']) {
  const w=DAILY_WORK[track].weeks['week-19']; assert.equal(w.id,'week-19'); assert.equal(w.label,'Week 19'); assert.equal(w.assignedWeekOf,'2026-11-16');
  assert.equal('breakWeek' in w,false); assert.equal('celebration' in w,false);
  assert.equal(currentWeek(DAILY_WORK,track,'2026-11-15').id,'week-18');
  for (const date of ['2026-11-16','2026-11-17','2026-11-18','2026-11-19','2026-11-20','2026-11-21','2026-11-22']) assert.equal(currentWeek(DAILY_WORK,track,date).id,'week-19');
  assert.equal(currentWeek(DAILY_WORK,track,'2026-11-23'),null);
  assert.deepEqual(DAYS.map((d)=>w.days[d].sheets.map((s)=>s.subject)),SUBJECTS);
  assert.deepEqual(DAYS.map((d)=>w.days[d].sheets.map((s)=>s.items.length)),COUNTS[track]);
  assert.equal(w.weekItems.length,1); const verse=w.weekItems[0]; assert.equal(verse.title,'Memory Verse'); assert.equal(verse.subject,'memory-verse'); assert.equal(verse.items.length,1);
  assert.equal(verse.items[0].prompt,VERSE); assert.equal(verse.items[0].prompt.split('___').length-1,10); assert.deepEqual(verse.items[0].wordBank,WORDS); assert.deepEqual(verse.items[0].answer,WORDS);
  assert.equal(verse.citation,'The Ten Commandments (Exodus 20:3-17)'); assert.equal(weekVerse(w).citation,verse.citation); assert.ok(weekVerse(w).html.includes("gods</strong>")); assert.equal(weekVerse(w).html.split("\n").length,10);
  for (const day of DAYS) for (const sheet of w.days[day].sheets) {
    assert.equal(new Set(sheet.items.map((i)=>i.id)).size,sheet.items.length);
    if (['math','word-problems'].includes(sheet.subject)) { assert.ok(sheet.intro); assert.ok(sheet.example); assert.equal(/^\d+\. /m.test(sheet.example),false); assert.equal(sheet.example.includes('INTENTIONAL REPEAT'),false); track==='standard'?checkOlder(sheet):checkYounger(sheet); }
    if (sheet.subject==='codequest') assert.deepEqual(sheet,DAILY_WORK[track].weeks['week-18'].days.tuesday.sheets[1]);
    if (sheet.subject==='bible-reading') {
      const ref=day==='monday'?'Jonah 1:1-17':day==='wednesday'?'Jonah 2:1-3:10':'Jonah 4:1-11';
      assert.equal(sheet.title,'Bible Reading: '+ref); assert.equal(sheet.intro,bibleHowto(ref,day!=='wednesday'));
      if (day==='wednesday') { assert.equal(sheet.items[0].id,'reflect'); assert.equal(sheet.items[0].kind,'long-text'); assert.equal(sheet.items[0].parentNote,BIBLE_NOTE); assert.equal(sheet.items[0].prompt,"After Jonah prayed inside the fish, what did the fish do? And what did the people of Nineveh do when they heard God's message? Write "+(track==='guided'?'1 or 2':'2')+' sentences.'); }
      else sheet.items.forEach((item,i)=>{ const row=BIBLE[day][i]; assert.deepEqual([item.id,item.prompt,...item.choices,item.answer,item.parentNote],row); const right=item.choices[item.answer.charCodeAt(0)-65].length; const wrong=Math.max(...item.choices.filter((_,j)=>j!==item.answer.charCodeAt(0)-65).map((x)=>x.length)); assert.ok(right*10<=wrong*12 && right*10>=wrong*7); });
    }
    const kid=[sheet.title,sheet.intro||'',sheet.example||'',...sheet.items.flatMap((i)=>[i.prompt,...(i.wordBank||[]),...(i.choices||[])])].join(' '); assert.equal(forbidden.test(kid),false,day+'/'+sheet.title);
    const html=renderSheetArticle(w,day,sheet,{sheets:{},submittedAt:null},false,()=>0,()=>false);
    const noNotes={...sheet,items:sheet.items.map(({parentNote,...i})=>i)};
    assert.equal(html,renderSheetArticle(w,day,noNotes,{sheets:{},submittedAt:null},false,()=>0,()=>false));
    for (const item of sheet.items) { assert.ok(item.parentNote); if (!kid.includes(item.parentNote)) assert.equal(html.includes(item.parentNote),false); assert.notEqual(item.unit,'percent'); assert.deepEqual(item.wordBank?.filter((w)=>w==='more'||w==='less')||[],[]); }
  }
}
assert.deepEqual(DAILY_WORK.standard.weeks['week-19'].weekItems,DAILY_WORK.guided.weeks['week-19'].weekItems);
const taxed=DAILY_WORK.standard.weeks['week-19'].days.monday.sheets[1].items.find((i)=>i.id==='1b');
assert.equal(taxed.answer,6.6); assert.equal(gradeSuggestion(taxed,'6.60'),true); assert.equal(gradeSuggestion(taxed,'6.6'),true); assert.equal(gradeSuggestion(taxed,'6.61'),false);
console.log('Week 19 source, arithmetic, structure, schedule, and render: passed');
