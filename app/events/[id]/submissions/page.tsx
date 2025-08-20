"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionList } from "@/components/submissions/submission-list"
import { Leaderboard } from "@/components/submissions/leaderboard"
import { EvaluationInterface } from "@/components/submissions/evaluation-interface"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EventSubmissionsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [user, setUser] = useState<any>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

  useEffect(() => {
    // Get user from localStorage or context
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const isJudge = user?.role === "JUDGE"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/events/${eventId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">Project Submissions</h1>
        <p className="text-muted-foreground">
          {isJudge ? "Evaluate submitted projects" : "View all project submissions and rankings"}
        </p>
      </div>

      {selectedSubmission && isJudge ? (
        <div>
          <Button variant="ghost" onClick={() => setSelectedSubmission(null)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
          <EvaluationInterface
            eventId={eventId}
            submissionId={selectedSubmission}
            onScoreSubmitted={() => setSelectedSubmission(null)}
          />
        </div>
      ) : (
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">All Submissions</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <SubmissionList eventId={eventId} onEvaluate={isJudge ? setSelectedSubmission : undefined} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <Leaderboard eventId={eventId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
