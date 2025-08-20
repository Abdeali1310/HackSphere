"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, ExternalLink } from "lucide-react"

interface LeaderboardEntry {
  _id: string
  title: string
  description: string
  githubUrl?: string
  demoUrl?: string
  technologies: string[]
  team: {
    name: string
    members: Array<{
      user: { name: string }
      role: string
    }>
  }
  averageScore: number
  totalScore: number
  maxPossibleScore: number
  rank: number
}

interface LeaderboardProps {
  eventId: string
}

export function Leaderboard({ eventId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [eventId])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/leaderboard`)
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold">#{rank}</div>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-500 bg-yellow-50"
      case 2:
        return "border-gray-400 bg-gray-50"
      case 3:
        return "border-amber-600 bg-amber-50"
      default:
        return "border-border"
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading leaderboard...</div>
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center p-8">
          <p className="text-muted-foreground">No submissions have been evaluated yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
      </Card>

      {entries.map((entry) => (
        <Card key={entry._id} className={`${getRankColor(entry.rank)} transition-all hover:shadow-md`}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex items-center justify-center">{getRankIcon(entry.rank)}</div>

                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{entry.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{entry.description}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Team: {entry.team.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {entry.team.members.map((member, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {member.user.name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {entry.technologies.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {entry.githubUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={entry.githubUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {entry.demoUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={entry.demoUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Demo
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{entry.averageScore.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">
                  {entry.totalScore.toFixed(1)} / {entry.maxPossibleScore}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((entry.totalScore / entry.maxPossibleScore) * 100)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
