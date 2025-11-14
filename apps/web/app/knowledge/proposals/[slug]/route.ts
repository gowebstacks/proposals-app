import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getProposalBySlug } from "@/lib/sanity"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function ptToPlainText(blocks: any[] | undefined): string {
  if (!blocks || !Array.isArray(blocks)) return ""
  return blocks
    .map((block) => {
      if (block?._type === "block" && Array.isArray(block.children)) {
        return block.children.map((span: any) => span?.text ?? "").join("")
      }
      // Basic fallback for non-block nodes
      if (typeof block === "string") return block
      return ""
    })
    .filter(Boolean)
    .join("\n\n")
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  // Simple token gate: only requests with the correct token can access
  const url = new URL(req.url)
  const token = url.searchParams.get("token")
  const expected = process.env.KNOWLEDGE_CRAWL_TOKEN

  if (!expected || token !== expected) {
    // Return 404 to avoid leaking this endpoint
    return new Response("Not Found", { status: 404 })
  }

  const { slug: rawSlug } = await params
  const slug = decodeURIComponent(rawSlug)
  const proposal = await getProposalBySlug(slug)

  if (!proposal) {
    return new Response("Not Found", { status: 404 })
  }

  const title = escapeHtml(proposal.title || "Untitled Proposal")
  const companyName = escapeHtml(proposal.company?.name || "Unknown Company")

  // Build content from tabs
  let tabsHtml = ""
  if (Array.isArray(proposal.tabs)) {
    tabsHtml = proposal.tabs
      .map((tab: any, idx: number) => {
        const tabTitle = escapeHtml(tab?.title || `Section ${idx + 1}`)
        const tabText = escapeHtml(ptToPlainText(tab?.content))
        return `\n<h2>${tabTitle}</h2>\n<p>${tabText.replace(/\n/g, "<br/>")}</p>`
      })
      .join("\n")
  }

  const preparedByName = proposal.preparedBy?.firstName || proposal.preparedBy?.lastName
    ? `${proposal.preparedBy?.firstName ?? ""} ${proposal.preparedBy?.lastName ?? ""}`.trim()
    : ""
  const preparedByRole = proposal.preparedBy?.role ? `, ${proposal.preparedBy.role}` : ""

  const preparedByHtml = preparedByName
    ? `<p><strong>Prepared By:</strong> ${escapeHtml(preparedByName)}${escapeHtml(preparedByRole)}</p>`
    : ""

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Proposal Knowledge: ${title}</title>
    <style>
      body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 24px; }
      h1, h2, h3 { margin: 16px 0 8px; }
      p { margin: 8px 0; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p><strong>Company:</strong> ${companyName}</p>
    ${preparedByHtml}
    <section>
      <h2>Sections</h2>
      ${tabsHtml}
    </section>
  </body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  })
}
