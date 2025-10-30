// server/utils/session.ts
import jwt from 'jsonwebtoken'
import { verifyMasterKey } from './masterAuth'

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production'
const SESSION_DURATION = '24h'

export interface SessionData {
  unlocked: boolean
  unlockedAt: number
}

export function createSession(data: SessionData): string {
  return jwt.sign(data, SESSION_SECRET, { expiresIn: SESSION_DURATION })
}

export function verifySession(token: string): SessionData | null {
  try {
    return jwt.verify(token, SESSION_SECRET) as SessionData
  } catch (error) {
    console.log('🔒 Session verification failed:', error.message)
    return null
  }
}

export async function requireUnlockedSession(event: any): Promise<boolean> {
  // Check for session token in cookie or header
  const sessionToken = getCookie(event, 'kash-session') || 
                      getHeader(event, 'x-session-token')
  
  //console.log('🔍 Session check - token found:', !!sessionToken)
  //console.log('🔍 All cookies:', event.node.req.headers.cookie)
  
  if (!sessionToken) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }
  
  const session = verifySession(sessionToken)
  console.log('🔍 Session verification result:', session)
  
  if (!session || !session.unlocked) {
    throw createError({ statusCode: 401, statusMessage: 'Session invalid or expired' })
  }
  
  return true
}