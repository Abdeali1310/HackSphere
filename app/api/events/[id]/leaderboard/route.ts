import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { Score, ScoringCriteria, Team, ProjectSubmission } from "@/lib/models"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = await getDatabase()
    const scores = db.collection<Score>("scores")
    const criteria = db.collection<ScoringCriteria>("scoring_criteria")
    const teams = db.collection<Team>("teams")
    const submissions = db.collection<ProjectSubmission>("project_submissions")

    // Get all scoring criteria for the event
    const criteriaList = await criteria.find({ eventId: params.id }).toArray()

    // Get all teams with submissions for this event
    const submissionList = await submissions.find({ eventId: params.id }).toArray()
    const teamIds = submissionList.map((s) => s.teamId)

    // Calculate scores for each team
    const leaderboard = await Promise.all(
      teamIds.map(async (teamId) => {
        const team = await teams.findOne({ _id: new ObjectId(teamId) })
        const submission = submissionList.find((s) => s.teamId === teamId)
        const teamScores = await scores.find({ teamId }).toArray()

        // Calculate weighted average score
        let totalWeightedScore = 0
        let totalWeight = 0
        const criteriaScores: any[] = []

        for (const criterion of criteriaList) {
          const criterionScores = teamScores.filter((s) => s.criteriaId === criterion._id?.toString())

          if (criterionScores.length > 0) {
            const avgScore = criterionScores.reduce((sum, score) => sum + score.points, 0) / criterionScores.length
            const normalizedScore = (avgScore / criterion.maxPoints) * 100 // Normalize to 100
            const weightedScore = normalizedScore * criterion.weight

            totalWeightedScore += weightedScore
            totalWeight += criterion.weight

            criteriaScores.push({
              criteriaId: criterion._id?.toString(),
              criteriaName: criterion.name,
              avgScore,
              maxPoints: criterion.maxPoints,
              normalizedScore,
              weight: criterion.weight,
              judgeCount: criterionScores.length,
            })
          }
        }

        const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0

        return {
          teamId,
          team: team ? { ...team, id: team._id?.toString() } : null,
          submission: submission ? { ...submission, id: submission._id?.toString() } : null,
          finalScore: Math.round(finalScore * 100) / 100,
          criteriaScores,
          totalJudges: new Set(teamScores.map((s) => s.judgeId)).size,
        }
      }),
    )

    // Sort by final score (descending)
    leaderboard.sort((a, b) => b.finalScore - a.finalScore)

    // Add rankings
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    return NextResponse.json({ leaderboard: rankedLeaderboard })
  } catch (error) {
    console.error("Leaderboard fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
