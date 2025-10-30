// server/api/files/list.get.ts
import { listFiles, getFile } from '../../utils/s3';
import { requireSessionAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  await requireSessionAuth(event);

  const files = await listFiles('files/');
  if (!files.length) return { files: [] };

  const fileMetas = [];
  for (const entry of files) {
    if (!entry.Key || entry.Key.endsWith('.key')) continue;
    const metaKey = entry.Key + '.key';
    try {
      const metaObj = await getFile(metaKey);
      const meta = JSON.parse(metaObj.Body.toString('utf-8'));
      const now = new Date();
      const decayDate = new Date(meta.decay);
      
      fileMetas.push({
        location: entry.Key,
        filename: meta.originalName || entry.Key.split('/').pop(),
        uploaded: meta.uploaded,
        decay: meta.decay,
        size: meta.size || entry.Size || 0,
        contentType: meta.contentType || null,
        uploadedBy: meta.uploadedBy || 'unknown',
        uploadedWith: meta.uploadedWith || 'unknown',
        uploadedVia: meta.uploadedVia || 'unknown',
        isExpired: decayDate < now,
        downloadUrl: `/api/files/${encodeURIComponent(entry.Key)}?key=${meta.key}`
      });
    } catch (e) { 
      console.log('Failed to load meta for', entry.Key, e.message);
      
      // Fallback for files without proper metadata
      fileMetas.push({
        location: entry.Key,
        filename: entry.Key.split('/').pop() || 'unknown',
        uploaded: null,
        decay: null,
        size: entry.Size || 0,
        contentType: null,
        uploadedBy: 'legacy',
        uploadedWith: 'unknown',
        uploadedVia: 'unknown',
        isExpired: true, // Assume expired if no metadata
        downloadUrl: `/api/files/${encodeURIComponent(entry.Key)}?key=unknown`
      });
      continue; 
    }
  }
  
  return { files: fileMetas };
});