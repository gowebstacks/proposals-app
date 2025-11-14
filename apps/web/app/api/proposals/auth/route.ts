import { NextRequest, NextResponse } from 'next/server'
import { client, groq } from '@/lib/sanity'
import { createHmac } from 'crypto'

function getSecret(): string {
  const secret = process.env.PROPOSALS_PASSWORD_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('Missing PROPOSALS_PASSWORD_SECRET or NEXTAUTH_SECRET')
  }
  return secret
}

function signToken(slug: string, password: string): string {
  const secret = getSecret()
  return createHmac('sha256', secret).update(`${slug}:${password}`).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { slug?: string; password?: string }
    const slug = (body.slug || '').toString()
    const password = (body.password || '').toString()

    if (!slug || !password) {
      return NextResponse.json({ message: 'Missing slug or password' }, { status: 400 })
    }

    const proposal = await client.fetch(groq`*[_type == "proposal" && seo.slug.current == $slug][0]{ passwords }`, { slug })

    const passwords: string[] = proposal?.passwords || []
    if (passwords.length === 0) {
      return NextResponse.json({ message: 'Proposal is not password protected' }, { status: 400 })
    }

    const matched = passwords.some((p) => p && p === password)
    if (!matched) {
      return NextResponse.json({ message: 'Invalid password' }, { status: 401 })
    }

    const token = signToken(slug, password)
    const res = NextResponse.json({ ok: true })
    res.cookies.set({
      name: `proposal_auth_${slug}`,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    return res
  } catch (err) {
    console.error('Password auth error', err)
    return NextResponse.json({ message: 'Server error' }, { status: 500 })
  }
}
