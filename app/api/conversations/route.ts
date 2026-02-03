import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET all conversations for the authenticated user
export async function GET() {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: {
            timestamp: "asc",
          },
          include: {
            attachments: true,
          },
        },
        folder: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("GET conversations error:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

// POST create a new conversation
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, folderId } = await req.json()

    const conversation = await prisma.conversation.create({
      data: {
        userId: session.user.id,
        title: title || "New Conversation",
        folderId: folderId || null,
      },
      include: {
        messages: true,
        folder: true,
      },
    })

    return NextResponse.json(conversation, { status: 201 })
  } catch (error) {
    console.error("POST conversation error:", error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}
