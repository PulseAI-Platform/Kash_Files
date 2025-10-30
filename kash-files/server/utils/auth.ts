// server/utils/auth.ts
import { requireUnlockedSession } from './session';
import { validateKey, getKeyInfo } from './keyAuth';

// For endpoints that should accept BOTH session and API key (uploads only)
export async function requireAuth(event: any): Promise<{ 
  type: 'session' | 'api-key', 
  authenticated: true,
  keyName?: string,
  keyId?: string 
}> {
  // Try session authentication first (full access)
  try {
    await requireUnlockedSession(event);
    return { 
      type: 'session', 
      authenticated: true,
      keyName: 'web-interface'
    };
  } catch (sessionError) {
    // Session auth failed, try API key (upload-only)
    const apiKey = getHeader(event, 'x-upload-key') || '';
    if (apiKey) {
      const keyInfo = await getKeyInfo(apiKey);
      if (keyInfo) {
        return { 
          type: 'api-key', 
          authenticated: true,
          keyName: keyInfo.name || `Key-${apiKey.substring(0, 8)}...`,
          keyId: apiKey
        };
      }
    }
    
    // Both failed
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Authentication required. Provide a valid session or x-upload-key header.' 
    });
  }
}

// For endpoints that should ONLY accept session (list, delete, keys, etc)
export async function requireSessionAuth(event: any): Promise<{ type: 'session', authenticated: true }> {
  await requireUnlockedSession(event);
  return { type: 'session', authenticated: true };
}