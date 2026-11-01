// Built-in paid jobs. IDs are shared across tracks; each iPad chooses its own track.
const shared = [
  ['trash', '🗑️', 'Take out trash', 'Sacar la basura', 75],
  ['vacuum', '🧹', 'Vacuum or sweep', 'Aspirar o barrer', 100],
  ['counters', '🧽', 'Wipe the counters', 'Limpiar el lavabo', 75],
  ['table', '🍽️', 'Set & clear the table', 'Poner y recoger la mesa', 50],
  ['living-room', '🛋️', 'Tidy the living room', 'Ordenar la sala', 100],
  ['groceries', '🛒', 'Unload groceries', 'Ayudar con las compras', 75],
  ['litter', '🐱', 'Clean the litter box', 'Limpiar la caja del gato', 50],
  ['dishwasher', '🫧', 'Dishwasher: load or unload', 'Lavaplatos: llenar y vaciar', 75],
  ['dinner', '🍳', 'Help make dinner', 'Ayudar a hacer la cena', 100],
  ['massage', '🦶', 'Foot massage for Mom', 'Masaje de pies para mamá', 200],
];
const younger = [
  ['laundry-fold', '🧺', 'Fold & put away laundry', 'Doblar y guardar la ropa', 150],
  ['verse', '📖', 'Say my memory verse', 'Recitar el versículo de memoria', 150],
];
const older = [
  ['laundry-full', '🧺', 'Wash, dry & fold a full load', 'Lavar, secar y doblar la ropa', 250],
  ['verse', '📖', 'Say my memory verse', 'Recitar el versículo de memoria', 250],
];
const job = ([id, icon, name, es, cents]) => Object.freeze({ id, icon, name, es, cents });
export const CHORE_CATALOG = Object.freeze({
  guided: Object.freeze([...shared, ...younger].map(job)),
  standard: Object.freeze([...shared, ...older].map(job)),
});
