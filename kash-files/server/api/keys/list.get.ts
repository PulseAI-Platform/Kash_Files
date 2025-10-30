// server/api/keys/list.get.ts
import { getFile } from '../../utils/s3';
import { requireSessionAuth } from '../../utils/auth';

const KEY_STORE = 'keys/keys.json';

export default defineEventHandler(async (event) => {
  await requireSessionAuth(event);
  
  try {
    const data = await getFile(KEY_STORE);
    const keys = JSON.parse(data.Body.toString('utf-8'));
    return keys;
  } catch (e) {
    return [];
  }
});