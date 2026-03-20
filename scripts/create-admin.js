const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dqrgfzfpayobzffwstsx.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcmdmemZwYXlvYnpmZndzdHN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg1NjY3OSwiZXhwIjoyMDgxNDMyNjc5fQ.f0YEldQVpjpyZNijMurEV8rMEaTstz9Rn_9A94wpEy0';

async function createAdminUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const adminEmail = 'admin@chazon.com';
  const adminPassword = 'password123';

  console.log('Creating admin user in Supabase Auth...');

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === adminEmail);

    if (userExists) {
      console.log('Admin user already exists in Supabase Auth');

      // Get the user ID
      const admin = existingUser.users.find(u => u.email === adminEmail);
      console.log('Admin user ID:', admin.id);
      return;
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Chazon Admin',
        role: 'ADMIN',
      },
    });

    if (error) {
      console.error('Error creating admin user:', error.message);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Admin user ID:', data.user.id);
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdminUser();
