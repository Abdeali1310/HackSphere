import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { TeamMember } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function DELETE(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const teamMembers = db.collection<TeamMember>("team_members")

    // Check if current user is team leader or removing themselves
    const currentUserMembership = await teamMembers.findOne({
      userId: currentUser.id,
      teamId: params.id,
    })

    const targetMember = await teamMembers.findOne({ _id: new ObjectId(params.memberId) })

    if (!currentUserMembership || !targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Allow if user is team leader or removing themselves
    const canRemove = currentUserMembership.isLeader || targetMember.userId === currentUser.id

    if (!canRemove) {
      return NextResponse.json({ error: "Not authorized to remove this member" }, { status: 403 })
    }

    // Prevent leader from removing themselves if they're the only leader
    if (targetMember.userId === currentUser.id && currentUserMembership.isLeader) {
      const leaderCount = await teamMembers.countDocuments({
        teamId: params.id,
        isLeader: true,
      })

      if (leaderCount === 1) {
        return NextResponse.json(
          { error: "Cannot leave team as the only leader. Transfer leadership first." },
          { status: 400 },
        )
      }
    }

    await teamMembers.deleteOne({ _id: new ObjectId(params.memberId) })

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Member removal error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { isLeader } = await request.json()

    const db = await getDatabase()
    const teamMembers = db.collection<TeamMember>("team_members")

    // Check if current user is team leader
    const currentUserMembership = await teamMembers.findOne({
      userId: currentUser.id,
      teamId: params.id,
      isLeader: true,
    })

    if (!currentUserMembership) {
      return NextResponse.json({ error: "Only team leaders can change member roles" }, { status: 403 })
    }

    const result = await teamMembers.updateOne(
      { _id: new ObjectId(params.memberId) },
      { $set: { isLeader: Boolean(isLeader) } },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Member role updated successfully" })
  } catch (error) {
    console.error("Member role update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
