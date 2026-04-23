import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createTestDoctor() {
  console.log("👨‍⚕️  Creating test doctor account...\n");

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const testEmail = "test.doctor@larinova.com";
  const testPassword = "TestDoctor123!";
  const testName = "Dr. Sarah Johnson";
  const testSpecialization = "Cardiology";
  const testLicense = "MD-12345";

  // Check if doctor already exists
  const { data: existingDoctors } = await supabase
    .from("larinova_doctors")
    .select("*")
    .eq("email", testEmail);

  if (existingDoctors && existingDoctors.length > 0) {
    console.log("ℹ️  Test doctor already exists!");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log(`   Name: ${existingDoctors[0].full_name}`);
    console.log(`   Specialization: ${existingDoctors[0].specialization}\n`);
    console.log("🌐 Sign in at: http://localhost:3001/sign-in\n");
    return;
  }

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

  if (authError) {
    console.error("❌ Error creating auth user:", authError);
    return;
  }

  console.log("✅ Created auth user");

  // Create doctor profile
  const { data: doctorData, error: doctorError } = await supabase
    .from("larinova_doctors")
    .insert({
      user_id: authData.user.id,
      email: testEmail,
      full_name: testName,
      specialization: testSpecialization,
      license_number: testLicense,
    })
    .select()
    .single();

  if (doctorError) {
    console.error("❌ Error creating doctor profile:", doctorError);
    return;
  }

  console.log("✅ Created doctor profile\n");
  console.log("🎉 Test doctor account created successfully!");
  console.log("\n📝 Login credentials:");
  console.log(`   Email: ${testEmail}`);
  console.log(`   Password: ${testPassword}`);
  console.log(`   Name: ${testName}`);
  console.log(`   Specialization: ${testSpecialization}`);
  console.log(`   License: ${testLicense}\n`);
  console.log("🌐 Sign in at: http://localhost:3001/sign-in\n");
}

createTestDoctor();
