import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import type { User } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const users = db.collection<User>("users")

    const user = await users.findOne({ _id: new ObjectId(currentUser.id) })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Remove password hash from response
    const { passwordHash, ...userProfile } = user
    return NextResponse.json({ user: { ...userProfile, id: user._id?.toString() } })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, bio, skills, avatar } = await request.json()

    const db = await getDatabase()
    const users = db.collection<User>("users")

    const updateData: Partial<User> = {
      updatedAt: new Date(),
    }

    if (name) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (skills) updateData.skills = skills
    if (avatar !== undefined) updateData.avatar = avatar

    const result = await users.updateOne({ _id: new ObjectId(currentUser.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await users.findOne({ _id: new ObjectId(currentUser.id) })
    const { passwordHash, ...userProfile } = updatedUser!

    return NextResponse.json({ user: { ...userProfile, id: updatedUser!._id?.toString() } })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
