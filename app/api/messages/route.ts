import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// POST create a new message
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, role, content, attachments, metadata, modelId, comparisonGroupId } = await req.json()

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: "conversationId, role, and content are required" },
        { status: 400 }
      )
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        metadata: metadata || undefined,
        modelId: modelId || undefined,
        comparisonGroupId: comparisonGroupId || undefined,
        attachments: attachments?.length
          ? {
              create: attachments.map((a: { fileName: string; fileType: string; fileSize: number; url: string }) => ({
                fileName: a.fileName,
                fileType: a.fileType,
                fileSize: a.fileSize,
                url: a.url,
              })),
            }
          : undefined,
      },
      include: { attachments: true },
    })

    // Update conversation metadata
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: "desc" },
      take: 1,
    })

    const messageCount = await prisma.message.count({
      where: { conversationId },
    })

    const preview = content.substring(0, 100)

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messageCount,
        preview,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("POST message error:", error)
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    )
  }
}
