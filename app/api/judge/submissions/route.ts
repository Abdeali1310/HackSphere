// Create: /api/judge/submissions/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "JUDGE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const judgeId = currentUser.id

    console.log("Judge ID:", judgeId)

    // Get events assigned to this judge
    const assignments = await db.collection("judgeassignments")
      .find({ judgeId: judgeId })
      .toArray()

    console.log("Judge assignments:", assignments.length)

    const eventIds = assignments.map(a => a.eventId)

    // Get submissions for assigned events
    const submissions = await db.collection("project_submissions")
      .find({ eventId: { $in: eventIds } })
      .sort({ submittedAt: -1 })
      .toArray()

    console.log("Submissions found:", submissions.length)

    // Get team and event details for each submission
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        const team = await db.collection("teams")
          .findOne({ _id: new ObjectId(submission.teamId) })

        const event = await db.collection("events")
          .findOne({ _id: new ObjectId(submission.eventId) })

        // Check if this judge has reviewed this submission
        const score = await db.collection("scores")
          .findOne({ 
            judgeId: judgeId, 
            teamId: submission.teamId 
          })

        return {
          _id: submission._id?.toString(),
          title: submission.title,
          teamName: team?.name || "Unknown Team",
          eventTitle: event?.title || "Unknown Event",
          isReviewed: !!score,
          score: score?.points,
          submittedAt: submission.submittedAt
        }
      })
    )

    console.log("Submissions with details:", submissionsWithDetails.length)

    return NextResponse.json(submissionsWithDetails)

  } catch (error) {
    console.error("Judge submissions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}