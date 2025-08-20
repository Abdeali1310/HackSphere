"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Activity, Users, FileText, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  _id: string
  type: string
  description: string
  createdAt: string
  user: {
    name: string
    avatar?: string
  }
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  eventId?: string
  limit?: number
}

export function ActivityFeed({ eventId, limit = 10 }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
    const interval = setInterval(fetchActivities, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [eventId])

  const fetchActivities = async () => {
    try {
      const params = new URLSearchParams()
      if (eventId) params.append("eventId", eventId)

      const response = await fetch(`/api/activities?${params}`)
      const data = await response.json()
      setActivities(data.slice(0, limit))
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "TEAM_JOINED":
      case "TEAM_CREATED":
        return <Users className="w-4 h-4" />
      case "SUBMISSION_CREATED":
      case "SUBMISSION_UPDATED":
        return <FileText className="w-4 h-4" />
      case "EVENT_REGISTERED":
        return <Calendar className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "TEAM_JOINED":
      case "TEAM_CREATED":
        return "text-blue-500"
      case "SUBMISSION_CREATED":
      case "SUBMISSION_UPDATED":
        return "text-green-500"
      case "EVENT_REGISTERED":
        return "text-purple-500"
      default:
        return "text-gray-500"
    }
  }

  if (loading) {
    return <div className="flex justify-center p-4">Loading activities...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No recent activity</div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activity.user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`${getActivityColor(activity.type)}`}>{getActivityIcon(activity.type)}</div>
                    <span className="font-medium text-sm">{activity.user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
