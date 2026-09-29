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
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log("Checking Supabase project connection...");

  // Check sarees table image_url column
  const { error: tableError } = await supabase
    .from("sarees")
    .select("image_url")
    .limit(1);

  const hasImageUrlColumn = !tableError;
  console.log("image_url column in public.sarees:", hasImageUrlColumn ? "EXISTS" : tableError?.message);

  // Check storage buckets
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.log("List buckets error:", bucketError.message);
  } else {
    console.log("Existing buckets:", (buckets || []).map((b) => ({ id: b.id, name: b.name, public: b.public })));
  }
}

check();
