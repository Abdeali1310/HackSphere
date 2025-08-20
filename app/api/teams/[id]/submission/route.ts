import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { ProjectSubmission, TeamMember, Team } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const submissions = db.collection<ProjectSubmission>("project_submissions")

    const submission = await submissions.findOne({ teamId: params.id })

    if (!submission) {
      return NextResponse.json({ submission: null })
    }

    return NextResponse.json({ submission: { ...submission, id: submission._id?.toString() } })
  } catch (error) {
    console.error("Submission fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const teamMembers = db.collection<TeamMember>("team_members")
    const teams = db.collection<Team>("teams")
    const submissions = db.collection<ProjectSubmission>("project_submissions")

    // Check if user is a member of the team
    const membership = await teamMembers.findOne({
      userId: currentUser.id,
      teamId: params.id,
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this team" }, { status: 403 })
    }

    const team = await teams.findOne({ _id: new ObjectId(params.id) })
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const { title, description, repositoryUrl, demoUrl, videoUrl, presentationUrl, technologies } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 })
    }

    const now = new Date()

    // Check if submission already exists
    const existingSubmission = await submissions.findOne({ teamId: params.id })

    if (existingSubmission) {
      // Update existing submission
      const updateData: Partial<ProjectSubmission> = {
        title,
        description,
        repositoryUrl,
        demoUrl,
        videoUrl,
        presentationUrl,
        technologies: technologies || [],
        updatedAt: now,
      }

      await submissions.updateOne({ teamId: params.id }, { $set: updateData })
      const updatedSubmission = await submissions.findOne({ teamId: params.id })

      // Update team status to SUBMITTED
      await teams.updateOne({ _id: new ObjectId(params.id) }, { $set: { status: "SUBMITTED", updatedAt: now } })

      return NextResponse.json({ submission: { ...updatedSubmission, id: updatedSubmission!._id?.toString() } })
    } else {
      // Create new submission
      const newSubmission: ProjectSubmission = {
        teamId: params.id,
        eventId: team.eventId,
        title,
        description,
        repositoryUrl,
        demoUrl,
        videoUrl,
        presentationUrl,
        technologies: technologies || [],
        submittedAt: now,
        updatedAt: now,
      }

      const result = await submissions.insertOne(newSubmission)

      // Update team status to SUBMITTED
      await teams.updateOne({ _id: new ObjectId(params.id) }, { $set: { status: "SUBMITTED", updatedAt: now } })

      const submission = { ...newSubmission, id: result.insertedId.toString() }
      return NextResponse.json({ submission })
    }
  } catch (error) {
    console.error("Submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
