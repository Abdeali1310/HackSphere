import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Event } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const organizerId = searchParams.get("organizerId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const db = await getDatabase()
    const events = db.collection<Event>("events")

    // Build query
    const query: any = {}
    if (status && ["DRAFT", "PUBLISHED", "ONGOING", "COMPLETED", "CANCELLED"].includes(status)) {
      query.status = status
    }
    if (organizerId) {
      query.organizerId = organizerId
    }

    const skip = (page - 1) * limit
    const totalEvents = await events.countDocuments(query)
    const eventList = await events.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray()

    const eventsWithId = eventList.map((event) => ({
      ...event,
      id: event._id?.toString(),
    }))

    return NextResponse.json({
      events: eventsWithId,
      pagination: {
        page,
        limit,
        total: totalEvents,
        pages: Math.ceil(totalEvents / limit),
      },
    })
  } catch (error) {
    console.error("Events fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, theme, startDate, endDate, maxTeamSize, minTeamSize, banner, website } =
      await request.json()

    if (!title || !description || !theme || !startDate || !endDate || !maxTeamSize || !minTeamSize) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const events = db.collection<Event>("events")

    const now = new Date()
    const newEvent: Event = {
      title,
      description,
      theme,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: "DRAFT",
      maxTeamSize: Number.parseInt(maxTeamSize),
      minTeamSize: Number.parseInt(minTeamSize),
      banner,
      website,
      organizerId: currentUser.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await events.insertOne(newEvent)
    const event = { ...newEvent, id: result.insertedId.toString() }

    return NextResponse.json({ event })
  } catch (error) {
    console.error("Event creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
