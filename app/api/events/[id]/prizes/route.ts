import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Prize } from "@/lib/models"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const prizes = db.collection<Prize>("prizes")

    const prizeList = await prizes.find({ eventId: params.id }).sort({ position: 1 }).toArray()
    const prizesWithId = prizeList.map((prize) => ({
      ...prize,
      id: prize._id?.toString(),
    }))

    return NextResponse.json({ prizes: prizesWithId })
  } catch (error) {
    console.error("Prizes fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, amount, position, sponsor } = await request.json()

    if (!title || !description || !amount || !position) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const prizes = db.collection<Prize>("prizes")

    const newPrize: Prize = {
      title,
      description,
      amount: Number.parseInt(amount),
      position: Number.parseInt(position),
      sponsor,
      eventId: params.id,
    }

    const result = await prizes.insertOne(newPrize)
    const prize = { ...newPrize, id: result.insertedId.toString() }

    return NextResponse.json({ prize })
  } catch (error) {
    console.error("Prize creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
