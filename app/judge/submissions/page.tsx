"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/layout/navbar"
import { FileText, Clock, CheckCircle, Search, Star } from "lucide-react"
import Link from "next/link"

interface Submission {
  _id: string
  title: string
  teamName: string
  eventTitle: string
  isReviewed: boolean
  score?: number
  submittedAt: string
}

export default function JudgeSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all")

  useEffect(() => {
    fetchSubmissions()
  }, [])

  useEffect(() => {
    filterSubmissions()
  }, [submissions, searchTerm, filter])

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/judge/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setSubmissions(data)
    } catch (error) {
      console.error("Error fetching submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSubmissions = () => {
    let filtered = submissions

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (submission) =>
          submission.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply status filter
    if (filter === "pending") {
      filtered = filtered.filter((submission) => !submission.isReviewed)
    } else if (filter === "reviewed") {
      filtered = filtered.filter((submission) => submission.isReviewed)
    }

    setFilteredSubmissions(filtered)
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen">
          <div>Loading submissions...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Review Queue</h1>
          <p className="text-muted-foreground">Submissions assigned to you for evaluation</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
              All
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              onClick={() => setFilter("pending")}
              size="sm"
            >
              Pending
            </Button>
            <Button
              variant={filter === "reviewed" ? "default" : "outline"}
              onClick={() => setFilter("reviewed")}
              size="sm"
            >
              Reviewed
            </Button>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions found</h3>
              <p className="text-muted-foreground">
                {filter === "all" ? "No submissions assigned to you yet." : `No ${filter} submissions found.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((submission) => (
              <Card key={submission._id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{submission.title}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>by {submission.teamName}</span>
                        <span>•</span>
                        <span>{submission.eventTitle}</span>
                        <span>•</span>
                        <span>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {submission.isReviewed ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Reviewed
                          </Badge>
                          {submission.score && (
                            <div className="flex items-center text-sm">
                              <Star className="w-4 h-4 text-yellow-500 mr-1" />
                              {submission.score.toFixed(1)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                      <Button asChild>
                        <Link href={`/submissions/${submission._id}/evaluate`}>
                          {submission.isReviewed ? "View Review" : "Review"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
