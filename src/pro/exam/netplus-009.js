// CompTIA Network+ N10-009 (V9): its blueprint (blueprints.js) with its question bank, loaded on demand (registry.js).
import bank from './netplus-009-bank.js';
import { NETPLUS_009, examModule } from './blueprints.js';

const exam = examModule(NETPLUS_009, bank);
export const blueprint = NETPLUS_009;
export const { questions, sources, byId } = exam;

export default exam;
