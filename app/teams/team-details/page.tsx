"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Users, Crown, UserMinus, UserCheck, ArrowLeft, Copy } from "lucide-react"

interface Team {
  id: string
  name: string
  description: string
  status: string
  inviteCode: string
  eventId: string
}

interface Member {
  id: string
  userId: string
  isLeader: boolean
  joinedAt: string
  user: { id: string; name: string; email: string; avatar?: string; skills?: string[] }
}

interface TeamDetailsProps {
  team: Team
  currentUserId?: string
  onEdit?: () => void
  onBack?: () => void
}

export default function TeamDetails({ team, currentUserId, onEdit, onBack }: TeamDetailsProps) {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTeamDetails()
  }, [team.id])

  const fetchTeamDetails = async () => {
    try {
      const res = await fetch(`/api/teams/${team.id}`)
      const data = await res.json()
      if (res.ok) setMembers(data.members || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure?")) return
    try {
      const res = await fetch(`/api/teams/${team.id}/members/${memberId}`, { method: "DELETE" })
      if (res.ok) {
        toast({ title: "Member removed" })
        fetchTeamDetails()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleToggleLeader = async (memberId: string, isLeader: boolean) => {
    try {
      const res = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLeader: !isLeader }),
      })
      if (res.ok) fetchTeamDetails()
    } catch (err) {
      console.error(err)
    }
  }

  const copyInviteCode = () => {
    navigator.clipboard.writeText(team.inviteCode)
    toast({ title: "Copied invite code!" })
  }

  const currentUserMember = members.find((m) => m.userId === currentUserId)
  const isCurrentUserLeader = currentUserMember?.isLeader || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {onBack && <Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>}
          <h1 className="text-3xl font-bold">{team.name}</h1>
          <Badge>{team.status}</Badge>
          <div className="flex items-center gap-2 mt-1"><Users /> {members.length} members</div>
        </div>
        {isCurrentUserLeader && onEdit && <Button onClick={onEdit}>Edit Team</Button>}
      </div>

      {/* Team Info */}
      <Card>
        <CardHeader><CardTitle>Team Info</CardTitle></CardHeader>
        <CardContent>
          <p>{team.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge>{team.inviteCode}</Badge>
            <Button variant="outline" size="icon" onClick={copyInviteCode}><Copy className="h-4 w-4" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader><CardTitle>Members</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p>Loading...</p> : members.map((m) => (
            <div key={m.id} className="flex justify-between items-center p-2 border-b">
              <div className="flex items-center gap-2">
                <Avatar><AvatarImage src={m.user.avatar} /><AvatarFallback>{m.user.name[0]}</AvatarFallback></Avatar>
                <div>
                  <p>{m.user.name} {m.isLeader && <Badge><Crown />Leader</Badge>}</p>
                  <p className="text-sm text-muted-foreground">{m.user.email}</p>
                </div>
              </div>
              {isCurrentUserLeader && m.userId !== currentUserId && (
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => handleToggleLeader(m.id, m.isLeader)}>
                    {m.isLeader ? <UserMinus /> : <UserCheck />}
                  </Button>
                  <Button size="sm" onClick={() => handleRemoveMember(m.id)}><UserMinus /></Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
