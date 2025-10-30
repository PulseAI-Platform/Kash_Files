export function sendMethodNotAllowed(event, allowed: string[]) {
  throw createError({
    statusCode: 405,
    statusMessage: `Method Not Allowed. Allowed: ${allowed.join(', ')}`
  });
}