// server/api/files/[...s3key].get.ts
import { getFile } from '../../utils/s3';

export default defineEventHandler(async (event) => {
  console.log('📥 Download request for:', event.context.params);
  
  // Decode the URL-encoded S3 key
  const rawS3key = event.context.params!.s3key as string;
  const s3key = decodeURIComponent(rawS3key);
  const metaKey = s3key + '.key';

  const url = new URL(event.node.req.url!, `http://${event.node.req.headers.host}`);
  const keyParam = url.searchParams.get('key');
  
  console.log('📥 Download info:', { 
    rawS3key, 
    s3key, 
    metaKey, 
    keyParam: keyParam?.substring(0, 8) + '...' 
  });

  if (!keyParam) {
    throw createError({ statusCode: 401, statusMessage: "Missing key" });
  }

  // Load meta
  let meta;
  try {
    console.log('📥 Loading metadata...');
    const metaResp = await getFile(metaKey);
    meta = JSON.parse(metaResp.Body.toString('utf-8'));
    console.log('📥 Metadata loaded:', { 
      key: meta.key?.substring(0, 8) + '...', 
      decay: meta.decay,
      originalName: meta.originalName,
      uploadedWith: meta.uploadedWith || 'legacy'
    });
  } catch (e) {
    console.error('📥 Metadata load error:', e);
    throw createError({ statusCode: 404, statusMessage: "File not found (.key)" });
  }

  // Validate download key and decay
  const now = new Date();
  if (keyParam !== meta.key) {
    console.log('📥 Invalid key provided');
    throw createError({ statusCode: 403, statusMessage: "Invalid download key" });
  }
  
  // Handle files that might not have decay set (legacy files)
  if (meta.decay && now > new Date(meta.decay)) {
    console.log('📥 File expired');
    throw createError({ statusCode: 410, statusMessage: "File link expired" });
  }

  // Stream file
  let result;
  try {
    console.log('📥 Loading file content...');
    result = await getFile(s3key);
    console.log('📥 File loaded successfully');
  } catch (e) {
    console.error('📥 File load error:', e);
    throw createError({ statusCode: 404, statusMessage: "File not found" });
  }

  // Use enhanced metadata for proper headers
  const contentType = meta.contentType || result.ContentType || "application/octet-stream";
  const filename = meta.originalName || s3key.split('/').pop() || 'download';
  
  // Set proper headers
  setHeader(event, "Content-Type", contentType);
  setHeader(event, "Content-Disposition", `inline; filename="${filename}"`);
  
  // Optional: Add custom headers for tracking (useful for analytics)
  if (meta.uploadedWith && meta.uploadedWith !== 'web-interface') {
    setHeader(event, "X-Uploaded-Via", meta.uploadedWith);
  }
  
  if (meta.size) {
    setHeader(event, "Content-Length", meta.size.toString());
  }

  console.log('📥 Download headers set:', { contentType, filename, size: meta.size });
  
  return result.Body;
});