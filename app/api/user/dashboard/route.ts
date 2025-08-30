// Create: /api/user/dashboard/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getCurrentUser } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = currentUser.id

    // Get user's registered events (assuming you have an eventRegistrations collection)
    const eventRegistrations = await db.collection("eventRegistrations")
      .find({ userId: userId })
      .toArray()
    
    const eventIds = eventRegistrations.map(reg => reg.eventId)
    
    // Get event details
    const userEvents = await db.collection("events")
      .find({ _id: { $in: eventIds.map(id => new ObjectId(id)) } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    // Get user's teams
    const userTeams = await db.collection("teams")
      .find({ members: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()

    // Get user's submissions
    const userSubmissions = await db.collection("submissions")
      .find({ userId: userId })
      .toArray()

    // Calculate stats
    const now = new Date()
    const upcomingEvents = userEvents.filter(event => new Date(event.startDate) > now)

    const stats = {
      eventsJoined: userEvents.length,
      teamsJoined: userTeams.length,
      submissionsMade: userSubmissions.length,
      upcomingEvents: upcomingEvents.length
    }

    // Format events and teams with additional info
    const formattedEvents = userEvents.map(event => ({
      ...event,
      id: event._id?.toString(),
      isRegistered: true
    }))

    const formattedTeams = await Promise.all(userTeams.map(async (team) => {
      // Get event title
      const event = await db.collection("events").findOne({ _id: new ObjectId(team.eventId) })
      console.log(event)
      return {
        ...team,
        id: team._id?.toString(),
        eventTitle: event?.title || "Unknown Event",
        memberCount: team.members?.length || 0,
        isLeader: team.leaderId === userId
      }
    }))

    return NextResponse.json({
      stats,
      events: formattedEvents,
      teams: formattedTeams
    })

  } catch (error) {
    console.error("Dashboard fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET_USER_EVENTS(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userId = currentUser.id

    // Method 1: If you have eventRegistrations collection
    const registrations = await db.collection("eventRegistrations")
      .find({ userId: userId })
      .toArray()
    
    const eventIds = registrations.map(reg => new ObjectId(reg.eventId))
    
    const userEvents = await db.collection("events")
      .find({ _id: { $in: eventIds } })
      .sort({ createdAt: -1 })
      .toArray()

    

    const formattedEvents = userEvents.map(event => ({
      ...event,
      id: event._id?.toString(),
      isRegistered: true
    }))

    return NextResponse.json({ events: formattedEvents })

  } catch (error) {
    console.error("User events fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}