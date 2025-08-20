"use client"

import { useState, useEffect } from "react"
import { Trophy, Medal } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  teamId: string
  team: {
    id: string
    name: string
  }
  submission: {
    id: string
    title: string
  }
  finalScore: number
  totalJudges: number
  criteriaScores: Array<{
    criteriaName: string
    avgScore: number
    maxPoints: number
    normalizedScore: number
    weight: number
    judgeCount: number
  }>
}

interface LeaderboardProps {
  eventId: string
}

export function Leaderboard({ eventId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [eventId])

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/leaderboard`)
      const data = await response.json()

      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className\
