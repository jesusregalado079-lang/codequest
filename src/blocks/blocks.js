// Custom kid blocks + their real-JavaScript generators.
// iconMode (Sprout, ages 5-7): emoji-only labels. Explorer: emoji + words.
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

export function toolboxFor(allowedBlocks) {
  return {
    kind: 'flyoutToolbox',
    contents: allowedBlocks.map((type) => ({ kind: 'block', type })),
  };
}
