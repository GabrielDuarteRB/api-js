import db from './database.js';
import './modelIndex.js';

try {
  await db.authenticate();
  await db.sync();
  console.log('Tabelas criadas!');
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await db.close();
}