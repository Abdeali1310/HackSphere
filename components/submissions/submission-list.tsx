"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ExternalLink, Github, Play, FileText, Users } from "lucide-react"

interface Submission {
  id: string
  title: string
  description: string
  repositoryUrl?: string
  demoUrl?: string
  videoUrl?: string
  presentationUrl?: string
  technologies: string[]
  submittedAt: string
  team: {
    id: string
    name: string
  }
  members: Array<{
    user: {
      id: string
      name: string
      avatar?: string
    }
  }>
}

interface SubmissionListProps {
  eventId: string
  onSubmissionSelect?: (submission: Submission) => void
}

export function SubmissionList({ eventId, onSubmissionSelect }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  })

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      const response = await fetch(`/api/events/${eventId}/submissions?${params}`)
      const data = await response.json()

      if (response.ok) {
        setSubmissions(data.submissions)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error("Failed to fetch submissions:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [pagination.page, eventId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Submissions</CardTitle>
          <CardDescription>All submitted projects for this hackathon</CardDescription>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-20 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {submissions.map((submission) => (
            <Card key={submission.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{submission.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{submission.team.name}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{submission.members.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0" onClick={() => onSubmissionSelect?.(submission)}>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{submission.description}</p>

                {/* Team Members */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {submission.members.slice(0, 4).map((member, index) => (
                      <Avatar key={index} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={member.user.avatar || "/placeholder.svg"} alt={member.user.name} />
                        <AvatarFallback className="text-xs">
                          {member.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {submission.members.length > 4 && (
                      <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">+{submission.members.length - 4}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Technologies */}
                {submission.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {submission.technologies.slice(0, 3).map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {submission.technologies.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{submission.technologies.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Links */}
                <div className="flex gap-2 mb-4">
                  {submission.repositoryUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(submission.repositoryUrl, "_blank")
                      }}
                    >
                      <Github className="h-3 w-3" />
                    </Button>
                  )}
                  {submission.demoUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(submission.demoUrl, "_blank")
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  {submission.videoUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(submission.videoUrl, "_blank")
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  {submission.presentationUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(submission.presentationUrl, "_blank")
                      }}
                    >
                      <FileText className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">Submitted {formatDate(submission.submittedAt)}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
