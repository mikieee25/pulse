import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

async function run() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log("Creating user...");
  const { data, error } = await admin.auth.admin.createUser({
    email: "test_new_user123@doe.gov.ph",
    password: "Password123!",
    email_confirm: true,
  });

  if (error) {
    console.error("Auth error:", error);
  } else {
    console.log("User created:", data.user?.id);
    const { error: profileError } = await admin.from("app_users").insert({
      id: data.user!.id,
      email: "test_new_user123@doe.gov.ph",
      full_name: "Test User",
      role: "Viewer",
      division_scope: null,
    });
    if (profileError) {
      console.error("Profile error:", profileError);
    } else {
      console.log("Profile created!");
    }
  }
}

run();
