import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get("participantId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    const db = await getDatabase()
    const teams = db.collection("teams")

    const query: any = {}
    if (participantId) query.members = participantId // assuming members is an array of participantIds

    const skip = (page - 1) * limit
    const totalTeams = await teams.countDocuments(query)
    const teamList = await teams.find(query).skip(skip).limit(limit).toArray()

    const teamsWithId = teamList.map((team) => ({
      ...team,
      id: team._id?.toString(),
    }))

    return NextResponse.json({
      teams: teamsWithId,
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
