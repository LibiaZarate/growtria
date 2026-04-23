import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  console.log("Testing insert...");
  const res = await supabase.from('doctors').insert({ clerk_user_id: 'test-uuid-123', name: 'Doctor' }).select().single();
  console.log(res);
}
test();
