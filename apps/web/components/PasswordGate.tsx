"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { identifyUser, trackEvent } from "@/utils/segment"

type Props = { slug: string }

export default function PasswordGate({ slug }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const onSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email) return

    try {
      // Log email with Segment as soon as it's provided
      identifyUser(email, {
        source: "proposal_pin_gate",
        proposalSlug: slug,
      })

      trackEvent("Proposal Email Submitted", {
        proposalSlug: slug,
      })
    } catch (err) {
      // Fail silently for analytics issues
      console.warn("Segment tracking failed for proposal email", err)
    }

    setStep(2)
  }

  const onSubmitPin = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/proposals/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend still expects `password`, but this is now a PIN from Sanity
        body: JSON.stringify({ slug, password: pin }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message || "Invalid PIN")
      }
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid PIN"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {step === 1 ? (
          <>
            <h1 className="text-xl font-semibold mb-2">Protected proposal</h1>
            <p className="text-sm text-gray-600 mb-4">
              Enter your work email to continue.
            </p>
            <form onSubmit={onSubmitEmail} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Work email"
                className="w-full border border-gray-300 rounded-md px-3 h-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <button
                type="submit"
                className="w-full h-10 bg-black text-white rounded-full hover:bg-blue-600"
              >
                Next
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold mb-2">Enter PIN</h1>
            <p className="text-sm text-gray-600 mb-4">
              Enter the PIN you were provided to view this proposal.
            </p>
            <form onSubmit={onSubmitPin} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                className="w-full border border-gray-300 rounded-md px-3 h-10 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 bg-black text-white rounded-full hover:bg-blue-600 disabled:opacity-60"
              >
                {submitting ? "Verifying33" : "Unlock"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
