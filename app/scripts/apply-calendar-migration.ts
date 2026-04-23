import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = fs.readFileSync(
  path.join(
    __dirname,
    "../supabase/migrations/20260413000000_calendar_booking.sql",
  ),
  "utf-8",
);

// Split on statement boundaries and run each
async function main() {
  const { error } = await (supabase as any).rpc("exec_sql", { sql });
  if (error) {
    // exec_sql not available — fall through to management API approach
    console.log(
      "exec_sql not available, try running the migration manually in Supabase dashboard.",
    );
    console.log("\nSQL to run:\n");
    console.log(sql);
    process.exit(1);
  }
  console.log("Migration applied successfully!");
}

main();
