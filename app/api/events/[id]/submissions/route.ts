import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { ProjectSubmission, Team, TeamMember, User } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const db = await getDatabase()
    const submissions = db.collection<ProjectSubmission>("project_submissions")
    const teams = db.collection<Team>("teams")
    const teamMembers = db.collection<TeamMember>("team_members")
    const users = db.collection<User>("users")

    const skip = (page - 1) * limit
    const totalSubmissions = await submissions.countDocuments({ eventId: params.id })
    const submissionList = await submissions
      .find({ eventId: params.id })
      .skip(skip)
      .limit(limit)
      .sort({ submittedAt: -1 })
      .toArray()

    // Get team and member details for each submission
    const submissionsWithDetails = await Promise.all(
      submissionList.map(async (submission) => {
        const team = await teams.findOne({ _id: new ObjectId(submission.teamId) })
        const members = await teamMembers.find({ teamId: submission.teamId }).toArray()

        const memberDetails = await Promise.all(
          members.map(async (member) => {
            const user = await users.findOne({ _id: new ObjectId(member.userId) }, { projection: { passwordHash: 0 } })
            return {
              ...member,
              id: member._id?.toString(),
              user: user ? { ...user, id: user._id?.toString() } : null,
            }
          }),
        )

        return {
          ...submission,
          id: submission._id?.toString(),
          team: team ? { ...team, id: team._id?.toString() } : null,
          members: memberDetails,
        }
      }),
    )

    return NextResponse.json({
      submissions: submissionsWithDetails,
      pagination: {
        page,
        limit,
        total: totalSubmissions,
        pages: Math.ceil(totalSubmissions / limit),
      },
    })
  } catch (error) {
    console.error("Submissions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
