// server/api/setup/webauthn.post.ts
import { uploadFile } from '../../utils/s3';

const WEBAUTHN_FILE = 'setup/webauthn.json';

export default defineEventHandler(async (event) => {
  const { credentials } = await readBody(event);
  if (!credentials) {
    throw createError({ statusCode: 400, statusMessage: 'Missing credentials' });
  }
  // You might want additional validation here
  await uploadFile(WEBAUTHN_FILE, JSON.stringify(credentials), 'application/json');
  return { ok: true };
});