// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
  // Clear the session cookie
  setCookie(event, 'kash-session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0 // Expire immediately
  })
  
  return { success: true }
})