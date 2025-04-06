/**
 * Supabase Storage Utility
 * Handles file uploads to Supabase storage
 */
const { createClient } = require('@supabase/supabase-js');
const { ValidationError } = require('../exceptions/errors');

// Create Supabase client with service role key for admin access (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Validate file is an image and within size limits
 * @param {Object} file - The file object from multer
 * @param {number} maxSize - Maximum file size in bytes (default 5MB)
 * @returns {boolean} - True if file is valid
 */
const validateImageFile = (file, maxSize = 5 * 1024 * 1024) => {
  // Check file exists
  if (!file) {
    throw new ValidationError('No file provided');
  }

  // Check file size
  if (file.size > maxSize) {
    throw new ValidationError(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ValidationError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed');
  }

  return true;
};

/**
 * Upload a file to Supabase storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - Original file name
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder path inside bucket
 * @param {string} mimetype - File mime type
 * @returns {Promise<Object>} - Upload result with public URL
 */
const uploadFile = async (fileBuffer, fileName, bucket, folder, mimetype) => {
  try {
    // Sanitize file name to ensure it's URL-safe
    const sanitizedName = fileName.replace(/\s+/g, '-').toLowerCase();
    
    // Create unique file name with timestamp
    const uniqueFileName = `${Date.now()}-${sanitizedName}`;
    
    // Create file path within the bucket
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimetype,
        cacheControl: '3600'
      });
      
    if (error) {
      console.error('Supabase storage upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return {
      path: filePath,
      url: publicUrl
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

/**
 * Delete a file from Supabase storage
 * @param {string} path - File path in the bucket
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<boolean>} - Deletion result
 */
const deleteFile = async (path, bucket) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) {
      console.error('Supabase storage delete error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    throw error;
  }
};

/**
 * Extract file path from a Supabase URL
 * @param {string} url - The full Supabase URL
 * @param {string} bucket - The bucket name
 * @returns {string} - The file path within the bucket
 */
const getPathFromUrl = (url, bucket) => {
  if (!url) return null;
  
  // Extract the path from the URL
  // Format: https://[project-ref].supabase.co/storage/v1/object/public/[bucket]/[path]
  const regex = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
  const match = url.match(regex);
  
  return match ? match[1] : null;
};

module.exports = {
  uploadFile,
  deleteFile,
  validateImageFile,
  getPathFromUrl,
  supabase
}; 