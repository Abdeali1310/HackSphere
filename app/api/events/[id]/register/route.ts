import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Registration, Event } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const registrations = db.collection<Registration>("registrations")
    const events = db.collection<Event>("events")

    // Check if event exists and is published
    const event = await events.findOne({ _id: new ObjectId(params.id) })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.status !== "PUBLISHED" && event.status !== "ONGOING") {
      return NextResponse.json({ error: "Event is not open for registration" }, { status: 400 })
    }

    // Check if user is already registered
    const existingRegistration = await registrations.findOne({
      userId: currentUser.id,
      eventId: params.id,
    })

    if (existingRegistration) {
      return NextResponse.json({ error: "Already registered for this event" }, { status: 409 })
    }

    // Create registration
    const newRegistration: Registration = {
      userId: currentUser.id,
      eventId: params.id,
      createdAt: new Date(),
    }

    const result = await registrations.insertOne(newRegistration)
    const registration = { ...newRegistration, id: result.insertedId.toString() }

    return NextResponse.json({ registration })
  } catch (error) {
    console.error("Registration error:", error)
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
    const registrations = db.collection<Registration>("registrations")

    const result = await registrations.deleteOne({
      userId: currentUser.id,
      eventId: params.id,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Registration cancelled successfully" })
  } catch (error) {
    console.error("Registration cancellation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
