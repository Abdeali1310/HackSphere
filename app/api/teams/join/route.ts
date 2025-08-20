import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Team, TeamMember, Registration, Event } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inviteCode } = await request.json()

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const teams = db.collection<Team>("teams")
    const teamMembers = db.collection<TeamMember>("team_members")
    const registrations = db.collection<Registration>("registrations")
    const events = db.collection<Event>("events")

    // Find team by invite code
    const team = await teams.findOne({ inviteCode: inviteCode.toUpperCase() })
    if (!team) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Check if user is registered for the event
    const registration = await registrations.findOne({
      userId: currentUser.id,
      eventId: team.eventId,
    })

    if (!registration) {
      return NextResponse.json({ error: "Must be registered for the event to join a team" }, { status: 400 })
    }

    // Check if user is already in a team for this event
    const existingMembership = await teamMembers.findOne({
      userId: currentUser.id,
    })

    if (existingMembership) {
      const existingTeam = await teams.findOne({ _id: new ObjectId(existingMembership.teamId) })
      if (existingTeam && existingTeam.eventId === team.eventId) {
        return NextResponse.json({ error: "Already part of a team for this event" }, { status: 409 })
      }
    }

    // Check team size limits
    const event = await events.findOne({ _id: new ObjectId(team.eventId) })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const currentMemberCount = await teamMembers.countDocuments({ teamId: team._id?.toString() })
    if (currentMemberCount >= event.maxTeamSize) {
      return NextResponse.json({ error: "Team is full" }, { status: 400 })
    }

    // Add user to team
    const newMember: TeamMember = {
      userId: currentUser.id,
      teamId: team._id?.toString() || "",
      isLeader: false,
      joinedAt: new Date(),
    }

    await teamMembers.insertOne(newMember)

    // Update team status if it reaches minimum size
    const newMemberCount = currentMemberCount + 1
    if (newMemberCount >= event.minTeamSize && team.status === "FORMING") {
      await teams.updateOne({ _id: team._id }, { $set: { status: "COMPLETE", updatedAt: new Date() } })
    }

    return NextResponse.json({ message: "Successfully joined team", team: { ...team, id: team._id?.toString() } })
  } catch (error) {
    console.error("Team join error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
