'use client'

import { useState, useEffect } from 'react'
import { useThreads, useCreateThread } from '@/lib/liveblocks'
import { Thread } from '@liveblocks/react-ui'
import * as Popover from '@radix-ui/react-popover'

interface InlineCommentsProps {
  userName: string
  userEmail: string
}

export function InlineComments({ userName, userEmail }: InlineCommentsProps) {
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect } | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [commentText, setCommentText] = useState('')
  const { threads } = useThreads()
  const createThread = useCreateThread()

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (sel && sel.toString().trim().length > 0) {
        const range = sel.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setSelection({ text: sel.toString(), rect })
      } else {
        setSelection(null)
        setShowComposer(false)
      }
    }

    document.addEventListener('mouseup', handleSelectionChange)
    return () => document.removeEventListener('mouseup', handleSelectionChange)
  }, [])


  const handleAddComment = () => {
    if (selection && commentText.trim()) {
      createThread({
        body: {
          version: 1,
          content: [
            {
              type: 'paragraph',
              children: [{ text: commentText }],
            },
          ],
        },
        metadata: {
          highlightedText: selection.text,
          userName,
          userEmail,
          x: selection.rect.left,
          y: selection.rect.top,
        },
      })
      
      setCommentText('')
      setShowComposer(false)
      setSelection(null)
      window.getSelection()?.removeAllRanges()
    }
  }

  return (
    <>
      {/* Comment button that appears on text selection */}
      {selection && !showComposer && (
        <button
          onClick={() => setShowComposer(true)}
          className="fixed z-50 bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          style={{
            top: `${selection.rect.top + window.scrollY - 40}px`,
            left: `${selection.rect.left + selection.rect.width / 2}px`,
            transform: 'translateX(-50%)',
          }}
        >
          💬 Add Comment
        </button>
      )}

      {/* Comment composer */}
      {showComposer && selection && (
        <Popover.Root open={showComposer} onOpenChange={setShowComposer}>
          <Popover.Anchor
            style={{
              position: 'fixed',
              top: `${selection.rect.bottom + window.scrollY}px`,
              left: `${selection.rect.left}px`,
            }}
          />
          <Popover.Portal>
            <Popover.Content
              className="z-50 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80"
              sideOffset={8}
            >
              <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-xs text-gray-600 mb-1">Commenting on:</p>
                <p className="text-sm italic text-gray-800">&ldquo;{selection.text}&rdquo;</p>
              </div>
              
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add your comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                autoFocus
              />
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Comment
                </button>
                <Popover.Close asChild>
                  <button
                    onClick={() => setCommentText('')}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </Popover.Close>
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      )}

      {/* Display existing comments as highlights */}
      {threads?.map((thread) => {
        const metadata = thread.metadata as { highlightedText?: string; x?: number; y?: number }
        if (!metadata.highlightedText) return null

        return (
          <div
            key={thread.id}
            className="fixed z-40"
            style={{
              top: `${(metadata.y || 0) + window.scrollY}px`,
              left: `${metadata.x || 0}px`,
            }}
          >
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 max-h-96 overflow-y-auto">
              <div className="mb-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <p className="text-xs text-gray-600 mb-1">Highlighted text:</p>
                <p className="text-sm italic text-gray-800">&ldquo;{metadata.highlightedText}&rdquo;</p>
              </div>
              <Thread thread={thread} />
            </div>
          </div>
        )
      })}
    </>
  )
}
