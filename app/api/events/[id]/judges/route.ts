import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { JudgeAssignment, User } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const judgeAssignments = db.collection<JudgeAssignment>("judge_assignments")
    const users = db.collection<User>("users")

    const assignments = await judgeAssignments.find({ eventId: params.id }).toArray()

    const judges = await Promise.all(
      assignments.map(async (assignment) => {
        const judge = await users.findOne(
          { _id: new ObjectId(assignment.judgeId) },
          { projection: { passwordHash: 0 } },
        )
        return {
          ...assignment,
          id: assignment._id?.toString(),
          judge: judge ? { ...judge, id: judge._id?.toString() } : null,
        }
      }),
    )

    return NextResponse.json({ judges })
  } catch (error) {
    console.error("Judges fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { judgeId } = await request.json()

    if (!judgeId) {
      return NextResponse.json({ error: "Judge ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const judgeAssignments = db.collection<JudgeAssignment>("judge_assignments")
    const users = db.collection<User>("users")

    // Verify the user is a judge
    const judge = await users.findOne({ _id: new ObjectId(judgeId) })
    if (!judge || judge.role !== "JUDGE") {
      return NextResponse.json({ error: "User is not a judge" }, { status: 400 })
    }

    // Check if already assigned
    const existingAssignment = await judgeAssignments.findOne({
      judgeId,
      eventId: params.id,
    })

    if (existingAssignment) {
      return NextResponse.json({ error: "Judge already assigned to this event" }, { status: 409 })
    }

    const newAssignment: JudgeAssignment = {
      judgeId,
      eventId: params.id,
      createdAt: new Date(),
    }

    const result = await judgeAssignments.insertOne(newAssignment)
    const assignment = { ...newAssignment, id: result.insertedId.toString() }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error("Judge assignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
