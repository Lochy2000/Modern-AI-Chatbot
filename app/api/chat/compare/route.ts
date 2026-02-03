import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { messages, models } = await req.json()

    if (!messages || !models || models.length < 2) {
      return NextResponse.json(
        { error: "messages and at least 2 models are required" },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPEN_ROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 503 })
    }

    // Fire all model requests in parallel (non-streaming for simplicity)
    const promises = models.map(async (model: string) => {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
        }),
      })
      const data = await response.json()
      return {
        model,
        content: data.choices?.[0]?.message?.content || "Error: No response received",
      }
    })

    const results = await Promise.allSettled(promises)
    const output = results.map((r, i) => ({
      model: models[i],
      content: r.status === "fulfilled" ? r.value.content : "Error: Request failed",
      status: r.status,
    }))

    return NextResponse.json(output)
  } catch (error) {
    console.error("Compare error:", error)
    return NextResponse.json({ error: "Comparison failed" }, { status: 500 })
  }
}
