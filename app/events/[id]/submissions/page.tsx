"use client"
import { useState, useEffect } from "react"
import { useParams, useSearchParams, usePathname } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SubmissionList } from "@/components/submissions/submission-list"
import { Leaderboard } from "@/components/submissions/leaderboard"
import { EvaluationInterface } from "@/components/submissions/evaluation-interface"
import { SubmissionForm } from "@/components/submissions/submission-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function EventSubmissionsPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // Multiple ways to get eventId depending on your route structure
  const getEventId = (): string => {
    // Method 1: From URL params (if route is /events/[id]/submissions)
    if (params?.id) {
      return params.id as string
    }
    
    // Method 2: From search params (if URL is like /submissions?eventId=123)
    const eventIdFromSearch = searchParams?.get('eventId')
    if (eventIdFromSearch) {
      return eventIdFromSearch
    }
    
    // Method 3: Extract from pathname (if route is /events/123/submissions)
    const pathSegments = pathname?.split('/') || []
    const eventsIndex = pathSegments.findIndex(segment => segment === 'events')
    if (eventsIndex !== -1 && pathSegments[eventsIndex + 1]) {
      return pathSegments[eventsIndex + 1]
    }
    
    // Method 4: From different param name (if your route uses [eventId] instead of [id])
    if (params?.eventId) {
      return params.eventId as string
    }
    
    // Fallback - you might need to adjust this
    return "default-event-id"
  }

  const eventId = getEventId()
  const [user, setUser] = useState<any>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user")
      if (userData) {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        
        // Get teamId from user object first
        if (parsedUser.teamId) {
          setTeamId(parsedUser.teamId)
        }
      }
    } catch (error) {
      console.error("Error parsing user data:", error)
    }
  }, [])

  useEffect(() => {
    const fetchUserTeam = async () => {
      if (user?.id && !teamId) { 
        try {
          const response = await fetch(`/api/users/${user.id}/team`)
  
          if (response.ok) {
            const data = await response.json()
            console.log('Team data fetched:', data)
            setTeamId(data.teamId)
  
            // Update localStorage
            const updatedUser = { ...user, teamId: data.teamId }
            localStorage.setItem('user', JSON.stringify(updatedUser))
          } else if (response.status === 404) {
            console.log('User is not in any team yet')
            setTeamId(null)
          } else {
            console.error('Error response:', await response.text())
          }
        } catch (err) {
          console.error('Error fetching team:', err)
        }
      }
    }
  
    fetchUserTeam()
  }, [user, teamId])
  
  // Debug info - remove this in production
  useEffect(() => {
    console.log("Debug info:", {
      params,
      searchParams: Object.fromEntries(searchParams?.entries() || []),
      pathname,
      eventId,
      user,
      teamId
    })
    localStorage.setItem("teamId",teamId);
  }, [params, searchParams, pathname, eventId, user, teamId])

  const isJudge = user?.role === "JUDGE"
  const isParticipant = user?.role === "PARTICIPANT"

  // Show loading state while user data is being fetched
  if (!user && typeof window !== "undefined") {
    return <div className="container mx-auto px-4 py-8">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/events/`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">Project Submissions</h1>
        <p className="text-muted-foreground">
          {isJudge
            ? "Evaluate submitted projects"
            : isParticipant
            ? "Submit and view your project"
            : "View all project submissions and rankings"}
        </p>
      </div>

      {/* Judge Evaluation Mode */}
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
        <Tabs defaultValue={isParticipant ? "submit" : "submissions"} className="space-y-6">
          <TabsList>
            {isParticipant && <TabsTrigger value="submit">Submit Project</TabsTrigger>}
            <TabsTrigger value="submissions">All Submissions</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Submit Project Form (Participants only) */}
          {isParticipant && (
            <TabsContent value="submit">
              <SubmissionForm eventId={eventId} teamId={teamId} />
            </TabsContent>
          )}

          {/* Submissions List */}
          <TabsContent value="submissions">
            <SubmissionList
              eventId={eventId}
              teamId={teamId}
              onEvaluate={isJudge ? setSelectedSubmission : undefined}
            />
          </TabsContent>

          {/* Leaderboard */}
          <TabsContent value="leaderboard">
            <Leaderboard eventId={eventId} teamId={teamId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}