import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")

    const { db } = await connectToDatabase()

    const query: any = {}
    if (eventId) {
      query.eventId = eventId
    }

    const activities = await db.collection("activities").find(query).sort({ createdAt: -1 }).limit(20).toArray()

    // Populate user information
    const activitiesWithUsers = await Promise.all(
      activities.map(async (activity) => {
        const user = await db.collection("users").findOne({ _id: activity.userId })
        return {
          ...activity,
          user: user ? { name: user.name, avatar: user.avatar } : null,
        }
      }),
    )

    return NextResponse.json(activitiesWithUsers)
  } catch (error) {
    console.error("Error fetching activities:", error)
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
    const { eventId, type, description, metadata } = await request.json()

    const { db } = await connectToDatabase()

    const activity = {
      userId: decoded.userId,
      eventId,
      type,
      description,
      metadata,
      createdAt: new Date(),
    }

    const result = await db.collection("activities").insertOne(activity)
    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error("Error creating activity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
