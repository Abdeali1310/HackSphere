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

    const registrations = await db
      .collection("registrations")
      .find({ userId: user.id })
      .toArray()

    return NextResponse.json(registrations)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch registrations" }, { status: 500 })
  }
}
