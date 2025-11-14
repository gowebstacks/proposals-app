import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    // Return simple error page
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Authentication Failed</h2>
          <p>${error || 'No authorization code received'}</p>
          <p>You can close this tab and try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  try {
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_STUDIO_URL || 'http://localhost:3333'}/api/google/oauth/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token')
    }

    const data = await tokenResponse.json()
    
    // Return success page that sets cookies and closes
    const htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Authentication Successful!</h2>
          <p>You can now close this tab and return to Sanity Studio.</p>
          <script>
            // Set cookies that work across tabs
            document.cookie = 'google_access_token=${data.access_token}; Path=/; Max-Age=${data.expires_in || 3600}';
            document.cookie = 'google_refresh_token=${data.refresh_token || ''}; Path=/; Max-Age=${60 * 60 * 24 * 30}';
            
            // Let the user know they can close the tab
            setTimeout(() => {
              document.body.innerHTML += '<p style="color: green;">✓ Authentication complete - You can close this tab now</p>';
            }, 500);
          </script>
        </body>
      </html>
    `
    
    // Create response with headers
    const response = new Response(htmlContent, {
      headers: { 'Content-Type': 'text/html' }
    })
    
    // Set cookies separately (Secure/HttpOnly only on HTTPS to work in local dev)
    const isHttps = (process.env.NEXT_PUBLIC_STUDIO_URL || '').startsWith('https://')
    const commonAttrs = `${isHttps ? 'HttpOnly; Secure; ' : ''}SameSite=Lax`
    response.headers.append(
      'Set-Cookie',
      `google_access_token=${data.access_token}; Path=/; ${commonAttrs}; Max-Age=${data.expires_in || 3600}`
    )
    response.headers.append(
      'Set-Cookie',
      `google_refresh_token=${data.refresh_token || ''}; Path=/; ${commonAttrs}; Max-Age=${60 * 60 * 24 * 30}`
    )
    
    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2>Authentication Error</h2>
          <p>There was an error during authentication. Please try again.</p>
          <script>
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
