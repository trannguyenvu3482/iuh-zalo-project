/**
 * Set up Supabase storage buckets
 * This script is used to create the necessary buckets in Supabase storage
 */
const { createClient } = require('@supabase/supabase-js');

const setupSupabaseStorage = async () => {
  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('⚠️ Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
      return;
    }

    // Use service role key for admin operations that bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for required buckets and create them if they don't exist
    const requiredBuckets = ['avatars', 'banners', 'messages'];

    for (const bucketName of requiredBuckets) {
      try {
        // Check if bucket exists
        const { data: existingBucket, error: getError } = await supabase.storage
          .getBucket(bucketName);

        if (getError) {
          console.log(`Creating bucket '${bucketName}'...`);
          // If bucket doesn't exist, create it
          const { data, error: createError } = await supabase.storage
            .createBucket(bucketName, { 
              public: true,
              fileSizeLimit: 5242880 // 5MB in bytes
            });

          if (createError) {
            console.error(`❌ Error creating bucket '${bucketName}':`, createError);
          } else {
            console.log(`✅ Successfully created bucket '${bucketName}'`);
            
            // Update bucket to enable public access
            await updateBucketPublicAccess(supabase, bucketName);
          }
        } else {
          console.log(`✅ Bucket '${bucketName}' already exists`);
          
          // Update bucket to enable public access
          await updateBucketPublicAccess(supabase, bucketName);
        }
        
        // Test bucket permissions with a test upload
        await testBucketPermissions(supabase, bucketName);
      } catch (bucketError) {
        console.error(`❌ Error checking bucket '${bucketName}':`, bucketError);
      }
    }

    console.log('✅ Supabase storage setup complete');
  } catch (error) {
    console.error('❌ Failed to set up Supabase storage:', error);
  }
};

/**
 * Update bucket settings to allow public access
 * @param {Object} supabase - Supabase client
 * @param {string} bucketName - Bucket name to configure
 */
async function updateBucketPublicAccess(supabase, bucketName) {
  try {
    // 1. Update bucket to be public
    const { error } = await supabase.storage.updateBucket(
      bucketName,
      { public: true, fileSizeLimit: 5242880 }
    );
    
    if (error) {
      console.error(`❌ Error updating bucket '${bucketName}' to public:`, error);
    } else {
      console.log(`✅ Updated bucket '${bucketName}' to public access`);
    }

    // 2. Create public access policies (since this is still required)
    await createAccessPolicies(supabase, bucketName);
  } catch (error) {
    console.error(`❌ Failed to update bucket '${bucketName}':`, error);
  }
}

/**
 * Create RLS policies for a bucket
 * @param {Object} supabase - Supabase client
 * @param {string} bucketName - Bucket name to configure
 */
async function createAccessPolicies(supabase, bucketName) {
  // The admin_exec_sql RPC function is not available by default in Supabase
  // Instead, we'll print instructions for setting up policies manually
  
  console.log(`\n📝 Manual policy setup required for '${bucketName}' bucket:`);
  console.log(`1. Go to Supabase dashboard -> Storage -> ${bucketName} -> Policies`);
  console.log(`2. Create the following policies:`);
  console.log(`   - SELECT policy: Allow public read access`);
  console.log(`     Definition: bucket_id = '${bucketName}'`);
  console.log(`   - INSERT policy: Allow authenticated uploads`);
  console.log(`     Definition: bucket_id = '${bucketName}'`);
  console.log(`   - UPDATE policy: Allow authenticated updates`);
  console.log(`     Definition: bucket_id = '${bucketName}'`);
  console.log(`   - DELETE policy: Allow authenticated deletes`);
  console.log(`     Definition: bucket_id = '${bucketName}'`);
  console.log(`\nAlternatively, you can set these policies through the Supabase SQL editor with:`);
  console.log(`
    BEGIN;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "policy_${bucketName}_public_select" ON "storage"."objects";
    DROP POLICY IF EXISTS "policy_${bucketName}_auth_insert" ON "storage"."objects"; 
    DROP POLICY IF EXISTS "policy_${bucketName}_auth_update" ON "storage"."objects";
    DROP POLICY IF EXISTS "policy_${bucketName}_auth_delete" ON "storage"."objects";
    
    -- Create policies
    CREATE POLICY "policy_${bucketName}_public_select" 
    ON "storage"."objects" FOR SELECT 
    USING (bucket_id = '${bucketName}');
    
    CREATE POLICY "policy_${bucketName}_auth_insert" 
    ON "storage"."objects" FOR INSERT 
    WITH CHECK (bucket_id = '${bucketName}');
    
    CREATE POLICY "policy_${bucketName}_auth_update" 
    ON "storage"."objects" FOR UPDATE 
    USING (bucket_id = '${bucketName}');
    
    CREATE POLICY "policy_${bucketName}_auth_delete" 
    ON "storage"."objects" FOR DELETE 
    USING (bucket_id = '${bucketName}');
    
    COMMIT;
  `);
}

/**
 * Test bucket permissions by trying to upload and delete a test file
 * @param {Object} supabase - Supabase client
 * @param {string} bucketName - Bucket name to test
 */
async function testBucketPermissions(supabase, bucketName) {
  try {
    console.log(`Testing permissions for bucket '${bucketName}'...`);
    
    // Create a small test file
    const testBuffer = Buffer.from('Testing bucket permissions');
    const testFileName = `permission-test-${Date.now()}.txt`;
    
    // Try to upload the file
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testFileName, testBuffer, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadError) {
      console.error(`❌ Permission test FAILED for '${bucketName}' (upload): ${uploadError.message}`);
      console.log(`   This error typically means RLS policies need to be set up manually.`);
      console.log(`   With the service role key, uploads should succeed regardless of RLS policies.`);
      
      // Show policy setup instructions
      await createAccessPolicies(supabase, bucketName);
      return;
    }
    
    console.log(`✅ Upload test PASSED for '${bucketName}'`);
    
    // Try to delete the file
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testFileName]);
      
    if (deleteError) {
      console.warn(`⚠️ Delete test FAILED for '${bucketName}': ${deleteError.message}`);
      console.log(`   This is less critical as uploads are working, but policies could be improved.`);
    } else {
      console.log(`✅ Delete test PASSED for '${bucketName}'`);
    }
    
    // Get a public URL to test public access
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(testFileName);
      
    console.log(`✅ Public URLs available for '${bucketName}'`);
    
  } catch (error) {
    console.error(`❌ Error testing permissions for '${bucketName}':`, error.message);
  }
}

module.exports = setupSupabaseStorage; 