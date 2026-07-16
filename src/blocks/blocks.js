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
  javascriptGenerator.STATEMENT_PREFIX = 'highlightBlock(%1);\n';
  javascriptGenerator.addReservedWords(
    'highlightBlock,moveForward,turnLeft,turnRight,collectGem'
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
