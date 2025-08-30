// Create: /api/judge/assignments/route.ts
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

    // Get judge assignments using your JudgeAssignment model
    const assignments = await db.collection("judgeassignments")
      .find({ judgeId: judgeId })
      .toArray()

    console.log("Assignments found:", assignments.length)

    // Get event details and submission counts for each assignment
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const event = await db.collection("events")
          .findOne({ _id: new ObjectId(assignment.eventId) })

        // Count total submissions for this event
        const totalSubmissions = await db.collection("projectsubmissions")
          .countDocuments({ eventId: assignment.eventId })

        // Count submissions this judge has reviewed
        const reviewedSubmissions = await db.collection("scores")
          .countDocuments({ 
            judgeId: judgeId,
            // Note: You might need to adjust this query based on how scores link to events
            // Option 1: If scores have eventId
            // eventId: assignment.eventId
            // Option 2: If scores only have teamId, we need to find teams from this event
          })

        // Alternative if scores don't have eventId:
        const teamsInEvent = await db.collection("teams")
          .find({ eventId: assignment.eventId })
          .toArray()
        
        const teamIds = teamsInEvent.map(team => team._id?.toString())
        
        const reviewedByTeams = await db.collection("scores")
          .countDocuments({ 
            judgeId: judgeId,
            teamId: { $in: teamIds }
          })

        return {
          _id: assignment._id?.toString(),
          eventId: assignment.eventId,
          eventTitle: event?.title || "Unknown Event",
          eventStatus: event?.status || "UNKNOWN",
          submissionCount: totalSubmissions,
          reviewedCount: reviewedByTeams, // Use reviewedByTeams instead of reviewedSubmissions
          deadline: event?.endDate || new Date()
        }
      })
    )

    console.log("Assignments with details:", assignmentsWithDetails)

    return NextResponse.json(assignmentsWithDetails)

  } catch (error) {
    console.error("Judge assignments fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}