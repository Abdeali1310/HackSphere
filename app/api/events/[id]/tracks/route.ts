import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Track } from "@/lib/models"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const tracks = db.collection<Track>("tracks")

    const trackList = await tracks.find({ eventId: params.id }).toArray()
    const tracksWithId = trackList.map((track) => ({
      ...track,
      id: track._id?.toString(),
    }))

    return NextResponse.json({ tracks: tracksWithId })
  } catch (error) {
    console.error("Tracks fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, color } = await request.json()

    if (!name || !description || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const tracks = db.collection<Track>("tracks")

    const newTrack: Track = {
      name,
      description,
      color,
      eventId: params.id,
    }

    const result = await tracks.insertOne(newTrack)
    const track = { ...newTrack, id: result.insertedId.toString() }

    return NextResponse.json({ track })
  } catch (error) {
    console.error("Track creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
