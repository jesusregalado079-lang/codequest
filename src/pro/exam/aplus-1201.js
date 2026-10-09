// CompTIA A+ Core 1 220-1201 (V15): its blueprint (blueprints.js) with its question bank, loaded on demand (registry.js).
import bank from './aplus-1201-bank.js';
import { APLUS_1201, examModule } from './blueprints.js';

const exam = examModule(APLUS_1201, bank);
export const blueprint = APLUS_1201;
export const { questions, sources, byId } = exam;

export default exam;
