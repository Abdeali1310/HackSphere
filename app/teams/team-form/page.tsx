"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface Track {
  id: string
  name: string
  description: string
  color: string
}

interface Team {
  id?: string
  name: string
  description: string
  status: string
  trackId?: string
  inviteCode?: string
}

interface TeamFormProps {
  eventId: string
  team?: Team
  onSuccess?: (team: Team) => void
  onCancel?: () => void
}

export default function TeamForm({ eventId, team, onSuccess, onCancel }: TeamFormProps) {
  const [formData, setFormData] = useState({
    name: team?.name || "",
    description: team?.description || "",
    trackId: team?.trackId || "",
  })
  const [tracks, setTracks] = useState<Track[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchTracks()
  }, [eventId])

  const fetchTracks = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/tracks`)
      const data = await response.json()
      if (response.ok) {
        setTracks(data.tracks || [])
      }
    } catch (error) {
      console.error("Failed to fetch tracks:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = team?.id ? `/api/teams/${team.id}` : `/api/events/${eventId}/teams`
      const method = team?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save team")
      }

      toast({
        title: team?.id ? "Team updated!" : "Team created!",
        description: team?.id ? "Team has been updated successfully." : "Team has been created successfully.",
      })

      onSuccess?.(data.team)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{team?.id ? "Edit Team" : "Create New Team"}</CardTitle>
        <CardDescription>
          {team?.id ? "Update your team details" : "Form a team to participate in this hackathon"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              placeholder="Enter team name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Team Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your team and what you plan to build..."
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          {tracks.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="track">Competition Track</Label>
              <Select
                value={formData.trackId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, trackId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a track (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: track.color }} />
                        {track.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : team?.id ? "Update Team" : "Create Team"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
