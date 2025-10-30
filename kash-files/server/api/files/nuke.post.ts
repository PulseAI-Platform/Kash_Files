import { listFiles, deleteFile } from '../../utils/s3';
import { requireSessionAuth } from '../../utils/auth';
import { sendMethodNotAllowed } from '../../utils/http';

export default defineEventHandler(async (event) => {
  await requireSessionAuth(event);

  if (event.method !== 'POST') {
    return sendMethodNotAllowed(event, ['POST']);
  }

  const files = await listFiles('files/');
  if (!files.length) return { deleted: 0 };

  const toDelete = [];
  for (const entry of files) {
    if (!entry.Key) continue;
    toDelete.push(deleteFile(entry.Key));
    if (!entry.Key.endsWith('.key')) {
      toDelete.push(deleteFile(entry.Key + '.key'));
    }
  }
  await Promise.allSettled(toDelete);

  return { ok: true, deleted: toDelete.length };
});