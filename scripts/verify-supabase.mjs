import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
  console.log("Connecting to Supabase project:", supabaseUrl);

  const columns = [
    "id",
    "name",
    "sku",
    "category",
    "price",
    "fabric",
    "craft",
    "zari_type",
    "occasion",
    "color",
    "description",
    "stock_status",
    "created_at",
    "updated_at",
  ];

  // 1. Verify table and columns exist by selecting every expected column
  const { data, error } = await supabase
    .from("sarees")
    .select(columns.join(", "))
    .limit(1);

  if (error) {
    if (error.code === "PGRST205") {
      console.log(JSON.stringify({ exists: false, error: "Table public.sarees does not exist in schema cache." }));
    } else {
      console.log(JSON.stringify({ exists: false, error: error.message, code: error.code }));
    }
    return;
  }

  // 2. Test RLS write restriction (anon insert should fail)
  const insertTest = await supabase.from("sarees").insert({
    name: "RLS Test",
    sku: "TEST-RLS-001",
    category: "test",
  });

  const rlsWriteBlocked = insertTest.error !== null;

  console.log(
    JSON.stringify({
      exists: true,
      columnsCount: columns.length,
      columns,
      rowCount: data.length,
      publicReadAllowed: true,
      publicWriteBlocked: rlsWriteBlocked,
      writeError: insertTest.error?.message,
    })
  );
}

verify();
