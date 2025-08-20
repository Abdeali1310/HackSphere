"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/layout/navbar"
import { BarChart3, TrendingUp, Award, Clock } from "lucide-react"

interface AnalyticsData {
  totalReviews: number
  averageScore: number
  eventsJudged: number
  reviewsThisMonth: number
  scoreDistribution: { score: number; count: number }[]
  recentActivity: { date: string; reviews: number }[]
}

export default function JudgeAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalReviews: 0,
    averageScore: 0,
    eventsJudged: 0,
    reviewsThisMonth: 0,
    scoreDistribution: [],
    recentActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - in a real app, this would fetch from an API
    setTimeout(() => {
      setAnalytics({
        totalReviews: 47,
        averageScore: 7.3,
        eventsJudged: 8,
        reviewsThisMonth: 12,
        scoreDistribution: [
          { score: 1, count: 1 },
          { score: 2, count: 2 },
          { score: 3, count: 3 },
          { score: 4, count: 5 },
          { score: 5, count: 8 },
          { score: 6, count: 7 },
          { score: 7, count: 9 },
          { score: 8, count: 6 },
          { score: 9, count: 4 },
          { score: 10, count: 2 },
        ],
        recentActivity: [
          { date: "2024-01-15", reviews: 3 },
          { date: "2024-01-14", reviews: 2 },
          { date: "2024-01-13", reviews: 5 },
          { date: "2024-01-12", reviews: 1 },
          { date: "2024-01-11", reviews: 4 },
        ],
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div>Loading analytics...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Judge Analytics</h1>
          <p className="text-muted-foreground">Your judging performance and statistics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalReviews}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageScore}</div>
              <p className="text-xs text-muted-foreground">Out of 10</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Judged</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.eventsJudged}</div>
              <p className="text-xs text-muted-foreground">Total events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.reviewsThisMonth}</div>
              <p className="text-xs text-muted-foreground">Reviews completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.scoreDistribution.map((item) => (
                  <div key={item.score} className="flex items-center gap-3">
                    <div className="w-8 text-sm font-medium">{item.score}</div>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(item.count / Math.max(...analytics.scoreDistribution.map((d) => d.count))) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-8 text-sm text-muted-foreground">{item.count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.recentActivity.map((activity) => (
                  <div key={activity.date} className="flex items-center justify-between">
                    <div className="text-sm">{new Date(activity.date).toLocaleDateString()}</div>
                    <div className="text-sm font-medium">{activity.reviews} reviews</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
