// server/api/keys/create.post.ts
import { getFile, uploadFile } from '../../utils/s3';
import { requireSessionAuth } from '../../utils/auth';
import { randomBytes } from 'crypto';

const KEY_STORE = 'keys/keys.json';

export default defineEventHandler(async (event) => {
  await requireSessionAuth(event);
  
  const { name, expires } = await readBody(event);

  // Read or create key store
  let keys = [];
  try {
    const data = await getFile(KEY_STORE);
    keys = JSON.parse(data.Body.toString('utf-8'));
  } catch (e) {}

  // Create new key object
  const key = randomBytes(16).toString('hex');
  const obj = {
    key,
    name: name || null,
    expires: expires || null,
    created: new Date().toISOString(),
    revoked: false
  };
  keys.push(obj);

  // Write updated key list
  await uploadFile(KEY_STORE, JSON.stringify(keys, null, 2), "application/json");

  return obj;
});
