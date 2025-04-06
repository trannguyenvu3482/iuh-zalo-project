 /**
 * Supabase Initialization Script
 * Runs on application startup to check and setup Supabase storage
 */
const setupSupabaseStorage = require('./setupSupabase');
const { createClient } = require('@supabase/supabase-js');

/**
 * Initialize Supabase storage services
 * Checks environment variables and bucket setup
 */
async function initSupabase() {
  console.log('🔧 Initializing Supabase storage...');
  
  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Missing Supabase environment variables. File uploads may not work correctly.');
    console.warn('   Add SUPABASE_URL and SUPABASE_SERVICE_KEY to your .env file');
    return false;
  }
  
  try {
    // Check connection
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      console.warn('⚠️ File uploads will not work correctly. Check your Supabase configuration.');
      return false;
    }
    
    // Run bucket setup
    await setupSupabaseStorage();
    
    console.log('✅ Supabase storage initialization complete');
    return true;
  } catch (error) {
    console.error('❌ Supabase initialization error:', error.message);
    console.warn('⚠️ File uploads may not work correctly. Check your Supabase configuration.');
    return false;
  }
}

module.exports = initSupabase;