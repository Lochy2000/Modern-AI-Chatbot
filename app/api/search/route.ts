import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { query } = await req.json()
    if (!query) {
      return NextResponse.json({ error: "Query required" }, { status: 400 })
    }

    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Web search is not configured. Add TAVILY_API_KEY to environment." },
        { status: 503 }
      )
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    const data = await response.json()
    return NextResponse.json({
      answer: data.answer,
      results: (data.results || []).map((r: { title: string; url: string; content: string }) => ({
        title: r.title,
        url: r.url,
        content: r.content,
      })),
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Search failed" }, { status: 500 })
  }
}
