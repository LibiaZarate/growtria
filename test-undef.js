import Database from 'better-sqlite3';
const db = new Database(':memory:');
db.exec('CREATE TABLE foo (a, b, c)');
try {
  db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, 2, undefined);
} catch (e) {
  console.log("Error undefined:", e.message);
}
try {
  db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, undefined, 3);
} catch (e) {
  console.log("Error undefined middle:", e.message);
}
try {
  db.prepare('INSERT INTO foo VALUES (?, ?, ?)').run(1, null, 3);
} catch (e) {
  console.log("Error null middle:", e.message);
}
