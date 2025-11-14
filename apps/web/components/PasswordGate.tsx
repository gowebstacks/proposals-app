"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

type Props = { slug: string }

export default function PasswordGate({ slug }: Props) {
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/proposals/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || "Invalid password")
      }
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid password"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Enter password</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-gray-300 rounded-md px-3 h-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-black text-white rounded-full hover:bg-blue-600 disabled:opacity-60"
          >
            {submitting ? "Verifying…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  )
}
