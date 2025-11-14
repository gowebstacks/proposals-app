import { Separator } from '@radix-ui/react-separator'
import * as Label from '@radix-ui/react-label'
import { Lock } from 'lucide-react'

interface UnlockPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ returnTo?: string; error?: string }>
}

export default async function UnlockPage({ params, searchParams }: UnlockPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const returnTo = resolvedSearchParams?.returnTo || `/${slug}`
  const hasError = resolvedSearchParams?.error === '1'

  const action = `/api/unlock?slug=${encodeURIComponent(slug)}&returnTo=${encodeURIComponent(returnTo)}`

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Lock className="w-7 h-7 text-gray-700" />
          </div>
          <h1 className="text-2xl font-light tracking-tight">Password required</h1>
          <p className="text-gray-600 mt-2">Enter the password to view this proposal.</p>
        </div>

        <Separator className="my-6 bg-gray-200 h-px w-full" />

        <form action={action} method="POST" className="space-y-4">
          <div className="space-y-2">
            <Label.Root htmlFor="password" className="text-sm text-gray-700">
              Password
            </Label.Root>
            <input
              id="password"
              name="password"
              type="password"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          {hasError && (
            <p className="text-sm text-red-600">Incorrect password. Please try again.</p>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white rounded-md px-4 py-2 text-base hover:bg-gray-800 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  )
}
