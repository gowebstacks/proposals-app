import { NextRequest, NextResponse } from 'next/server'

// Refresh access token using refresh token
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to refresh token')
  }

  const data = await res.json()
  return { access_token: data.access_token as string, expires_in: Number(data.expires_in ?? 3600) }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id?: string }> }
) {
  const p = await params
  let id = p?.id
  if (!id) {
    // Fallback: derive from URL path
    const path = req.nextUrl?.pathname || ''
    const seg = path.split('/').filter(Boolean).pop()
    if (seg) id = decodeURIComponent(seg)
  }
  if (!id) {
    // Fallback: read from query string
    const q = req.nextUrl?.searchParams.get('id')
    if (q) id = q
  }
  if (!id) {
    return NextResponse.json({ error: 'Missing Google Doc ID' }, { status: 400 })
  }

  try {
    const access = req.cookies.get('google_access_token')?.value
    const refresh = req.cookies.get('google_refresh_token')?.value

    if (!access) {
      return NextResponse.json({ error: 'oauth_required' }, { status: 401 })
    }

    // Try with current access token; request all tabs content
    let apiRes = await fetch(`https://docs.googleapis.com/v1/documents/${id}?includeTabsContent=true`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store',
    })

    // If unauthorized and we have a refresh token, refresh and retry once
    if (apiRes.status === 401 && refresh) {
      try {
        const refreshed = await refreshAccessToken(refresh)
        apiRes = await fetch(`https://docs.googleapis.com/v1/documents/${id}?includeTabsContent=true`, {
          headers: { Authorization: `Bearer ${refreshed.access_token}` },
          cache: 'no-store',
        })

        if (apiRes.ok) {
          const json = await apiRes.json()
          console.log('Google Docs API response (after refresh) has tabs:', !!json.tabs, 'tabs count:', json.tabs?.length || 0)
          const response = NextResponse.json(json)
          response.headers.append(
            'Set-Cookie',
            `google_access_token=${refreshed.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${refreshed.expires_in}`
          )
          return response
        }
      } catch (e) {
        // fall through to oauth_required below
      }
    }

    if (!apiRes.ok) {
      if (apiRes.status === 401) {
        return NextResponse.json({ error: 'oauth_required' }, { status: 401 })
      }
      const msg = await apiRes.text().catch(() => '')
      return NextResponse.json(
        { error: `Failed to fetch Google Doc: ${apiRes.status} ${apiRes.statusText}${msg ? ` - ${msg}` : ''}` },
        { status: apiRes.status }
      )
    }

    const json = await apiRes.json()
    console.log('Google Docs API response has tabs:', !!json.tabs, 'tabs count:', json.tabs?.length || 0)
    return NextResponse.json(json)
  } catch (error) {
    console.error('GDoc fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
