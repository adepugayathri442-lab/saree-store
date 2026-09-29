import { createClient } from "@supabase/supabase-js";
import fs from "fs";

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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPolicies() {
  console.log("Checking RLS policies on public.sarees...");
  // Querying pg_policies via rpc or check if accessible
  const { data, error } = await supabase
    .from("sarees")
    .select("*");
  console.log("Read sarees count:", data?.length, "error:", error);
}

checkPolicies();
