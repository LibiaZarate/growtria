import Database from 'better-sqlite3';
const db = new Database('database.sqlite');

try {
  const tableInfo = db.prepare("PRAGMA table_info(hub_pages)").all() as any[];
  console.log("Columns:", tableInfo.map(c => c.name).join(", "));
  
  const rows = db.prepare("SELECT * FROM hub_pages").all();
  console.log("Rows:", rows.length);
  if(rows.length > 0) {
    console.log("First row keys:", Object.keys(rows[0]));
    console.log("First row JSON fields:", {
      products: (rows[0] as any).products_json,
      certs: (rows[0] as any).certifications_json
    });
  }
} catch (e: any) {
  console.error("Error:", e.message);
}
