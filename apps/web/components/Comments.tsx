'use client'

import { useThreads } from '@/lib/liveblocks'
import { Composer, Thread } from '@liveblocks/react-ui'
import '@liveblocks/react-ui/styles.css'

export function Comments() {
  const { threads } = useThreads()

  return (
    <div className="comments-container p-4">
      <h3 className="text-lg font-semibold mb-4">Comments</h3>
      {threads?.map((thread) => (
        <Thread key={thread.id} thread={thread} className="mb-4" />
      ))}
      <Composer className="mt-4" />
    </div>
  )
}
