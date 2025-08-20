"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Navbar } from "@/components/layout/navbar"
import { Gavel, FileText, Clock, CheckCircle, Star, Eye, BarChart3 } from "lucide-react"
import Link from "next/link"

interface JudgeStats {
  assignedEvents: number
  submissionsToReview: number
  submissionsReviewed: number
  averageScore: number
}

interface Assignment {
  _id: string
  eventId: string
  eventTitle: string
  eventStatus: string
  submissionCount: number
  reviewedCount: number
  deadline: string
}

interface Submission {
  _id: string
  title: string
  teamName: string
  eventTitle: string
  isReviewed: boolean
  score?: number
  submittedAt: string
}

export default function JudgeDashboard() {
  const [stats, setStats] = useState<JudgeStats>({
    assignedEvents: 0,
    submissionsToReview: 0,
    submissionsReviewed: 0,
    averageScore: 0,
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [assignmentsRes, submissionsRes] = await Promise.all([
        fetch("/api/judge/assignments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/judge/submissions", { headers: { Authorization: `Bearer ${token}` } }),
      ])

      const assignmentsData = await assignmentsRes.json()
      const submissionsData = await submissionsRes.json()

      setAssignments(assignmentsData.slice(0, 5))
      setRecentSubmissions(submissionsData.slice(0, 5))

      const totalSubmissions = submissionsData.length
      const reviewedSubmissions = submissionsData.filter((s: Submission) => s.isReviewed).length
      const averageScore =
        submissionsData
          .filter((s: Submission) => s.score !== undefined)
          .reduce((sum: number, s: Submission) => sum + (s.score || 0), 0) / reviewedSubmissions || 0

      setStats({
        assignedEvents: assignmentsData.length,
        submissionsToReview: totalSubmissions - reviewedSubmissions,
        submissionsReviewed: reviewedSubmissions,
        averageScore: Math.round(averageScore * 10) / 10,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ONGOING":
        return "bg-green-100 text-green-800"
      case "COMPLETED":
        return "bg-gray-100 text-gray-800"
      case "PUBLISHED":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500"
    if (progress >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div>Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Judge Dashboard</h1>
          <p className="text-muted-foreground">Review submissions and provide valuable feedback</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Events</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignedEvents}</div>
              <p className="text-xs text-muted-foreground">Active assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submissionsToReview}</div>
              <p className="text-xs text-muted-foreground">Pending submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.submissionsReviewed}</div>
              <p className="text-xs text-muted-foreground">Completed reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}</div>
              <p className="text-xs text-muted-foreground">Out of 10</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Assignments */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Event Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => {
                      const progress =
                        assignment.submissionCount > 0
                          ? (assignment.reviewedCount / assignment.submissionCount) * 100
                          : 0

                      return (
                        <div key={assignment._id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-medium">{assignment.eventTitle}</h3>
                              <Badge className={getStatusColor(assignment.eventStatus)}>{assignment.eventStatus}</Badge>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/events/${assignment.eventId}/submissions`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Review
                              </Link>
                            </Button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>
                                {assignment.reviewedCount}/{assignment.submissionCount} reviewed
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Submissions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSubmissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No submissions to review</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentSubmissions.map((submission) => (
                      <div key={submission._id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{submission.title}</h4>
                            <p className="text-xs text-muted-foreground">by {submission.teamName}</p>
                            <p className="text-xs text-muted-foreground">{submission.eventTitle}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.isReviewed ? (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Done
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <Link href="/judge/assignments">
                    <Gavel className="w-6 h-6 mb-2" />
                    My Assignments
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/judge/submissions">
                    <FileText className="w-6 h-6 mb-2" />
                    Review Queue
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/judge/analytics">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    Analytics
                  </Link>
                </Button>
                <Button variant="outline" className="h-20 flex-col bg-transparent" asChild>
                  <Link href="/profile">
                    <Star className="w-6 h-6 mb-2" />
                    Profile
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
