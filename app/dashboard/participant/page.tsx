"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/layout/navbar"
import { Calendar, Users, Trophy, Plus, FileText, Clock, Eye, MessageCircle, User } from "lucide-react"
import Link from "next/link"
import { TeamChat } from "@/components/communication/team-chat"

interface ParticipantStats {
  eventsJoined: number
  teamsJoined: number
  submissionsMade: number
  upcomingEvents: number
}

interface Event {
  _id: string
  title: string
  status: string
  startDate: string
  endDate: string
  isRegistered: boolean
}

interface Team {
  _id: string
  name: string
  status: string
  eventTitle: string
  memberCount: number
  isLeader: boolean
}

interface Activity {
  _id: string
  userId: string
  eventId: string
  type: string
  description: string
  metadata?: any
  createdAt: string
  user?: {
    name: string
    avatar?: string
  }
}

interface ActivityFeedProps {
  limit?: number
  eventId?: string
}

function ActivityFeed({ limit = 8, eventId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchActivities()
  }, [eventId])

  const fetchActivities = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("No authentication token found.")
      setLoading(false)
      return
    }

    try {
      const params = new URLSearchParams()
      if (eventId) params.append("eventId", eventId)

      const res = await fetch(`/api/activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to fetch activities.")
        setActivities([])
      } else if (Array.isArray(data)) {
        setActivities(data.slice(0, limit))
      } else {
        setError("Unexpected data format from server.")
        setActivities([])
      }
    } catch (err) {
      console.error(err)
      setError("Error fetching activities.")
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "CREATED":
        return "bg-blue-100 text-blue-800"
      case "UPDATED":
        return "bg-yellow-100 text-yellow-800"
      case "COMMENTED":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) return <div>Loading activities...</div>
  if (error) return <div className="text-red-500">Error: {error}</div>
  if (activities.length === 0)
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No activities yet</p>
      </div>
    )

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <Card key={activity._id}>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{activity.user?.name || "Unknown User"}</p>
                <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <Badge className={`${getTypeColor(activity.type)} text-xs`}>{activity.type}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{activity.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ParticipantDashboard() {
  const [stats, setStats] = useState<ParticipantStats>({
    eventsJoined: 0,
    teamsJoined: 0,
    submissionsMade: 0,
    upcomingEvents: 0,
  })
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [myTeams, setMyTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,setError] = useState("");
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError("")
  
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("No authentication token found.")
        setLoading(false)
        return
      }
  
      // Fetch events
      const eventsRes = await fetch(`/api/events?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const eventsData = await eventsRes.json()
  
      // Fetch teams
      const teamsRes = await fetch(`/api/teams?page=1&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const teamsData = await teamsRes.json()
  
      if (!eventsRes.ok || !teamsRes.ok) {
        console.error("Error fetching dashboard data", { eventsData, teamsData })
        setError("Failed to fetch dashboard data.")
        return
      }
  
      const events = Array.isArray(eventsData.events) ? eventsData.events : []
      const teams = Array.isArray(teamsData.teams) ? teamsData.teams : []
  
      setMyEvents(events.slice(0, 5))
      setMyTeams(teams.slice(0, 5))
  
      const upcomingEvents = events.filter(
        (event) => new Date(event.startDate) > new Date()
      )
      setUpcomingEvents(upcomingEvents)
    } catch (err) {
      console.error("Error fetching dashboard data", err)
      setError("Error fetching dashboard data.")
    } finally {
      setLoading(false)
    }
  }
  

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-blue-100 text-blue-800"
      case "ONGOING":
        return "bg-green-100 text-green-800"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800"
      case "FORMING":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETE":
        return "bg-green-100 text-green-800"
      case "SUBMITTED":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading)
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div>Loading dashboard...</div>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Participant Dashboard</h1>
          <p className="text-muted-foreground">Track your hackathon journey and team progress</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Joined</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.eventsJoined}</div>
              <p className="text-xs text-muted-foreground">{stats.upcomingEvents} upcoming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teams Joined</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.teamsJoined}</div>
              <p className="text-xs text-muted-foreground">Active teams</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions Made</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submissionsMade}</div>
              <p className="text-xs text-muted-foreground">Projects submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.teamsJoined > 0 ? Math.round((stats.submissionsMade / stats.teamsJoined) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Events, Teams & Activity/Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Events */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Events</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/events">
                    <Plus className="w-4 h-4 mr-2" />
                    Browse
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {myEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No events joined yet</p>
                    <Button asChild>
                      <Link href="/events">Browse Events</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myEvents.map((event) => (
                      <div key={event._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          <Badge className={`${getStatusColor(event.status)} text-xs mt-1`}>{event.status}</Badge>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/events/${event._id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My Teams */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Teams</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/teams/team-list">
                    <Plus className="w-4 h-4 mr-2" />
                    Join
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {myTeams.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No teams joined yet</p>
                    <Button asChild>
                      <Link href="/teams/team-list">Find Teams</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTeams.map((team) => (
                      <div key={team._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{team.name}</h4>
                          <p className="text-xs text-muted-foreground">{team.eventTitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${getStatusColor(team.status)} text-xs`}>{team.status}</Badge>
                            {team.isLeader && (
                              <Badge variant="outline" className="text-xs">
                                Leader
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedTeam(team)}>
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Chat / Activity Feed */}
          <div>
            {selectedTeam ? (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTeam(null)} className="mb-4">
                  ← Back to Activity
                </Button>
                <TeamChat teamId={selectedTeam._id} teamName={selectedTeam.name} />
              </div>
            ) : (
              <ActivityFeed limit={8} />
            )}
          </div>
        </div>
        {/* Quick Actions */}
<div className="mt-8">
<Card>
  <CardHeader>
    <CardTitle>Quick Actions</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
        <Link href="/events">
          <Calendar className="w-6 h-6 mb-2" />
          Browse Events
        </Link>
      </Button>
      <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
        <Link href="/teams/team-list">
          <Users className="w-6 h-6 mb-2" />
          Find Teams
        </Link>
      </Button>
      <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
        <Link href="/profile">
          <FileText className="w-6 h-6 mb-2" />
          My Profile
        </Link>
      </Button>
      <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
        <Link href="/events?upcoming=true">
          <Clock className="w-6 h-6 mb-2" />
          Upcoming
        </Link>
      </Button>
    </div>
  </CardContent>
</Card>
</div>
      </div>
    </div>
  )
}
