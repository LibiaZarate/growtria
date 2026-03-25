const Database = require('better-sqlite3');
const db = new Database('dev.db');

try {
  const tableInfo = db.prepare("PRAGMA table_info(hub_pages)").all();
  console.log("Columns:", tableInfo.map(c => c.name).join(", "));
  
  const rows = db.prepare("SELECT * FROM hub_pages").all();
  console.log("Rows:", rows.length);
  if(rows.length > 0) {
    console.log("First row:", rows[0]);
  }
} catch (e) {
  console.error("Error:", e.message);
}
