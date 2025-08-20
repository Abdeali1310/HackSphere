import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Team, TeamMember, Registration } from "@/lib/models"
import { ObjectId } from "mongodb"
import { generateInviteCode } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const db = await getDatabase()
    const teams = db.collection<Team>("teams")
    const teamMembers = db.collection<TeamMember>("team_members")

    // Build query
    const query: any = { eventId: params.id }
    if (status && ["FORMING", "COMPLETE", "SUBMITTED"].includes(status)) {
      query.status = status
    }

    const skip = (page - 1) * limit
    const totalTeams = await teams.countDocuments(query)
    const teamList = await teams.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).toArray()

    // Get member counts for each team
    const teamsWithMembers = await Promise.all(
      teamList.map(async (team) => {
        const memberCount = await teamMembers.countDocuments({ teamId: team._id?.toString() })
        return {
          ...team,
          id: team._id?.toString(),
          memberCount,
        }
      }),
    )

    return NextResponse.json({
      teams: teamsWithMembers,
      pagination: {
        page,
        limit,
        total: totalTeams,
        pages: Math.ceil(totalTeams / limit),
      },
    })
  } catch (error) {
    console.error("Teams fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, trackId } = await request.json()

    if (!name || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const teams = db.collection<Team>("teams")
    const teamMembers = db.collection<TeamMember>("team_members")
    const registrations = db.collection<Registration>("registrations")

    // Check if user is registered for the event
    const registration = await registrations.findOne({
      userId: currentUser.id,
      eventId: params.id,
    })

    if (!registration) {
      return NextResponse.json({ error: "Must be registered for the event to create a team" }, { status: 400 })
    }

    // Check if user is already in a team for this event
    const existingMembership = await teamMembers.findOne({
      userId: currentUser.id,
    })

    if (existingMembership) {
      const existingTeam = await teams.findOne({ _id: new ObjectId(existingMembership.teamId) })
      if (existingTeam && existingTeam.eventId === params.id) {
        return NextResponse.json({ error: "Already part of a team for this event" }, { status: 409 })
      }
    }

    const now = new Date()
    const inviteCode = generateInviteCode()

    // Create team
    const newTeam: Team = {
      name,
      description,
      status: "FORMING",
      inviteCode,
      eventId: params.id,
      trackId,
      createdAt: now,
      updatedAt: now,
    }

    const teamResult = await teams.insertOne(newTeam)
    const teamId = teamResult.insertedId.toString()

    // Add creator as team leader
    const newMember: TeamMember = {
      userId: currentUser.id,
      teamId,
      isLeader: true,
      joinedAt: now,
    }

    await teamMembers.insertOne(newMember)

    const team = { ...newTeam, id: teamId, memberCount: 1 }

    return NextResponse.json({ team })
  } catch (error) {
    console.error("Team creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
