import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || ''
const apiVersion = '2023-05-03'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get('slug') || ''
    const returnTo = searchParams.get('returnTo') || `/${slug}`

    if (!slug) {
      return NextResponse.json({ ok: false, error: 'Missing slug' }, { status: 400 })
    }

    const form = await req.formData()
    const password = (form.get('password') || '').toString()

    if (!password) {
      return NextResponse.json({ ok: false, error: 'Password required' }, { status: 400 })
    }

    if (!projectId || !dataset) {
      return NextResponse.json({ ok: false, error: 'Sanity not configured' }, { status: 500 })
    }

    // Fetch passwords for slug from Sanity
    const query = '*[_type == "proposal" && seo.slug.current == $slug][0]{ passwords }'
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}&%24slug=${encodeURIComponent(`"${slug}"`)}`

    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: 'Failed to verify password' }, { status: 500 })
    }
    const data = await res.json()
    const passwords: string[] = data?.result?.passwords || []

    const valid = passwords.includes(password)
    if (!valid) {
      // Redirect back to unlock with error
      const redirectUrl = new URL(`/unlock/${slug}`, req.url)
      redirectUrl.searchParams.set('error', '1')
      redirectUrl.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(redirectUrl)
    }

    // Set cookie and redirect to returnTo
    const resRedirect = NextResponse.redirect(new URL(returnTo, req.url))
    resRedirect.cookies.set(`pp_${slug}`, '1', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return resRedirect
  } catch {
    return NextResponse.json({ ok: false, error: 'Unexpected error' }, { status: 500 })
  }
}
