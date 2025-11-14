import { createClient } from "@liveblocks/client"
import { createRoomContext } from "@liveblocks/react"
import { useAiChats, useCreateAiChat, useDeleteAiChat } from "@liveblocks/react/suspense"

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
})

// Simple types for Copilot functionality
type Presence = Record<string, never>
type Storage = Record<string, never>
type UserMeta = {
  id: string
  info: {
    name: string
    email: string
    avatar?: string
  }
}
type RoomEvent = Record<string, never>

export type ThreadMetadata = {
  resolved: boolean
  quote: string
  time: number
}

export const {
  suspense: {
    RoomProvider,
    useThreads,
    useUser,
    useCreateThread,
    useEditThreadMetadata,
    useCreateComment,
    useEditComment,
    useDeleteComment,
    useAddReaction,
    useRemoveReaction,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(client)

// Export AI chat management hooks
export { useAiChats, useCreateAiChat, useDeleteAiChat }
