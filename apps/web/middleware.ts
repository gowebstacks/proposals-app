import { NextRequest, NextResponse } from 'next/server'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || ''
const apiVersion = '2023-05-03'

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl

  // Skip assets, API routes, studio, unlock page and files with extensions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/unlock') ||
    pathname === '/favicon.ico' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return NextResponse.next()

  const baseSlug = segments[0]

  // Check cookie
  const cookieName = `pp_${baseSlug}`
  const cookie = req.cookies.get(cookieName)
  if (cookie?.value === '1') {
    return NextResponse.next()
  }

  // If Sanity project/dataset not configured, don't block
  if (!projectId || !dataset) return NextResponse.next()

  // Query Sanity to see if this proposal is password protected
  const query = '*[_type == "proposal" && seo.slug.current == $slug][0]{ "hasPasswords": defined(passwords) && count(passwords) > 0 }'
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}&%24slug=${encodeURIComponent(`"${baseSlug}"`)}`

  console.log('🔐 Checking password for slug:', baseSlug)
  console.log('🔐 Sanity URL:', url)

  let hasPasswords = false
  try {
    const res = await fetch(url, { cache: 'no-store' })
    console.log('🔐 Sanity response status:', res.status)
    if (res.ok) {
      const data = await res.json()
      console.log('🔐 Sanity data:', JSON.stringify(data))
      hasPasswords = Boolean(data?.result?.hasPasswords)
      console.log('🔐 Has passwords:', hasPasswords)
    }
  } catch (error) {
    console.log('🔐 Error fetching from Sanity:', error)
    // On failure to check, default to allowing access rather than blocking
    return NextResponse.next()
  }

  console.log('🔐 Final decision - hasPasswords:', hasPasswords)

  if (hasPasswords) {
    console.log('🔐 Redirecting to unlock page')
    const unlockUrl = new URL(`/unlock/${baseSlug}`, req.url)
    unlockUrl.searchParams.set('returnTo', pathname + search)
    return NextResponse.redirect(unlockUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|api|unlock|favicon.ico).*)',
  ],
}
