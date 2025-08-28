import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded?.id) {
      console.warn("Decoded token does not contain userId:", decoded)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const recipientType = searchParams.get("recipientType")
    const recipientId = searchParams.get("recipientId")

    const { db } = await connectToDatabase()

    const query: any = {}
    if (recipientType && recipientId) {
      query.recipientType = recipientType
      query.recipientId = recipientId
    }

    const messages = await db
      .collection("messages")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()

    // Populate sender information
    const messagesWithSenders = await Promise.all(
      messages.map(async (message) => {
        let sender = null
        if (message.senderId) {
          try {
            sender = await db.collection("users").findOne({ _id: new ObjectId(message.senderId) })
          } catch (err) {
            console.warn("Error fetching sender for message", message._id, err)
          }
        } else {
          console.warn("Message has null senderId:", message._id)
        }

        return {
          ...message,
          sender: sender
            ? { name: sender.name, avatar: sender.avatar }
            : { name: "Unknown", avatar: "/placeholder.svg" }, // fallback
        }
      }),
    )

    return NextResponse.json(messagesWithSenders)
  } catch (error) {
    console.error("Error fetching messages:", error)
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
    const { recipientType, recipientId, content, type = "TEXT" } = await request.json()

    const { db } = await connectToDatabase()

    const message = {
      senderId: decoded.id,
      recipientType,
      recipientId,
      content,
      type,
      createdAt: new Date(),
      readBy: [],
    }

    const result = await db.collection("messages").insertOne(message)

    // Create notifications for recipients
    if (recipientType === "TEAM") {
      const teamMembers = await db.collection("teamMembers").find({ teamId: recipientId }).toArray()
      const notifications = teamMembers
        .filter((member) => member.userId !== decoded.userId)
        .map((member) => ({
          userId: member.userId,
          type: "TEAM_MESSAGE",
          title: "New team message",
          message: content.substring(0, 100),
          data: { messageId: result.insertedId, teamId: recipientId },
          isRead: false,
          createdAt: new Date(),
        }))

      if (notifications.length > 0) {
        await db.collection("notifications").insertMany(notifications)
      }
    }

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
