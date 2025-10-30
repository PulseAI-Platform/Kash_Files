// server/api/setup/status.get.ts
import { getFile } from '../../utils/s3';

const MASTER_KEY_FILE = 'setup/master.json';
const WEBAUTHN_FILE = 'setup/webauthn.json';

export default defineEventHandler(async (_event) => {
  // Try reading both setup files
  let masterKeyExists = false, webauthnExists = false, masterInfo = null;
  try {
    const data = await getFile(MASTER_KEY_FILE);
    if (data?.Body) {
      masterKeyExists = true;
      masterInfo = JSON.parse(data.Body.toString('utf-8'));
    }
  } catch {}

  try {
    const data = await getFile(WEBAUTHN_FILE);
    if (data?.Body) webauthnExists = true;
  } catch {}

  return {
    masterKeyExists,
    webauthnExists,
    masterInfo
  };
});