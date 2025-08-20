"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Navbar } from "@/components/layout/navbar"
import { Gavel, Eye, Calendar, Users } from "lucide-react"
import Link from "next/link"

interface Assignment {
  _id: string
  eventId: string
  eventTitle: string
  eventStatus: string
  submissionCount: number
  reviewedCount: number
  deadline: string
}

export default function JudgeAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/judge/assignments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      console.error("Error fetching assignments:", error)
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

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div>Loading assignments...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Judge Assignments</h1>
          <p className="text-muted-foreground">Events you're assigned to judge</p>
        </div>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Gavel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No assignments yet</h3>
              <p className="text-muted-foreground">You haven't been assigned to judge any events yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {assignments.map((assignment) => {
              const progress =
                assignment.submissionCount > 0 ? (assignment.reviewedCount / assignment.submissionCount) * 100 : 0

              return (
                <Card key={assignment._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{assignment.eventTitle}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getStatusColor(assignment.eventStatus)}>{assignment.eventStatus}</Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-1" />
                            Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/events/${assignment.eventId}/submissions`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Review Submissions
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="w-4 h-4 mr-1" />
                          {assignment.submissionCount} submissions
                        </div>
                        <div className="text-sm font-medium">
                          {assignment.reviewedCount}/{assignment.submissionCount} reviewed
                        </div>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">{progress.toFixed(0)}% complete</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
