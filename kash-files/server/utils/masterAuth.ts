// server/utils/masterAuth.ts
import { getFile } from './s3';
import argon2 from 'argon2';
const MASTER_KEY_FILE = 'setup/master.json';

export async function verifyMasterKey(input: string): Promise<boolean> {
  try {
    const file = await getFile(MASTER_KEY_FILE);
    const { hash } = JSON.parse(file.Body.toString('utf-8'));
    return argon2.verify(hash, input);
  } catch (e) {
    return false;
  }
}