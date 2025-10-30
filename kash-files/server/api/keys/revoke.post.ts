// server/api/keys/revoke.post.ts
import { getFile, uploadFile } from '../../utils/s3';
import { requireSessionAuth } from '../../utils/auth';

const KEY_STORE = 'keys/keys.json';

export default defineEventHandler(async (event) => {
  await requireSessionAuth(event);
  
  const { key } = await readBody(event);
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Key required' });

  let keys = [];
  try {
    const data = await getFile(KEY_STORE);
    keys = JSON.parse(data.Body.toString('utf-8'));
  } catch (e) {}

  // Soft-revoke: set revoked to true
  let updated = false;
  keys = keys.map(k => {
    if (k.key === key && !k.revoked) {
      updated = true;
      return { ...k, revoked: true, revokedAt: new Date().toISOString() };
    }
    return k;
  });

  await uploadFile(KEY_STORE, JSON.stringify(keys, null, 2), "application/json");
  return { ok: updated };
});