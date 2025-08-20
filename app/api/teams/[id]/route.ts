import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Team, TeamMember, User } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const teams = db.collection<Team>("teams")
    const teamMembers = db.collection<TeamMember>("team_members")
    const users = db.collection<User>("users")

    const team = await teams.findOne({ _id: new ObjectId(params.id) })
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Get team members with user details
    const membersList = await teamMembers.find({ teamId: params.id }).toArray()
    const members = await Promise.all(
      membersList.map(async (member) => {
        const user = await users.findOne({ _id: new ObjectId(member.userId) }, { projection: { passwordHash: 0 } })
        return {
          ...member,
          id: member._id?.toString(),
          user: user ? { ...user, id: user._id?.toString() } : null,
        }
      }),
    )

    return NextResponse.json({
      team: { ...team, id: team._id?.toString() },
      members,
    })
  } catch (error) {
    console.error("Team fetch error:", error)
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
    const teams = db.collection<Team>("teams")
    const teamMembers = db.collection<TeamMember>("team_members")

    // Check if user is team leader
    const membership = await teamMembers.findOne({
      userId: currentUser.id,
      teamId: params.id,
      isLeader: true,
    })

    if (!membership) {
      return NextResponse.json({ error: "Only team leaders can update team details" }, { status: 403 })
    }

    const updateData = await request.json()
    const allowedFields = ["name", "description", "status", "trackId"]

    const filteredUpdate: any = { updatedAt: new Date() }
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredUpdate[field] = updateData[field]
      }
    }

    const result = await teams.updateOne({ _id: new ObjectId(params.id) }, { $set: filteredUpdate })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    const updatedTeam = await teams.findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json({ team: { ...updatedTeam, id: updatedTeam!._id?.toString() } })
  } catch (error) {
    console.error("Team update error:", error)
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
    const teams = db.collection<Team>("teams")
    const teamMembers = db.collection<TeamMember>("team_members")

    // Check if user is team leader
    const membership = await teamMembers.findOne({
      userId: currentUser.id,
      teamId: params.id,
      isLeader: true,
    })

    if (!membership) {
      return NextResponse.json({ error: "Only team leaders can delete teams" }, { status: 403 })
    }

    // Delete team and all members
    await teamMembers.deleteMany({ teamId: params.id })
    await teams.deleteOne({ _id: new ObjectId(params.id) })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Team deletion error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
