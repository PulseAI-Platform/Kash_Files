import { deleteFile } from '../../utils/s3';
import { requireSessionAuth } from '../../utils/auth';
import { sendMethodNotAllowed } from '../../utils/http';

export default defineEventHandler(async (event) => {
  await requireSessionAuth(event);
  
  if (event.method !== 'POST') {
    return sendMethodNotAllowed(event, ['POST']);
  }
  
  const { location } = await readBody(event);

  if (!location) {
    throw createError({ statusCode: 400, statusMessage: "Missing 'location'" });
  }

  try {
    await Promise.all([
      deleteFile(location),
      deleteFile(location + '.key')
    ]);
  } catch (e) {
    throw createError({ statusCode: 500, statusMessage: "Failed to delete file" });
  }

  return { ok: true };
});