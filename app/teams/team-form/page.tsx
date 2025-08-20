"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Users, Crown, Copy, UserMinus, UserCheck, ArrowLeft } from "lucide-react"

interface Team {
  id: string
  name: string
  description: string
  status: string
  trackId?: string
  inviteCode: string
  eventId: string
}

interface Member {
  id: string
  userId: string
  isLeader: boolean
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    skills?: string[]
  }
}

interface TeamDetailsProps {
  team?: Team // 👈 made optional so undefined won’t crash
  currentUserId?: string
  onEdit?: () => void
  onBack?: () => void
}

export default function TeamDetails({ team, currentUserId, onEdit, onBack }: TeamDetailsProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const { toast } = useToast()

  // 🚨 Guard clause: If no team, show fallback
  if (!team) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-lg text-muted-foreground">No team found.</p>
      </div>
    )
  }

  useEffect(() => {
    fetchTeamDetails()
  }, [team.id])

  const fetchTeamDetails = async () => {
    try {
      const response = await fetch(`/api/teams/${team.id}`)
      const data = await response.json()
      if (response.ok) {
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Failed to fetch team details:", error)
    } finally {
      setLoading(false)
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
        fetchTeamDetails()
        setJoinCode("")
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

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return

    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Member removed",
          description: "Member has been removed from the team.",
        })
        fetchTeamDetails()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleToggleLeadership = async (memberId: string, isCurrentlyLeader: boolean) => {
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLeader: !isCurrentlyLeader }),
      })

      if (response.ok) {
        toast({
          title: "Role updated",
          description: `Member ${isCurrentlyLeader ? "removed from" : "promoted to"} leadership.`,
        })
        fetchTeamDetails()
      } else {
        const data = await response.json()
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update member role",
        variant: "destructive",
      })
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode)
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard.",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FORMING":
        return "bg-yellow-100 text-yellow-800"
      case "COMPLETE":
        return "bg-green-100 text-green-800"
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const currentUserMember = members.find((m) => m.userId === currentUserId)
  const isCurrentUserLeader = currentUserMember?.isLeader || false
  const isCurrentUserMember = !!currentUserMember

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-3xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(team.status)}>{team.status}</Badge>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{members.length} members</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {isCurrentUserLeader && onEdit && <Button onClick={onEdit}>Edit Team</Button>}
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{team.description}</p>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Invite Code</Label>
              <div className="flex gap-2 mt-1">
                <Input value={team.inviteCode} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={copyInviteCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Join Team Section */}
      {!isCurrentUserMember && (
        <Card>
          <CardHeader>
            <CardTitle>Join This Team</CardTitle>
            <CardDescription>Enter the invite code to join this team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button onClick={handleJoinTeam} disabled={isJoining}>
                {isJoining ? "Joining..." : "Join Team"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Current team members and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="h-12 w-12 bg-muted rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length > 0 ? (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.user.avatar || "/placeholder.svg"} alt={member.user.name} />
                      <AvatarFallback>
                        {member.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{member.user.name}</h3>
                        {member.isLeader && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Leader
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                      {member.user.skills && member.user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.user.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {member.user.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{member.user.skills.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isCurrentUserLeader && member.userId !== currentUserId && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleLeadership(member.id, member.isLeader)}
                      >
                        {member.isLeader ? <UserMinus className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member.id)}>
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {member.userId === currentUserId && !member.isLeader && (
                    <Button size="sm" variant="outline" onClick={() => handleRemoveMember(member.id)}>
                      Leave Team
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No members found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
