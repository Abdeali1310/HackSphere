import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Event } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const events = db.collection<Event>("events")

    const event = await events.findOne({ _id: new ObjectId(params.id) })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event: { ...event, id: event._id?.toString() } })
  } catch (error) {
    console.error("Event fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const events = db.collection<Event>("events")

    // Check if user owns the event or is an organizer
    const existingEvent = await events.findOne({ _id: new ObjectId(params.id) })
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (existingEvent.organizerId !== currentUser.id && currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const updateData = await request.json()
    const allowedFields = [
      "title",
      "description",
      "theme",
      "startDate",
      "endDate",
      "status",
      "maxTeamSize",
      "minTeamSize",
      "banner",
      "website",
    ]

    const filteredUpdate: any = { updatedAt: new Date() }
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === "startDate" || field === "endDate") {
          filteredUpdate[field] = new Date(updateData[field])
        } else if (field === "maxTeamSize" || field === "minTeamSize") {
          filteredUpdate[field] = Number.parseInt(updateData[field])
        } else {
          filteredUpdate[field] = updateData[field]
        }
      }
    }

    const result = await events.updateOne({ _id: new ObjectId(params.id) }, { $set: filteredUpdate })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const updatedEvent = await events.findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json({ event: { ...updatedEvent, id: updatedEvent!._id?.toString() } })
  } catch (error) {
    console.error("Event update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const events = db.collection<Event>("events")

    // Check if user owns the event
    const existingEvent = await events.findOne({ _id: new ObjectId(params.id) })
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (existingEvent.organizerId !== currentUser.id && currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await events.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Event deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
