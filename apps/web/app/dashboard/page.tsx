'use client'

import { useState, useEffect } from 'react'
import Image from "next/image";
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [userEmail, setUserEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Get email from localStorage (simulating session)
    const email = localStorage.getItem('userEmail')
    if (email) {
      setUserEmail(email)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('userEmail')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image 
                src="/webstacks-logotype-onlight.svg" 
                alt="Webstacks" 
                width={75}
                height={20}
                className="h-5 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{userEmail}</span>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-black hover:bg-gray-100 rounded-md transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-600 mt-2">Here&apos;s what&apos;s happening with your proposals today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="text-sm text-gray-600 mt-1">Active Proposals</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-sm text-gray-600 mt-1">Pending Review</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">8</div>
            <div className="text-sm text-gray-600 mt-1">Approved This Month</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">24</div>
            <div className="text-sm text-gray-600 mt-1">Total Proposals</div>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Proposals</h2>
          </div>
          <div className="divide-y divide-gray-200">
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">FireMon Digital Transformation</div>
                <div className="text-sm text-gray-600">Last updated 2 hours ago</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Questrade Platform Enhancement</div>
                <div className="text-sm text-gray-600">Last updated 1 day ago</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Review</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enterprise Security Solution</div>
                <div className="text-sm text-gray-600">Last updated 3 days ago</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
