import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { ScoringCriteria } from "@/lib/models"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const scoringCriteria = db.collection<ScoringCriteria>("scoring_criteria")

    const criteria = await scoringCriteria.find({ eventId: params.id }).toArray()
    const criteriaWithId = criteria.map((criterion) => ({
      ...criterion,
      id: criterion._id?.toString(),
    }))

    return NextResponse.json({ criteria: criteriaWithId })
  } catch (error) {
    console.error("Scoring criteria fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, maxPoints, weight } = await request.json()

    if (!name || !description || !maxPoints || !weight) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const scoringCriteria = db.collection<ScoringCriteria>("scoring_criteria")

    const newCriterion: ScoringCriteria = {
      name,
      description,
      maxPoints: Number.parseInt(maxPoints),
      weight: Number.parseFloat(weight),
      eventId: params.id,
    }

    const result = await scoringCriteria.insertOne(newCriterion)
    const criterion = { ...newCriterion, id: result.insertedId.toString() }

    return NextResponse.json({ criterion })
  } catch (error) {
    console.error("Scoring criteria creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
