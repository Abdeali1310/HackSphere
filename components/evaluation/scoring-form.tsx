"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"

interface ScoringCriteria {
  id: string
  name: string
  description: string
  maxPoints: number
  weight: number
}

interface Score {
  id?: string
  criteriaId: string
  points: number
  feedback?: string
}

interface ScoringFormProps {
  submissionId: string
  eventId: string
  existingScores?: Score[]
  onSuccess?: () => void
}

export function ScoringForm({ submissionId, eventId, existingScores = [], onSuccess }: ScoringFormProps) {
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([])
  const [scores, setScores] = useState<Record<string, { points: number; feedback: string }>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchCriteria()
  }, [eventId])

  useEffect(() => {
    // Initialize scores with existing values
    const initialScores: Record<string, { points: number; feedback: string }> = {}
    existingScores.forEach((score) => {
      initialScores[score.criteriaId] = {
        points: score.points,
        feedback: score.feedback || "",
      }
    })
    setScores(initialScores)
  }, [existingScores])

  const fetchCriteria = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/scoring-criteria`)
      const data = await response.json()

      if (response.ok) {
        setCriteria(data.criteria || [])
      }
    } catch (error) {
      console.error("Failed to fetch criteria:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleScoreChange = (criteriaId: string, points: number) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        points,
      },
    }))
  }

  const handleFeedbackChange = (criteriaId: string, feedback: string) => {
    setScores((prev) => ({
      ...prev,
      [criteriaId]: {
        ...prev[criteriaId],
        feedback,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const promises = criteria.map(async (criterion) => {
        const score = scores[criterion.id]
        if (score && score.points !== undefined) {
          const response = await fetch(`/api/submissions/${submissionId}/scores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              criteriaId: criterion.id,
              points: score.points,
              feedback: score.feedback,
            }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || `Failed to submit score for ${criterion.name}`)
          }
        }
      })

      await Promise.all(promises)

      toast({
        title: "Scores submitted!",
        description: "Your evaluation has been submitted successfully.",
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit scores",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Form</CardTitle>
        <CardDescription>Score this project based on the defined criteria</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {criteria.map((criterion) => {
            const currentScore = scores[criterion.id] || { points: 0, feedback: "" }

            return (
              <div key={criterion.id} className="space-y-4 p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{criterion.name}</h3>
                  <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Weight: {criterion.weight}x | Max Points: {criterion.maxPoints}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>
                      Score: {currentScore.points} / {criterion.maxPoints}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={criterion.maxPoints}
                      value={currentScore.points}
                      onChange={(e) => handleScoreChange(criterion.id, Number.parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>

                  <Slider
                    value={[currentScore.points]}
                    onValueChange={([value]) => handleScoreChange(criterion.id, value)}
                    max={criterion.maxPoints}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`feedback-${criterion.id}`}>Feedback (Optional)</Label>
                  <Textarea
                    id={`feedback-${criterion.id}`}
                    placeholder="Provide constructive feedback for this criterion..."
                    value={currentScore.feedback}
                    onChange={(e) => handleFeedbackChange(criterion.id, e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )
          })}

          <Button type="submit" disabled={submitting || criteria.length === 0} className="w-full">
            {submitting ? "Submitting Scores..." : "Submit Evaluation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
