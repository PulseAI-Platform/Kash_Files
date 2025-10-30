// server/api/files/upload.post.ts
import { uploadFile } from '../../utils/s3';
import { requireAuth } from '../../utils/auth';
import { randomBytes } from 'crypto';

export default defineEventHandler(async (event) => {
  console.log('📤 Upload request received');
  
  // Get auth info (including source and key name)
  const authResult = await requireAuth(event);
  console.log('📤 Auth passed:', authResult);

  // Only allow POST
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' });
  }

  const form = await readFormData(event);
  console.log('📤 Form data keys:', Array.from(form.keys()));

  const file = form.get('file');
  const decay = form.get('decay') || 365; // days (default)
  
  // Type guard to check if file is actually a File object
  if (!file || typeof file === "string") {
    throw createError({ statusCode: 400, statusMessage: "No file provided" });
  }

  // Now TypeScript knows file is a File object
  const originalName = form.get('filename') || file.name || 'file';
  console.log('📤 File info:', { name: originalName, size: file.size, type: file.type });

  // Generate a random access key for the file (prevent enumeration)
  const accessKey = randomBytes(16).toString('hex');
  const now = new Date();
  const decayDate = new Date(now.getTime() + Number(decay) * 24 * 60 * 60 * 1000);

  // S3 object key (can include a user's folder if per-user isolation desired)
  const s3key = `files/${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}/${originalName}`;
  const metaKey = s3key + '.key';
  
  console.log('📤 S3 keys:', { s3key, metaKey });

  // Convert File to Buffer for S3 upload
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  console.log('📤 File buffer size:', fileBuffer.length);
  
  try {
    // Write file
    console.log('📤 Uploading file to S3...');
    await uploadFile(s3key, fileBuffer, file.type);
    console.log('📤 File uploaded successfully');

    // Write meta with enhanced tracking info
    const metadata = {
      key: accessKey,
      decay: decayDate.toISOString(),
      originalName,
      uploaded: now.toISOString(),
      size: file.size,
      contentType: file.type,
      uploadedBy: authResult.type, // 'session' or 'api-key'
      uploadedWith: authResult.keyName || 'web-interface', // API key name or 'web-interface'
      uploadedVia: authResult.keyId || 'session' // API key ID or 'session'
    };
    
    console.log('📤 Creating metadata:', metadata);
    await uploadFile(metaKey, JSON.stringify(metadata), 'application/json');
    console.log('📤 Metadata uploaded successfully');
    
  } catch (uploadError) {
    console.error('📤 Upload error:', uploadError);
    throw createError({ statusCode: 500, statusMessage: 'Failed to upload file' });
  }

  const result = {
    ok: true,
    location: s3key,
    key: accessKey,
    decay: decayDate.toISOString(),
    download: `/api/files/${encodeURIComponent(s3key)}?key=${accessKey}`,
    filename: originalName,
  };
  
  console.log('📤 Upload result:', result);
  return result;
});