import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Milestone } from "@/lib/models"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const milestones = db.collection<Milestone>("milestones")

    const milestoneList = await milestones.find({ eventId: params.id }).sort({ dueDate: 1 }).toArray()
    const milestonesWithId = milestoneList.map((milestone) => ({
      ...milestone,
      id: milestone._id?.toString(),
    }))

    return NextResponse.json({ milestones: milestonesWithId })
  } catch (error) {
    console.error("Milestones fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, dueDate } = await request.json()

    if (!title || !description || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const milestones = db.collection<Milestone>("milestones")

    const newMilestone: Milestone = {
      title,
      description,
      dueDate: new Date(dueDate),
      isCompleted: false,
      eventId: params.id,
    }

    const result = await milestones.insertOne(newMilestone)
    const milestone = { ...newMilestone, id: result.insertedId.toString() }

    return NextResponse.json({ milestone })
  } catch (error) {
    console.error("Milestone creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
