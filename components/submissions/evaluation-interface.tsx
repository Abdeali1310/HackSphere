"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Star } from "lucide-react"

interface ScoringCriteria {
  _id: string
  name: string
  description: string
  maxScore: number
  weight: number
}

interface Submission {
  _id: string
  title: string
  description: string
  githubUrl?: string
  demoUrl?: string
  videoUrl?: string
  technologies: string[]
  team: {
    name: string
    members: Array<{
      user: { name: string; email: string }
      role: string
    }>
  }
}

interface Score {
  criteriaId: string
  score: number
  feedback?: string
}

interface EvaluationInterfaceProps {
  eventId: string
  submissionId: string
  onScoreSubmitted?: () => void
}

export function EvaluationInterface({ eventId, submissionId, onScoreSubmitted }: EvaluationInterfaceProps) {
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [eventId, submissionId])

  const fetchData = async () => {
    try {
      const [submissionRes, criteriaRes] = await Promise.all([
        fetch(`/api/events/${eventId}/submissions`),
        fetch(`/api/events/${eventId}/scoring-criteria`),
      ])

      const submissionsData = await submissionRes.json()
      const criteriaData = await criteriaRes.json()

      const currentSubmission = submissionsData.find((s: Submission) => s._id === submissionId)
      setSubmission(currentSubmission)
      setCriteria(criteriaData)

      // Initialize scores
      const initialScores = criteriaData.map((c: ScoringCriteria) => ({
        criteriaId: c._id,
        score: 0,
        feedback: "",
      }))
      setScores(initialScores)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateScore = (criteriaId: string, field: "score" | "feedback", value: number | string) => {
    setScores((prev) => prev.map((score) => (score.criteriaId === criteriaId ? { ...score, [field]: value } : score)))
  }

  const submitScores = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/submissions/${submissionId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      })

      if (response.ok) {
        onScoreSubmitted?.()
      }
    } catch (error) {
      console.error("Error submitting scores:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  if (!submission) {
    return <div className="text-center p-8">Submission not found</div>
  }

  const totalPossibleScore = criteria.reduce((sum, c) => sum + c.maxScore * c.weight, 0)
  const currentScore = scores.reduce((sum, score) => {
    const criterion = criteria.find((c) => c._id === score.criteriaId)
    return sum + score.score * (criterion?.weight || 1)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Submission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {submission.title}
            <Badge variant="outline">{Math.round((currentScore / totalPossibleScore) * 100)}%</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{submission.description}</p>

          <div className="flex flex-wrap gap-2">
            {submission.technologies.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>

          <div className="flex gap-4">
            {submission.githubUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
            )}
            {submission.demoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Demo
                </a>
              </Button>
            )}
            {submission.videoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={submission.videoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Video
                </a>
              </Button>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">Team: {submission.team.name}</h4>
            <div className="flex flex-wrap gap-2">
              {submission.team.members.map((member, index) => (
                <Badge key={index} variant="outline">
                  {member.user.name} ({member.role})
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Criteria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {criteria.map((criterion) => {
            const score = scores.find((s) => s.criteriaId === criterion._id)
            return (
              <div key={criterion._id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{criterion.name}</h4>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                  <Badge variant="outline">Weight: {criterion.weight}x</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`score-${criterion._id}`}>Score (0-{criterion.maxScore})</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`score-${criterion._id}`}
                        type="number"
                        min="0"
                        max={criterion.maxScore}
                        value={score?.score || 0}
                        onChange={(e) => updateScore(criterion._id, "score", Number.parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      <div className="flex">
                        {Array.from({ length: criterion.maxScore }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-5 h-5 cursor-pointer ${
                              i < (score?.score || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                            onClick={() => updateScore(criterion._id, "score", i + 1)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`feedback-${criterion._id}`}>Feedback (Optional)</Label>
                    <Textarea
                      id={`feedback-${criterion._id}`}
                      placeholder="Provide constructive feedback..."
                      value={score?.feedback || ""}
                      onChange={(e) => updateScore(criterion._id, "feedback", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />
              </div>
            )
          })}

          <div className="flex justify-between items-center pt-4">
            <div className="text-lg font-medium">
              Total Score: {currentScore.toFixed(1)} / {totalPossibleScore}(
              {Math.round((currentScore / totalPossibleScore) * 100)}%)
            </div>
            <Button onClick={submitScores} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Evaluation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
