import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase()
    const user = await getCurrentUser(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1️⃣ Convert user ID to ObjectId if possible
    const userId = ObjectId.isValid(user.id) ? new ObjectId(user.id) : user.id

    // 2️⃣ Fetch team memberships for this user
    const teamMemberships = await db
      .collection("team_members")
      .find({ userId: userId })
      .toArray()

    console.log("Team memberships:", teamMemberships)

    if (teamMemberships.length === 0) {
      return NextResponse.json([]) // user has no teams
    }

    // 3️⃣ Convert teamIds to ObjectId array for query
    const teamIds = teamMemberships.map(tm =>
      ObjectId.isValid(tm.teamId) ? new ObjectId(tm.teamId) : tm.teamId
    )

    // 4️⃣ Fetch submissions for those teams
    const submissions = await db
      .collection("projectSubmissions")
      .find({ teamId: { $in: teamIds } })
      .toArray()

    console.log("Submissions:", submissions)

    return NextResponse.json(submissions)
  } catch (err) {
    console.error("Failed to fetch submissions:", err)
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    )
  }
}
