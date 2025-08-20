import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get("targetType")
    const targetId = searchParams.get("targetId")

    if (!targetType || !targetId) {
      return NextResponse.json({ error: "Missing targetType or targetId" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const comments = await db.collection("comments").find({ targetType, targetId }).sort({ createdAt: 1 }).toArray()

    // Populate author information
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await db.collection("users").findOne({ _id: comment.authorId })
        return {
          ...comment,
          author: author ? { name: author.name, avatar: author.avatar } : null,
        }
      }),
    )

    return NextResponse.json(commentsWithAuthors)
  } catch (error) {
    console.error("Error fetching comments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    const { targetType, targetId, content, parentId } = await request.json()

    const { db } = await connectToDatabase()

    const comment = {
      authorId: decoded.userId,
      targetType,
      targetId,
      content,
      parentId: parentId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("comments").insertOne(comment)
    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
