import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

// GET all folders for the authenticated user
export async function GET() {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folders = await prisma.folder.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        conversations: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error("GET folders error:", error)
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    )
  }
}

// POST create a new folder
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      )
    }

    const folder = await prisma.folder.create({
      data: {
        userId: session.user.id,
        name,
      },
      include: {
        conversations: true,
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error("POST folder error:", error)
    return NextResponse.json(
      { error: "Failed to create folder" },
      { status: 500 }
    )
  }
}
