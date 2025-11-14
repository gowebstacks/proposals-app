'use client'

import { Suspense, useState, useEffect } from 'react'
import { AiChat } from '@liveblocks/react-ui'
import { RegisterAiTool, RegisterAiKnowledge } from '@liveblocks/react'
import { defineAiTool } from '@liveblocks/client'
import { useAiChats, useCreateAiChat, useDeleteAiChat, RoomProvider } from '@/lib/liveblocks'

interface LiveblocksCopilotProps {
  roomId: string
  userInfo: {
    name: string
    email: string
    avatar?: string
  }
  proposalData?: any
}

function CopilotComponent({ 
  roomId, 
  proposalData,
  onClose
}: { 
  roomId: string
  proposalData?: any
  onClose?: () => void
}) {
  const { chats } = useAiChats()
  const createAiChat = useCreateAiChat()
  const deleteAiChat = useDeleteAiChat()
  const [showChatList, setShowChatList] = useState(false)
  const [currentChatId, setCurrentChatId] = useState(`${roomId}-ai-chat`)

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    createAiChat(newChatId)
    setCurrentChatId(newChatId)
    setShowChatList(false)
  }

  const handleDeleteChat = (chatId: string) => {
    deleteAiChat(chatId)
    if (currentChatId === chatId) {
      setCurrentChatId(`${roomId}-ai-chat`)
    }
  }

  if (showChatList) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-900">All Conversations</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Chat List */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 57px)' }}>
          {chats.length > 0 ? (
            chats.map((chat) => (
              <div
                key={chat.id}
                className="group px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setCurrentChatId(chat.id)
                  setShowChatList(false)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {chat.title || 'New Conversation'}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleDateString() : 'No messages yet'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteChat(chat.id)
                    }}
                    className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    title="Delete conversation"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3,6 5,6 21,6"></polyline>
                      <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 text-sm mb-4">No conversations yet</p>
              <button
                onClick={handleNewChat}
                className="px-4 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-800 transition-colors font-medium"
              >
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[500px] bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header with back button and close button */}
      <div className="group flex items-center justify-between px-3 py-4 border-b border-gray-200 bg-gray-50" style={{ height: '64px' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded flex items-center justify-center">
            <img src="/logo_logomark.svg" alt="WebStacks" className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleNewChat}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="New conversation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
          <button
            onClick={() => setShowChatList(true)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="Chat history"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            title="Close chat"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Register all proposal data as knowledge */}
      <RegisterAiKnowledge
        description="Complete proposal data from Sanity CMS including all tabs, company information, prepared by details, and content"
        value={proposalData || { message: "No proposal data available" }}
      />
      
      <div className="h-[calc(100%-60px)]">
        <AiChat 
          chatId={currentChatId}
          copilotId="co_kUIA98lYNFAsZBhI0UNNl"
          onError={(error) => console.error('AI Chat Error:', error)}
        />
      </div>
    </div>
  )
}

export default function LiveblocksCopilot({ roomId, proposalData }: LiveblocksCopilotProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleOpenChat = () => {
      setIsVisible(true)
    }

    window.addEventListener('open-chat', handleOpenChat)
    return () => {
      window.removeEventListener('open-chat', handleOpenChat)
    }
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{}}
      initialStorage={{}}
    >
      <Suspense fallback={
        <div className="fixed bottom-4 right-4 z-50 w-96 h-32 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-sm text-gray-500">Loading AI Copilot...</div>
        </div>
      }>
        <CopilotComponent 
          roomId={roomId} 
          proposalData={proposalData}
          onClose={() => setIsVisible(false)}
        />
        
        {/* AI Tool: Summarize Document */}
        <RegisterAiTool
          name="summarize-document"
          tool={defineAiTool()({
            description: "Generate a comprehensive summary of the proposal document",
            parameters: {
              type: "object",
              properties: {
                focus: { 
                  type: "string", 
                  description: "Specific area to focus on (e.g., 'pricing', 'timeline', 'scope')" 
                }
              },
              additionalProperties: false,
            },
            execute: async ({ focus }) => {
              // This would integrate with your document analysis
              return {
                data: { 
                  summary: `Executive summary of the proposal${focus ? ` with focus on ${focus}` : ''}...`,
                  keyPoints: ["Key point 1", "Key point 2", "Key point 3"]
                },
                description: "Generated a comprehensive summary of the proposal"
              }
            }
          })}
        />
        
        {/* AI Tool: Extract Key Points */}
        <RegisterAiTool
          name="extract-key-points"
          tool={defineAiTool()({
            description: "Extract and highlight the most important points from the proposal",
            parameters: {
              type: "object",
              properties: {
                category: { 
                  type: "string", 
                  description: "Category of points to extract (e.g., 'financial', 'technical', 'timeline')" 
                }
              },
              additionalProperties: false,
            },
            execute: async ({ category }) => {
              return {
                data: { 
                  keyPoints: [
                    `Critical ${category || 'business'} requirement`,
                    `Important timeline milestone`,
                    `Key deliverable`
                  ]
                },
                description: "Extracted key points from the proposal"
              }
            }
          })}
        />
        
        {/* AI Tool: Suggest Improvements */}
        <RegisterAiTool
          name="suggest-improvements"
          tool={defineAiTool()({
            description: "Analyze the proposal and suggest improvements or optimizations",
            parameters: {
              type: "object",
              properties: {
                area: { 
                  type: "string", 
                  description: "Area to improve (e.g., 'pricing', 'scope', 'timeline', 'presentation')" 
                },
                priority: { 
                  type: "string", 
                  enum: ["high", "medium", "low"],
                  description: "Priority level of improvements" 
                }
              },
              additionalProperties: false,
            },
            execute: async ({ area }) => {
              return {
                data: { 
                  improvements: [
                    {
                      area: area || "overall",
                      suggestion: "Consider adding more detailed timeline milestones",
                      impact: "High",
                      effort: "Medium"
                    },
                    {
                      area: area || "overall", 
                      suggestion: "Include risk mitigation strategies",
                      impact: "Medium",
                      effort: "Low"
                    }
                  ]
                },
                description: "Analyzed proposal and suggested improvements"
              }
            }
          })}
        />
        
        {/* AI Tool: Analyze Pricing */}
        <RegisterAiTool
          name="analyze-pricing"
          tool={defineAiTool()({
            description: "Analyze the pricing structure and provide insights",
            parameters: {
              type: "object",
              properties: {
                comparison: { 
                  type: "boolean", 
                  description: "Include market comparison analysis" 
                },
                optimization: { 
                  type: "boolean", 
                  description: "Include cost optimization suggestions" 
                }
              },
              additionalProperties: false,
            },
            execute: async ({ comparison, optimization }) => {
              return {
                data: { 
                  totalCost: "$50,000",
                  breakdown: {
                    "Phase 1": "$15,000",
                    "Phase 2": "$20,000", 
                    "Phase 3": "$15,000"
                  },
                  insights: [
                    "Pricing is competitive for the scope",
                    "Consider phased payment structure",
                    "Include contingency budget"
                  ],
                  marketComparison: comparison ? "Below industry average by 15%" : undefined,
                  optimizations: optimization ? ["Bundle services for discount", "Adjust timeline for cost savings"] : undefined
                },
                description: "Completed pricing analysis of the proposal"
              }
            }
          })}
        />
      </Suspense>
    </RoomProvider>
  )
}
