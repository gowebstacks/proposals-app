'use client'

import { useAiChats, useCreateAiChat, useDeleteAiChat } from '@/lib/liveblocks'

interface ChatManagerProps {
  currentChatId?: string
  onChatSelect?: (chatId: string) => void
}

export default function ChatManager({ currentChatId, onChatSelect }: ChatManagerProps) {
  const { chats } = useAiChats()
  const createAiChat = useCreateAiChat()
  const deleteAiChat = useDeleteAiChat()

  const handleNewChat = () => {
    const newChatId = `chat-${Date.now()}`
    createAiChat(newChatId)
    onChatSelect?.(newChatId)
  }

  const handleDeleteChat = (chatId: string) => {
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteAiChat(chatId)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handleNewChat}
          className="w-full px-3 py-2 bg-white text-black text-sm rounded-md hover:bg-gray-100 transition-colors font-medium"
        >
          💬 New Chat
        </button>
      </div>

      <div className="space-y-2">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-3 rounded-lg border transition-colors ${
                currentChatId === chat.id
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onChatSelect?.(chat.id)}
                  className="flex-1 text-left text-sm font-medium text-white truncate"
                >
                  {chat.title || 'Untitled Chat'}
                </button>
                <button
                  onClick={() => handleDeleteChat(chat.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete chat"
                >
                  ❌
                </button>
              </div>
              {chat.createdAt && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(chat.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No chats yet</p>
            <p className="text-xs mt-1">Create your first AI chat to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
