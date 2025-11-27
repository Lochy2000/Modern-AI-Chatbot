import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// PATCH update a conversation
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: conversationId } = await params
    const { title, pinned, folderId } = await req.json()

    // Verify the conversation belongs to the user
    const existing = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    const conversation = await prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(pinned !== undefined && { pinned }),
        ...(folderId !== undefined && { folderId }),
        updatedAt: new Date(),
      },
      include: {
        messages: true,
        folder: true,
      },
    })

    return NextResponse.json(conversation)
  } catch (error) {
    console.error("PATCH conversation error:", error)
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    )
  }
}

// DELETE a conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: conversationId } = await params

    // Verify the conversation belongs to the user
    const existing = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    await prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE conversation error:", error)
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    )
  }
}
