// server/utils/keyAuth.ts
import { getFile } from './s3';
const KEY_STORE = 'keys/keys.json';

export async function validateKey(inputKey: string) {
  try {
    const data = await getFile(KEY_STORE);
    const keys = JSON.parse(data.Body.toString('utf-8'));
    const k = keys.find(k => k.key === inputKey && !k.revoked);
    if (!k) return false;
    if (k.expires && new Date() > new Date(k.expires)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// New function to get full key info
export async function getKeyInfo(inputKey: string) {
  try {
    const data = await getFile(KEY_STORE);
    const keys = JSON.parse(data.Body.toString('utf-8'));
    const k = keys.find(k => k.key === inputKey && !k.revoked);
    if (!k) return null;
    if (k.expires && new Date() > new Date(k.expires)) return null;
    return k; // Return full key object with name, created date, etc.
  } catch (e) {
    return null;
  }
}