import { Liveblocks } from "@liveblocks/node"

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

export async function POST() {
  // Get the current user from your database
  // For now, we'll use a default user
  const user = {
    id: "anonymous-user",
    info: {
      name: "Anonymous User",
      email: "user@example.com",
    },
  }

  // Create a session for the current user
  const session = liveblocks.prepareSession(
    user.id,
    { userInfo: user.info }
  )

  // Use a naming pattern to allow access to rooms with a wildcard
  session.allow(`proposal-*`, session.FULL_ACCESS)

  // Authorize the user and return the result
  const { status, body } = await session.authorize()
  return new Response(body, { status })
}
