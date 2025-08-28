import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { Registration } from "@/lib/models"

export async function GET(req: NextRequest, context: { params: { id: string } }) {
    const { params } = context
    const eventId = params.id
console.log(eventId);

  try {
    const currentUser = await getCurrentUser(req)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const registrations = db.collection<Registration>("registrations")

    const existingRegistration = await registrations.findOne({
      userId: currentUser.id,
      eventId: eventId,
    })

    return NextResponse.json({ registered: !!existingRegistration })
  } catch (error) {
    console.error("Registration status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
