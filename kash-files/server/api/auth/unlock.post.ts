// server/api/auth/unlock.post.ts
import { verifyMasterKey } from '../../utils/masterAuth'
import { createSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const { masterKey } = await readBody(event)
  
  console.log('🔑 Unlock attempt received')
  
  if (!masterKey) {
    throw createError({ statusCode: 400, statusMessage: 'Master key required' })
  }
  
  const isValid = await verifyMasterKey(masterKey)
  console.log('🔑 Master key valid:', isValid)
  
  if (!isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid master key' })
  }
  
  const sessionData = {
    unlocked: true,
    unlockedAt: Date.now()
  }
  
  const sessionToken = createSession(sessionData)
  console.log('🔑 Session token created:', sessionToken.substring(0, 20) + '...')
  
  // Set HTTP-only cookie
  setCookie(event, 'kash-session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/' // Make sure this is set
  })
  
  console.log('🔑 Cookie set successfully')
  
  return { success: true, expiresAt: Date.now() + (24 * 60 * 60 * 1000) }
})