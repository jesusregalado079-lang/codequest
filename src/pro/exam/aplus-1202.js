// CompTIA A+ Core 2 220-1202 (V15): its blueprint (blueprints.js) with its question bank, loaded on demand (registry.js).
import bank from './aplus-1202-bank.js';
import { APLUS_1202, examModule } from './blueprints.js';

const exam = examModule(APLUS_1202, bank);
export const blueprint = APLUS_1202;
export const { questions, sources, byId } = exam;

export default exam;
