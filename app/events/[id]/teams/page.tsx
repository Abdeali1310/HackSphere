"use client"

import { useState, useEffect } from "react"
import TeamList  from "@/app/teams/team-list/page"
import  TeamForm  from "@/app/teams/team-form/page"
import  TeamDetails  from "@/app/teams/team-details/page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  role: string
  name: string
}

interface Event {
  id: string
  title: string
  status: string
}

interface Team {
  id: string
  name: string
  description: string
  status: string
  trackId?: string
  inviteCode: string
  memberCount: number
  eventId: string
}

export default function EventTeamsPage({ params }: { params: { id: string } }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchInitialData()
  }, [params.id])

  const fetchInitialData = async () => {
    try {
      const [userRes, eventRes] = await Promise.all([fetch("/api/users/profile"), fetch(`/api/events/${params.id}`)])

      const [userData, eventData] = await Promise.all([userRes.json(), eventRes.json()])

      if (userRes.ok) setCurrentUser(userData.user)
      if (eventRes.ok) setEvent(eventData.event)

      // Check registration status
      if (userRes.ok) {
        checkRegistrationStatus()
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkRegistrationStatus = async () => {
    try {
      // This would need to be implemented - checking if user is registered for the event
      setIsRegistered(true) // For now, assume registered
    } catch (error) {
      console.error("Failed to check registration:", error)
    }
  }

  const handleRegisterForEvent = async () => {
    try {
      const response = await fetch(`/api/events/${params.id}/register`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Registered!",
          description: "You have successfully registered for this event.",
        })
        setIsRegistered(true)
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register",
        variant: "destructive",
      })
    }
  }

  const handleJoinTeam = async () => {
    if (!joinCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      })
      return
    }

    setIsJoining(true)
    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCode }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Success!",
          description: "You have successfully joined the team.",
        })
        setJoinCode("")
        setShowJoinForm(false)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join team",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleTeamSuccess = () => {
    setShowCreateForm(false)
    setEditingTeam(null)
    setSelectedTeam(null)
  }

  const handleTeamEdit = (team: Team) => {
    setEditingTeam(team)
    setSelectedTeam(null)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <CardTitle>Registration Required</CardTitle>
              <CardDescription>
                You need to register for this event before you can join or create teams.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleRegisterForEvent} size="lg">
                Register for {event?.title}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {showCreateForm || editingTeam ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">{editingTeam ? "Edit Team" : "Create New Team"}</h1>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingTeam(null)
                }}
              >
                Cancel
              </Button>
            </div>
            <TeamForm
              eventId={params.id}
              team={editingTeam || undefined}
              onSuccess={handleTeamSuccess}
              onCancel={() => {
                setShowCreateForm(false)
                setEditingTeam(null)
              }}
            />
          </div>
        ) : selectedTeam ? (
          <TeamDetails
            team={selectedTeam}
            currentUserId={currentUser?.id}
            onEdit={() => handleTeamEdit(selectedTeam)}
            onBack={() => setSelectedTeam(null)}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Teams</h1>
                <p className="text-muted-foreground">Form or join a team for {event?.title}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowJoinForm(!showJoinForm)}>
                  <Users className="h-4 w-4 mr-2" />
                  Join Team
                </Button>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
              </div>
            </div>

            {showJoinForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Join a Team</CardTitle>
                  <CardDescription>Enter an invite code to join an existing team</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="joinCode">Invite Code</Label>
                      <Input
                        id="joinCode"
                        placeholder="Enter invite code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        className="font-mono"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleJoinTeam} disabled={isJoining}>
                        {isJoining ? "Joining..." : "Join"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <TeamList
              eventId={params.id}
              currentUserId={currentUser?.id}
              onTeamSelect={setSelectedTeam}
              onTeamEdit={handleTeamEdit}
            />
          </div>
        )}
      </div>
    </div>
  )
}
