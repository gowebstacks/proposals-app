'use client'

import { useState, useEffect } from 'react'
import { RoomProvider } from '@/lib/liveblocks'
import ProposalContent from './ProposalContent'
import { InlineComments } from './InlineComments'
import { VerifyIdentity } from './VerifyIdentity'
import type { TypedObject } from '@portabletext/types'

interface Tab {
  title?: string
  content?: TypedObject[]
  [key: string]: unknown
}

interface Company {
  _id: string
  name: string
  logoOnLight?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  logoOnDark?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  logomarkOnLight?: {
    asset: {
      _ref: string
      url?: string
    }
  }
  logomarkOnDark?: {
    asset: {
      _ref: string
      url?: string
    }
  }
}

interface Person {
  _id: string
  firstName: string
  lastName: string
  role?: string
  headshot?: {
    asset: {
      _ref: string
      url?: string
    }
  }
}

interface ProposalWithCommentsProps {
  tabs: Tab[]
  proposalSlug: string
  activeTabIndex: number
  company?: Company
  googleDocUrl?: string
  preparedBy?: Person
}

export default function ProposalWithComments(props: ProposalWithCommentsProps) {
  const roomId = `proposal-${props.proposalSlug}`
  const [isVerified, setIsVerified] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')

  // Check if user is already verified in localStorage
  useEffect(() => {
    const verified = localStorage.getItem('liveblocks_verified')
    const name = localStorage.getItem('liveblocks_user_name')
    const email = localStorage.getItem('liveblocks_user_email')
    
    if (verified === 'true' && name && email) {
      setIsVerified(true)
      setUserName(name)
      setUserEmail(email)
    }
  }, [])

  const handleVerify = (name: string, email: string) => {
    localStorage.setItem('liveblocks_verified', 'true')
    localStorage.setItem('liveblocks_user_name', name)
    localStorage.setItem('liveblocks_user_email', email)
    setIsVerified(true)
    setUserName(name)
    setUserEmail(email)
  }

  return (
    <>
      {!isVerified && <VerifyIdentity onVerify={handleVerify} />}
      
      <RoomProvider id={roomId} initialPresence={{}}>
        <div className="relative">
          <ProposalContent {...props} />
          
          {/* Inline comments - Notion-style highlighting */}
          {isVerified && (
            <InlineComments userName={userName} userEmail={userEmail} />
          )}
        </div>
      </RoomProvider>
    </>
  )
}
