"use client"

import { use, useState, useEffect } from "react"
import TeamDetails from "@/app/teams/team-form/page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import TeamList from "@/app/teams/team-list/page"
import TeamForm from "@/app/teams/team-form/page"

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

export default function EventTeamsPage({ params }: { params: Promise<{ id: string }> }) {
  // ✅ unwrap params with React.use
  const { id } = use(params)

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
  }, [id]) // use unwrapped id here

  const fetchInitialData = async () => {
    try {
      const [userRes, eventRes] = await Promise.all([
        fetch("/api/users/profile"),
        fetch(`/api/events/${id}`)
      ])
      const [userData, eventData] = await Promise.all([userRes.json(), eventRes.json()])

      if (userRes.ok) setCurrentUser(userData.user)
      if (eventRes.ok) setEvent(eventData.event)

      if (userRes.ok) checkRegistrationStatus(userData.user.id)
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkRegistrationStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/events/${id}/registration-status`)
      const data = await res.json()
      setIsRegistered(data.registered)
    } catch (error) {
      console.error("Failed to check registration:", error)
    }
  }

  const handleRegisterForEvent = async () => {
    try {
      const response = await fetch(`/api/events/${id}/register`, { method: "POST" })
      if (response.ok) {
        toast({ title: "Registered!", description: "You have successfully registered." })
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
      toast({ title: "Error", description: "Please enter an invite code", variant: "destructive" })
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
        toast({ title: "Success!", description: "You joined the team." })
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

  if (loading) return <div className="container mx-auto py-8">Loading...</div>

  if (!isRegistered) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle>Registration Required</CardTitle>
            <CardDescription>You need to register to join or create teams.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRegisterForEvent} size="lg">
              Register for {event?.title}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {showCreateForm || editingTeam ? (
        <TeamForm
          eventId={id}
          team={editingTeam || undefined}
          onSuccess={handleTeamSuccess}
          onCancel={() => {
            setShowCreateForm(false)
            setEditingTeam(null)
          }}
        />
      ) : selectedTeam ? (
        <TeamDetails
          team={selectedTeam}
          currentUserId={currentUser?.id}
          onEdit={() => handleTeamEdit(selectedTeam)}
          onBack={() => setSelectedTeam(null)}
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Teams for {event?.title}</h1>
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
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Join a Team</CardTitle>
                <CardDescription>Enter invite code</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="joinCode">Invite Code</Label>
                  <Input
                    id="joinCode"
                    placeholder="Enter invite code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleJoinTeam} disabled={isJoining}>
                    {isJoining ? "Joining..." : "Join"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <TeamList
            eventId={id}
            currentUserId={currentUser?.id}
            onTeamSelect={setSelectedTeam}
            onTeamEdit={handleTeamEdit}
          />
        </>
      )}
    </div>
  )
}
