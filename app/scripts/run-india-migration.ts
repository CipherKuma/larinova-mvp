import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config();

async function runMigration() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabase.rpc("exec_sql", {
    sql: `
      ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS phone_number text;
      ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS degrees text;
      ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS registration_number text;
      ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS registration_council text;
      ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS clinic_name text;
      ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS clinic_address text;
    `,
  });

  if (error) {
    console.error("Migration failed:", error);
    // Try individual statements if batch fails
    const statements = [
      "ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS phone_number text",
      "ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS degrees text",
      "ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS registration_number text",
      "ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS registration_council text",
      "ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS clinic_name text",
      "ALTER TABLE larinova_doctors ADD COLUMN IF NOT EXISTS clinic_address text",
    ];

    for (const sql of statements) {
      const { error: stmtError } = await supabase.rpc("exec_sql", { sql });
      if (stmtError) {
        console.error(`Failed: ${sql}`, stmtError);
      } else {
        console.log(`OK: ${sql}`);
      }
    }
  } else {
    console.log("Migration completed successfully!");
  }
}

runMigration();
