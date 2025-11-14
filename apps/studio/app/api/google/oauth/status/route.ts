import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const authorized = Boolean(req.cookies.get('google_access_token')?.value)
  return NextResponse.json({ authorized }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}
