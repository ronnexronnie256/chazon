const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dqrgfzfpayobzffwstsx.supabase.co';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcmdmemZwYXlvYnpmZndzdHN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg1NjY3OSwiZXhwIjoyMDgxNDMyNjc5fQ.f0YEldQVpjpyZNijMurEV8rMEaTstz9Rn_9A94wpEy0';

async function setAdminRole() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const adminEmail = 'admin@chazon.com';

  try {
    // Use service role to bypass RLS and update directly
    const { data, error } = await supabase
      .from('User')
      .update({ role: 'ADMIN' })
      .eq('email', adminEmail)
      .select();

    if (error) {
      console.log('Update error:', error.message);

      // If user doesn't exist, create them
      if (error.code === 'PGRST116') {
        console.log('User not found, creating...');

        // Get admin from auth
        const {
          data: { users },
        } = await supabase.auth.admin.listUsers();
        const adminUser = users.find(u => u.email === adminEmail);

        if (adminUser) {
          const { data: newUser, error: createError } = await supabase
            .from('User')
            .insert({
              id: adminUser.id,
              email: adminEmail,
              name: 'Chazon Admin',
              role: 'ADMIN',
              termsAcceptedAt: new Date().toISOString(),
              termsVersion: '1.0',
            })
            .select();

          if (createError) {
            console.log('Create error:', createError.message);
          } else {
            console.log('Created admin user:', newUser);
          }
        }
      }
    } else {
      console.log('Updated admin role:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

setAdminRole();
