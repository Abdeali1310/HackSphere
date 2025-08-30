import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase()
    const user = await getCurrentUser(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teams = await db
    .collection("team_members")
    .aggregate([
      { $match: { userId: user.id } },
      {
        $lookup: {
          from: "teams",
          let: { teamId: { $toObjectId: "$teamId" } }, // convert string → ObjectId
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$teamId"] } } }
          ],
          as: "team",
        },
      },
      { $unwind: "$team" },
    ])
    .toArray()
  

    return NextResponse.json(teams.map((t) => t.team))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 })
  }
}
