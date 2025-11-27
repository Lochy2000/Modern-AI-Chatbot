import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// PATCH update a template
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, content, snippet } = await req.json()
    const templateId = params.id

    // Verify the template belongs to the user
    const existing = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    const template = await prisma.template.update({
      where: {
        id: templateId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(snippet !== undefined && { snippet }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("PATCH template error:", error)
    return NextResponse.json(
      { error: "Failed to update template" },
      { status: 500 }
    )
  }
}

// DELETE a template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const templateId = params.id

    // Verify the template belongs to the user
    const existing = await prisma.template.findFirst({
      where: {
        id: templateId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }

    await prisma.template.delete({
      where: {
        id: templateId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE template error:", error)
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    )
  }
}
