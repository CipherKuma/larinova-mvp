import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listAuthUsers() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log('\n=== Authenticated Users ===\n');

    if (!data.users || data.users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Total users: ${data.users.length}\n`);

    data.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.created_at}`);
      console.log(`   Last sign in: ${user.last_sign_in_at || 'Never'}`);
      console.log(`   Confirmed: ${user.confirmed_at ? 'Yes' : 'No'}`);
      if (user.user_metadata?.full_name) {
        console.log(`   Full Name: ${user.user_metadata.full_name}`);
      }
      console.log('');
    });
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

listAuthUsers();
