import { getRequestHeaders } from 'h3'

export default defineEventHandler(async (event) => {
  const headers = getRequestHeaders(event)
  const cookieHeader = event.node.req.headers.cookie || null

  console.log('📌 debug/headers — request headers:', JSON.stringify(headers))
  console.log('📌 debug/headers — cookie header:', cookieHeader)

  return {
    headers,
    cookieHeader
  }
})
