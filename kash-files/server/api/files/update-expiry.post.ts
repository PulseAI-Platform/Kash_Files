// server/api/files/update-expiry.post.ts
import { getFile, uploadFile } from '../../utils/s3';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireAuth(event);
  
  const { location, decay } = await readBody(event);
  
  if (!location || !decay) {
    throw createError({ statusCode: 400, statusMessage: 'Missing location or decay' });
  }

  const metaKey = location + '.key';
  
  try {
    // Read existing metadata
    const metaData = await getFile(metaKey);
    const meta = JSON.parse(metaData.Body.toString('utf-8'));
    
    // Update decay date
    const now = new Date();
    const newDecayDate = new Date(now.getTime() + Number(decay) * 24 * 60 * 60 * 1000);
    
    meta.decay = newDecayDate.toISOString();
    meta.updatedAt = now.toISOString();
    
    // Save updated metadata
    await uploadFile(metaKey, JSON.stringify(meta), 'application/json');
    
    return { ok: true };
  } catch (error) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' });
  }
});