// server/api/setup/master.post.ts
import { uploadFile, getFile } from '../../utils/s3';
import { requireAuth } from '../../utils/auth';
import argon2 from 'argon2';

const MASTER_KEY_FILE = 'setup/master.json';

export default defineEventHandler(async (event) => {
  console.log('🔑 Master key setup started');
  
  try {
    // Check if master key already exists
    let masterExists = false;
    let existing = null;
    
    console.log('🔍 Checking if master key exists...');
    try {
      const existingRaw = await getFile(MASTER_KEY_FILE);
      existing = JSON.parse(existingRaw.Body.toString('utf-8'));
      masterExists = !!(existing && existing.hash);
      console.log('✅ Master key exists:', masterExists);
    } catch (e) {
      console.log('ℹ️ Master key does not exist yet (first time setup)');
      masterExists = false;
    }

    // If master key exists, require auth to change it
    if (masterExists) {
      console.log('🔒 Master key exists, requiring auth...');
      try {
        await requireAuth(event);
        console.log('✅ Auth check passed');
      } catch (authError) {
        console.error('❌ Auth check failed:', authError);
        throw authError;
      }
    }

    const body = await readBody(event);
    console.log('📝 Request body received:', { 
      hasMaster: !!body.master, 
      masterLength: body.master?.length,
      hasCurrent: !!body.current 
    });

    const { master, current } = body;

    if (!master || master.length < 12) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Provide a strong master key (min 12 chars)' 
      });
    }

    // If we already have a master key, verify the current key
    if (masterExists) {
      if (!current) {
        throw createError({
          statusCode: 401,
          statusMessage: "Current master key required to reset"
        });
      }
      
      console.log('🔐 Verifying current master key...');
      try {
        const ok = await argon2.verify(existing.hash, current);
        if (!ok) {
          console.log('❌ Current key verification failed');
          throw createError({ statusCode: 403, statusMessage: "Current key incorrect" });
        }
        console.log('✅ Current key verified');
      } catch (verifyError) {
        console.error('❌ Key verification error:', verifyError);
        if (verifyError.statusCode) {
          throw verifyError; // Re-throw our own errors
        }
        throw createError({ statusCode: 500, statusMessage: "Failed to verify current key" });
      }
    }

    console.log('🔐 Hashing new master key...');
    const hash = await argon2.hash(master, { type: argon2.argon2id });
    
    const newMaster = {
      hash,
      setAt: new Date().toISOString()
    };
    
    console.log('💾 Saving master key to S3...');
    try {
      await uploadFile(MASTER_KEY_FILE, JSON.stringify(newMaster), 'application/json');
      console.log('✅ Master key saved successfully');
    } catch (uploadError) {
      console.error('❌ Failed to save master key to S3:', uploadError);
      throw createError({
        statusCode: 500,
        statusMessage: `S3 upload failed: ${uploadError.message}`
      });
    }
    
    console.log('🎉 Master key setup completed successfully');
    return { 
      ok: true,
      isInitialSetup: !masterExists
    };
    
  } catch (error) {
    console.error('❌ Master key setup failed:', error);
    
    // If it's already a createError, re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // For any other errors, wrap them properly
    throw createError({
      statusCode: 500,
      statusMessage: `Master key setup failed: ${error.message}`,
      data: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});