'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

interface PasswordProtectionProps {
  passwords?: string[]
  children: React.ReactNode
}

export default function PasswordProtection({ passwords, children }: PasswordProtectionProps) {
  const [inputPassword, setInputPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // If no passwords are set, show content directly
  if (!passwords || passwords.length === 0) {
    return <>{children}</>
  }

  // If already unlocked, show content
  if (isUnlocked) {
    return <>{children}</>
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (passwords.includes(inputPassword)) {
      setIsUnlocked(true)
    } else {
      setError('Incorrect password. Please try again.')
      setInputPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Lock className="w-8 h-8 text-gray-600" />
          </div>
          <h1 className="text-2xl font-light text-black mb-2">
            Password Protected
          </h1>
          <p className="text-gray-600 text-lg">
            This proposal is protected. Please enter the password to view.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {error && (
            <div className="text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-black text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors text-lg font-medium"
          >
            Unlock Proposal
          </button>
        </form>
      </div>
    </div>
  )
}
