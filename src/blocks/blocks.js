// Custom kid blocks + their real-JavaScript generators.
// iconMode (Sprout, ages 5-7): emoji-only labels. Explorer: emoji + words.
// 'repeat' in a level's allowedBlocks maps to Blockly's built-in loop block.
import * as Blockly from 'blockly';
import { javascriptGenerator } from 'blockly/javascript';

const DEFS = [
  { type: 'move_forward', icon: '⬆️', text: 'move forward', colour: 210, code: 'moveForward();\n' },
  { type: 'turn_left', icon: '↪️', text: 'turn left', colour: 40, code: 'turnLeft();\n' },
  { type: 'turn_right', icon: '↩️', text: 'turn right', colour: 40, code: 'turnRight();\n' },
  { type: 'collect_gem', icon: '💎', text: 'collect gem', colour: 290, code: 'collectGem();\n' },
];

export function defineBlocks(iconMode) {
  for (const d of DEFS) {
    Blockly.Blocks[d.type] = {
      init() {
        this.jsonInit({
          type: d.type,
          message0: iconMode ? d.icon : `${d.icon} ${d.text}`,
          previousStatement: null,
          nextStatement: null,
          colour: d.colour,
        });
      },
    };
    javascriptGenerator.forBlock[d.type] = () => d.code;
  }
  // if / if-else with a sensor dropdown — one block, no boolean-socket
  // fiddling on touch screens. Generates real `if (pathAhead()) {...}`.
  const SENSORS = [
    ['👀 path ahead?', 'pathAhead'],
    ['💎 on gem?', 'onGem'],
  ];
  const condition = (block) => `${block.getFieldValue('COND')}()`;

  Blockly.Blocks['if_do'] = {
    init() {
      this.jsonInit({
        type: 'if_do',
        message0: iconMode ? '🤔 %1' : '🤔 if %1',
        args0: [{ type: 'field_dropdown', name: 'COND', options: SENSORS }],
        message1: iconMode ? '✅ %1' : 'do %1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
      });
    },
  };
  javascriptGenerator.forBlock['if_do'] = (block, gen) =>
    `if (${condition(block)}) {\n${gen.statementToCode(block, 'DO')}}\n`;

  Blockly.Blocks['if_else'] = {
    init() {
      this.jsonInit({
        type: 'if_else',
        message0: iconMode ? '🤔 %1' : '🤔 if %1',
        args0: [{ type: 'field_dropdown', name: 'COND', options: SENSORS }],
        message1: iconMode ? '✅ %1' : 'do %1',
        args1: [{ type: 'input_statement', name: 'DO' }],
        message2: iconMode ? '❌ %1' : 'else %1',
        args2: [{ type: 'input_statement', name: 'ELSE' }],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
      });
    },
  };
  javascriptGenerator.forBlock['if_else'] = (block, gen) =>
    `if (${condition(block)}) {\n${gen.statementToCode(block, 'DO')}} else {\n${gen.statementToCode(block, 'ELSE')}}\n`;

  // Functions, kid-style: two named "moves" (⭐ and 🌙) — a definition block
  // that teaches the move and a call block that runs it. No typing, no
  // naming UI; generates real `function star() {...}` / `star();`.
  // JS hoisting means the definition stack can sit anywhere on the canvas.
  const FUNCS = [
    { def: 'def_star', call: 'call_star', icon: '⭐', label: 'star move', fn: 'star' },
    { def: 'def_moon', call: 'call_moon', icon: '🌙', label: 'moon move', fn: 'moon' },
  ];
  for (const f of FUNCS) {
    Blockly.Blocks[f.def] = {
      init() {
        this.jsonInit({
          type: f.def,
          message0: iconMode ? `🧩 ${f.icon}` : `🧩 teach ${f.icon} ${f.label}`,
          message1: '%1',
          args1: [{ type: 'input_statement', name: 'BODY' }],
          colour: 20,
        });
      },
    };
    javascriptGenerator.forBlock[f.def] = (block, gen) =>
      `function ${f.fn}() {\n${gen.statementToCode(block, 'BODY')}}\n`;

    Blockly.Blocks[f.call] = {
      init() {
        this.jsonInit({
          type: f.call,
          message0: iconMode ? f.icon : `${f.icon} do ${f.label}`,
          previousStatement: null,
          nextStatement: null,
          colour: 20,
        });
      },
    };
    javascriptGenerator.forBlock[f.call] = () => `${f.fn}();\n`;
  }

  javascriptGenerator.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
  javascriptGenerator.addReservedWords(
    'highlightBlock,moveForward,turnLeft,turnRight,collectGem,pathAhead,onGem,star,moon'
  );
}

const TOOLBOX_ENTRIES = {
  repeat: {
    kind: 'block',
    type: 'controls_repeat_ext',
    inputs: { TIMES: { shadow: { type: 'math_number', fields: { NUM: 3 } } } },
  },
};

export function toolboxFor(allowedBlocks) {
  return {
    kind: 'flyoutToolbox',
    contents: allowedBlocks.map(
      (type) => TOOLBOX_ENTRIES[type] ?? { kind: 'block', type }
    ),
  };
}

// The kid-readable JavaScript shown in the </> panel — no highlight plumbing.
export function cleanCode(workspace) {
  const prefix = javascriptGenerator.STATEMENT_PREFIX;
  javascriptGenerator.STATEMENT_PREFIX = null;
  try {
    return javascriptGenerator.workspaceToCode(workspace);
  } finally {
    javascriptGenerator.STATEMENT_PREFIX = prefix;
  }
}
