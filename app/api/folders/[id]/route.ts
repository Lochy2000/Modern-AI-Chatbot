import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// PATCH rename a folder
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: folderId } = await params
    const { name } = await req.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Verify the folder belongs to the user
    const existing = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    const folder = await prisma.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(folder)
  } catch (error) {
    console.error("PATCH folder error:", error)
    return NextResponse.json(
      { error: "Failed to update folder" },
      { status: 500 }
    )
  }
}

// DELETE a folder
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: folderId } = await params

    // Verify the folder belongs to the user
    const existing = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    await prisma.folder.delete({
      where: {
        id: folderId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE folder error:", error)
    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    )
  }
}
