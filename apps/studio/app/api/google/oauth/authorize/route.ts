import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const REDIRECT_URI = `${process.env.NEXT_PUBLIC_STUDIO_URL || 'http://localhost:3333'}/api/google/oauth/callback`
  
  if (!CLIENT_ID) {
    return NextResponse.json({ error: 'Google OAuth client ID not configured' }, { status: 500 })
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/documents.readonly')
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')
  authUrl.searchParams.set('state', 'sanity_studio_oauth')

  return NextResponse.redirect(authUrl.toString())
}
