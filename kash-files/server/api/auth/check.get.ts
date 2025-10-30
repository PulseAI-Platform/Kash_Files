// server/api/auth/check.get.ts
import { requireUnlockedSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  //console.log('🔍 Auth check - cookies:', event.node.req.headers.cookie)
  
  try {
    await requireUnlockedSession(event)
    console.log('🔍 Auth check passed')
    return { authenticated: true }
  } catch (error) {
    console.log('🔍 Auth check failed:', error.message)
    // Don't throw - return false instead
    return { authenticated: false }
  }
})