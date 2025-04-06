/**
 * Supabase connection check script
 * Run this file directly to test your Supabase setup
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 SUPABASE CONNECTION DIAGNOSTIC TOOL 🔍');
console.log('=========================================\n');

// Check environment variables
console.log('📋 CHECKING ENVIRONMENT VARIABLES:');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let hasErrors = false;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is not set in .env file');
  hasErrors = true;
} else {
  console.log(`✅ SUPABASE_URL: ${supabaseUrl}`);
}

if (!supabaseKey) {
  console.warn('⚠️ SUPABASE_KEY (anon key) is not set in .env file');
  console.log('   This key is used for client-side authentication and might be needed for the frontend');
} else {
  console.log(`✅ SUPABASE_KEY (anon key) is configured`);
}

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY is not set in .env file');
  console.log('   This key is REQUIRED for backend operations to bypass RLS policies');
  hasErrors = true;
} else {
  console.log(`✅ SUPABASE_SERVICE_KEY is configured`);
}

if (hasErrors) {
  console.error('\n❌ Critical configuration errors found. Please fix them before continuing.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set');

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test Supabase connection
async function testConnection() {
  console.log('\n📡 TESTING SUPABASE CONNECTION:');
  
  try {
    // Simple API call to check connection
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error(`❌ Connection failed: ${error.message}`);
      return false;
    }
    
    console.log('✅ Successfully connected to Supabase!');
    return true;
  } catch (error) {
    console.error(`❌ Connection error: ${error.message}`);
    return false;
  }
}

// Check storage buckets
async function checkBuckets() {
  console.log('\n📦 CHECKING STORAGE BUCKETS:');
  
  const requiredBuckets = ['avatars', 'banners', 'messages'];
  let allBucketsOk = true;
  
  for (const bucketName of requiredBuckets) {
    console.log(`\n🔍 Checking bucket '${bucketName}':`);
    
    try {
      // 1. Check if bucket exists
      const { data, error } = await supabase.storage.getBucket(bucketName);
      
      if (error) {
        console.error(`❌ Error: Bucket '${bucketName}' not found or not accessible`);
        console.log(`   Error details: ${error.message}`);
        console.log('   You need to create this bucket in the Supabase dashboard or run the setup script');
        allBucketsOk = false;
        continue;
      }
      
      console.log(`✅ Bucket exists: ${bucketName}`);
      console.log(`   - Public access: ${data.public ? 'Yes ✓' : 'No ✗'}`);
      
      if (!data.public) {
        console.warn(`⚠️ Bucket is not public. This may cause issues with file access.`);
        console.log(`   Update bucket settings in Supabase dashboard to make it public.`);
      }
      
      // 2. Test upload permissions
      console.log(`   Testing upload permission...`);
      const testBuffer = Buffer.from('This is a test file');
      const testFileName = `permission-test-${Date.now()}.txt`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testBuffer, {
          contentType: 'text/plain',
          upsert: true
        });
        
      if (uploadError) {
        console.error(`❌ Upload test failed: ${uploadError.message}`);
        
        if (uploadError.message.includes('row-level security')) {
          console.log(`   This is an RLS policy error. You need to set up proper policies.`);
          console.log(`   Since you're using the service role key, this shouldn't happen.`);
          console.log(`   Make sure you're using the service role key, not the anon key.`);
        }
        
        allBucketsOk = false;
        continue;
      }
      
      console.log(`   ✅ Upload permission test: PASSED`);
      
      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(uploadData.path);
      
      console.log(`   ✅ Public URL available: ${publicUrl}`);
      
      // 4. Test delete permission
      console.log(`   Testing delete permission...`);
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([uploadData.path]);
        
      if (deleteError) {
        console.warn(`⚠️ Delete test failed: ${deleteError.message}`);
        console.log(`   This is not critical but might cause issues when updating files.`);
      } else {
        console.log(`   ✅ Delete permission test: PASSED`);
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error with bucket '${bucketName}': ${error.message}`);
      allBucketsOk = false;
    }
  }
  
  return allBucketsOk;
}

// Provide recommendations
function showRecommendations(connectionOk, bucketsOk) {
  console.log('\n📝 RECOMMENDATIONS:');
  
  if (!connectionOk) {
    console.log('1. Check your Supabase URL and service key in the .env file');
    console.log('2. Verify that your Supabase project is active and running');
    console.log('3. Make sure your IP is not blocked by Supabase');
  }
  
  if (!bucketsOk) {
    console.log('1. Run the setupSupabase.js script to create missing buckets:');
    console.log('   > node app/utils/setupSupabase.js');
    console.log('2. Manually configure bucket policies in Supabase dashboard:');
    console.log('   - Go to Supabase dashboard -> Storage -> [bucket] -> Policies');
    console.log('   - Add policies for SELECT, INSERT, UPDATE, DELETE operations');
    console.log('   - Use "bucket_id = \'[bucket_name]\'" as the policy definition');
    console.log('3. Make sure your buckets are set to public in the bucket settings');
  }
  
  if (connectionOk && bucketsOk) {
    console.log('✅ Your Supabase storage setup looks good!');
    console.log('   Your application should be able to upload and access files correctly.');
  }
}

// Run all checks
async function runDiagnostics() {
  console.log('\n💉 Starting Supabase diagnostics...\n');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.error('\n❌ Connection test failed. Cannot proceed with bucket checks.');
    showRecommendations(false, false);
    process.exit(1);
  }
  
  const bucketsOk = await checkBuckets();
  
  console.log('\n=========================================');
  if (connectionOk && bucketsOk) {
    console.log('✅ ALL CHECKS PASSED! Your Supabase setup is ready to use.');
  } else {
    console.log('⚠️ SOME CHECKS FAILED. See recommendations below.');
  }
  
  showRecommendations(connectionOk, bucketsOk);
}

// Execute if run directly
if (require.main === module) {
  runDiagnostics().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testConnection, checkBuckets, runDiagnostics }; 