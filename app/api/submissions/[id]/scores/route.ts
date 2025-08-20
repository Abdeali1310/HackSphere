import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Score, JudgeAssignment, ProjectSubmission } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const scores = db.collection<Score>("scores")
    const submissions = db.collection<ProjectSubmission>("project_submissions")

    const submission = await submissions.findOne({ _id: new ObjectId(params.id) })
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const scoreList = await scores.find({ teamId: submission.teamId }).toArray()
    const scoresWithId = scoreList.map((score) => ({
      ...score,
      id: score._id?.toString(),
    }))

    return NextResponse.json({ scores: scoresWithId })
  } catch (error) {
    console.error("Scores fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "JUDGE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { criteriaId, points, feedback } = await request.json()

    if (!criteriaId || points === undefined) {
      return NextResponse.json({ error: "Criteria ID and points are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const scores = db.collection<Score>("scores")
    const submissions = db.collection<ProjectSubmission>("project_submissions")
    const judgeAssignments = db.collection<JudgeAssignment>("judge_assignments")

    const submission = await submissions.findOne({ _id: new ObjectId(params.id) })
    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Check if judge is assigned to this event
    const assignment = await judgeAssignments.findOne({
      judgeId: currentUser.id,
      eventId: submission.eventId,
    })

    if (!assignment) {
      return NextResponse.json({ error: "Not assigned as judge for this event" }, { status: 403 })
    }

    // Check if score already exists for this judge, team, and criteria
    const existingScore = await scores.findOne({
      judgeId: currentUser.id,
      teamId: submission.teamId,
      criteriaId,
    })

    if (existingScore) {
      // Update existing score
      await scores.updateOne({ _id: existingScore._id }, { $set: { points: Number.parseInt(points), feedback } })
      const updatedScore = await scores.findOne({ _id: existingScore._id })
      return NextResponse.json({ score: { ...updatedScore, id: updatedScore!._id?.toString() } })
    } else {
      // Create new score
      const newScore: Score = {
        judgeId: currentUser.id,
        teamId: submission.teamId,
        criteriaId,
        points: Number.parseInt(points),
        feedback,
      }

      const result = await scores.insertOne(newScore)
      const score = { ...newScore, id: result.insertedId.toString() }
      return NextResponse.json({ score })
    }
  } catch (error) {
    console.error("Score submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
