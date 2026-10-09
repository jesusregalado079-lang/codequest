// CompTIA Security+ SY0-801 (V8): its blueprint (blueprints.js) with its question bank. Loaded on demand by
// registry.js, so the bank is its own chunk and only exam routes fetch it.
import bank from './secplus-801-bank.js';
import { SECPLUS_801, examModule } from './blueprints.js';

const exam = examModule(SECPLUS_801, bank);
export const blueprint = SECPLUS_801;
export const { questions, sources, byId } = exam;

export default exam;
